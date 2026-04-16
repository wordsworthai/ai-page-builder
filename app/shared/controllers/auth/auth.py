from typing import Union
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, RedirectResponse

from app.core.config import (
    JWT_COOKIE_NAME,
    OAUTH_REDIRECT_COOKIE_NAME,
)
from app.shared.config.auth import auth_config
from app.shared.schemas.auth.auth import (
    CurrentUserResponse,
    CreateBusinessRequest,
    CreateBusinessResponse,
    DeleteAccountRequest,
    DeleteAccountResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginForm,
    LoginResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    ResetPasswordRequest,
    SignupForm,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.shared.schemas.auth.user import UserUpdate
from app.shared.services.auth.oauth_service import OAuthService, get_oauth_service
from app.shared.services.auth.users_service import UserService, get_user_service
from app.shared.services.auth.business_service import BusinessService
from app.shared.services.auth.response_service import (
    build_dashboard_redirect_from_request,
    clear_auth_cookie,
    clear_oauth_redirect_cookie,
    set_auth_cookie,
    set_oauth_redirect_cookie,
)
from app.core.db import get_async_db_session
from app.shared.models import BusinessUser, BusinessRole
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
import logging

logger = logging.getLogger(__name__)

auth_router = APIRouter()


@auth_router.get("/current", response_model=CurrentUserResponse)
async def current_user(
    request: Request,
    user_service: UserService = Depends(get_user_service),
) -> Union[CurrentUserResponse, JSONResponse]:
    """Get current authenticated user (fresh from DB)."""
    jwt_token = request.cookies.get(JWT_COOKIE_NAME)
    user_id = UserService.get_user_id_from_cookie(jwt_token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not logged in",
        )

    res = await user_service.get_current_user_from_db(user_id)
    if res is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not logged in",
        )
    return res


@auth_router.post("/login", response_model=LoginResponse)
async def login(
    form_data: LoginForm, user_service: UserService = Depends(get_user_service)
) -> JSONResponse:
    """
    Login with email and password
    
    Scenario C: OAuth-only users will receive specific error
    directing them to use Google OAuth or add password via forgot password
    """
    try:
        res = await user_service.login(form_data.email, form_data.password)
        response = JSONResponse(
            LoginResponse(
                access_token=res["access_token"],
                user=res["user"]
            ).model_dump()
        )
        
        # Set cookie with environment-appropriate config
        set_auth_cookie(response, res["access_token"])
        
        return response
    except HTTPException as e:
        # Check if it's an OAuth-only account error (Scenario C)
        if isinstance(e.detail, dict) and e.detail.get("error") == "oauth_only_account":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=e.detail
            )
        raise


@auth_router.get("/logout")
async def logout() -> JSONResponse:
    """Logout user by deleting JWT cookie"""
    response = JSONResponse({"success": True})
    clear_auth_cookie(response)
    return response


@auth_router.post("/signup", response_model=LoginResponse)
async def signup(
    form_data: SignupForm,
    user_service: UserService = Depends(get_user_service),
) -> JSONResponse:
    """
    Sign up new user with email and password.
    
    Creates user account only. Business creation is handled separately via
    /api/auth/business/create endpoint after authentication.
    
    Guaranteed Actions:
    - Creates user in users table
    - Generates email verification token
    - Sends verification email (non-blocking)
    
    Scenario B: If email exists with OAuth, returns specific error
    directing user to use Google OAuth or forgot password.
    """
    try:
        # Create user (generates verification token and sends email)
        user = await user_service.create_user(form_data)
        # Refresh to ensure we have latest state from database
        await user_service.db.refresh(user)
        
        # Create access token without business_id (user doesn't have business yet)
        res = await user_service.create_access_token_from_user(user)
        
        response = JSONResponse(
            LoginResponse(
                access_token=res["access_token"],
                user=res["user"]
            ).model_dump()
        )
        
        # Set cookie with environment-appropriate config
        set_auth_cookie(response, res["access_token"])
        
        return response
    except HTTPException as e:
        # Check if it's Scenario B (OAuth user trying to signup)
        if isinstance(e.detail, dict) and e.detail.get("error") == "email_already_exists":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=e.detail
            )
        raise
    except Exception as e:
        logger.error(f"Error during signup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account. Please try again."
        )


@auth_router.get("/google_callback", response_model=LoginResponse)
async def google_callback(
    request: Request,
    user_service: UserService = Depends(get_user_service),
) -> JSONResponse:
    """
    Google OAuth callback handler
    
    Scenario A: If email exists from email signup, merges accounts and auto-verifies
    Creates business for new OAuth users who don't have a business_id.
    """
    res = await user_service.login_oauth("GOOGLE_OAUTH2")
    
    user_id_str = res["user"].user_id
    has_business = res["user"].business_id is not None
    
    # Double-check in database if response says no business
    if not has_business:
        business_user_stmt = select(BusinessUser).where(
            BusinessUser.user_id == uuid.UUID(user_id_str),
            BusinessUser.role == BusinessRole.OWNER.value
        ).limit(1)
        business_user_result = await user_service.db.execute(business_user_stmt)
        existing_business_user = business_user_result.scalar_one_or_none()
        has_business = existing_business_user is not None
    
    if not has_business:
        try:
            user_id = uuid.UUID(user_id_str)
            business_service = BusinessService(user_service.db)
            # Create business with email as business name
            business = await business_service.create_business_with_owner(
                user_id=user_id,
                business_data={
                    "business_name": res["user"].email,
                }
            )
            business_id_str = str(business.business_id)
            # Commit the transaction
            await user_service.db.commit()
            # Update access token with new business_id
            user = await user_service.get_user_by_id(user_id_str)
            updated_res = await user_service.create_access_token_from_user(user, business_id=business_id_str)
            # Update res with new token and user data
            res = updated_res
            logger.info(f"Created business {business_id_str} for OAuth user {user_id_str}")
        except Exception as e:
            logger.error(f"Failed to create business for OAuth user {user_id_str}: {str(e)}", exc_info=True)
    
    redirect_after_login = (
        request.cookies.get(OAUTH_REDIRECT_COOKIE_NAME)
        or auth_config.get_redirect_after_login()
    )
    response = RedirectResponse(url=redirect_after_login)
    
    # Set cookie with environment-appropriate config
    set_auth_cookie(response, res["access_token"])

    # Clean up short-lived OAuth redirect cookie once consumed
    clear_oauth_redirect_cookie(response)
    
    return response


@auth_router.get("/google/authorize")
async def google_authorize(
    request: Request,
    oauth_service: OAuthService = Depends(get_oauth_service),
) -> RedirectResponse:
    """Redirect to Google OAuth authorization"""
    redirect_after_login = build_dashboard_redirect_from_request(request)
    authorization_url = oauth_service.google_login()
    response = RedirectResponse(authorization_url)
    set_oauth_redirect_cookie(response, redirect_after_login)

    return response


@auth_router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(
    request_data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_async_db_session),
) -> VerifyEmailResponse:
    """
    Verify user's email address using token from email
    
    No authentication required - token proves email ownership
    Single-use token that expires in 24 hours
    """
    # Create user_service without current_user
    user_service = UserService(db, None, None)
    await user_service.verify_email(request_data.token)
    
    return VerifyEmailResponse(
        message="Email verified successfully! You can now access all features.",
        verified=True
    )


@auth_router.post("/resend-verification", response_model=ResendVerificationResponse)
async def resend_verification(
    request_data: ResendVerificationRequest,
    user_service: UserService = Depends(get_user_service),
) -> ResendVerificationResponse:
    """
    Resend email verification link
    
    Rate limited: 3 emails per hour per user
    TODO: Implement Redis-based rate limiting for production
    """
    await user_service.resend_verification_email(request_data.email)
    return ResendVerificationResponse(
        message="If your email exists in our system, you will receive a verification link shortly."
    )


@auth_router.put("/profile", response_model=UserUpdate, status_code=status.HTTP_200_OK)
async def update_user_profile(
    user_update: UserUpdate,
    user_service: UserService = Depends(get_user_service),
):
    """Update user profile information"""
    user = await user_service.update_profile(user_update)
    res = await user_service.create_access_token_from_user(user)
    response = JSONResponse(
        LoginResponse(
            access_token=res["access_token"],
            user=res["user"]
        ).model_dump()
    )
    
    # Update cookie with new user data
    set_auth_cookie(response, res["access_token"])
    
    return response


@auth_router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    user_service: UserService = Depends(get_user_service),
) -> ForgotPasswordResponse:
    """
    Request password reset or password setup email
    
    Unified flow: Handles both password reset (existing password users)
    and password setup (OAuth users adding password)
    
    Email adapts based on whether user has password or not
    """
    await user_service.forgot_password(request_data.email)
    return ForgotPasswordResponse(
        message="If the email exists in our system, you will receive password reset instructions."
    )


@auth_router.post("/reset-password", response_model=ForgotPasswordResponse)
async def reset_password(
    request_data: ResetPasswordRequest,
    user_service: UserService = Depends(get_user_service),
) -> ForgotPasswordResponse:
    """
    Reset password or set up password using token
    
    Handles both:
    - Password reset for existing password users
    - Password setup for OAuth users (sets auth_provider='merged')
    
    Single-use token that expires in 24 hours
    """
    await user_service.reset_password(request_data.token, request_data.password)
    return ForgotPasswordResponse(
        message="Password has been set successfully. You can now sign in with your new password."
    )


@auth_router.delete("/account", response_model=DeleteAccountResponse)
async def delete_account(
    request_data: DeleteAccountRequest,
    user_service: UserService = Depends(get_user_service),
) -> JSONResponse:
    """
    Delete user account (soft delete with 30-day retention)
    
    Soft deletes the user account with a 30-day retention period.
    After 30 days, all user data will be permanently deleted.
    
    Requirements:
    - For email/merged users: password confirmation required
    - For OAuth-only users: only DELETE confirmation required
    - Must type "DELETE" to confirm
    
    Returns deletion confirmation and scheduled permanent deletion date.
    """
    result = await user_service.delete_account(request_data)
    
    response = JSONResponse(
        DeleteAccountResponse(
            message=result["message"],
            deletion_scheduled_at=result["deletion_scheduled_at"]
        ).model_dump()
    )
    
    # Clear auth cookie to log user out
    clear_auth_cookie(response)
    
    return response


@auth_router.post("/business/create", response_model=CreateBusinessResponse)
async def create_business(
    business_data: CreateBusinessRequest,
    user_service: UserService = Depends(get_user_service),
    db: AsyncSession = Depends(get_async_db_session),
) -> JSONResponse:
    """
    Create or update a business for the authenticated user.
    
    This endpoint is used when a user signs up via OAuth and needs to create
    a business from the Create Site flow data, or when updating an existing business.
    
    - If user doesn't have a business: Creates a new business with provided data
    - If user already has a business: Updates the existing business with provided data
      (partial update - only provided fields are updated)
    
    Uses a transaction to prevent race conditions when multiple requests arrive simultaneously.
    """
    if not user_service.current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )
    
    user_id_str = user_service.current_user.user_id
    user_id = uuid.UUID(user_id_str)
    business_payload = business_data.model_dump()
    
    # Use a transaction to prevent race conditions
    # If two requests arrive simultaneously, only one will succeed
    is_update = False
    try:
        async with db.begin():
            # Re-check inside transaction to prevent race conditions
            # This ensures that even if two requests check at the same time,
            # only one will create a business
            business_user_stmt = select(BusinessUser).where(
                BusinessUser.user_id == user_id,
                BusinessUser.role == BusinessRole.OWNER.value  # ✅
            ).limit(1)

            business_user_result = await db.execute(business_user_stmt)
            existing_business_user = business_user_result.scalar_one_or_none()
            
            business_service = BusinessService(db)
            
            if existing_business_user:
                # User already has a business, update it with provided data
                is_update = True
                business_id = existing_business_user.business_id
                # Note: intent, tone, and color_palette_id are ignored here.
                # They are passed for backward compatibility but not saved.
                business = await business_service.update_business_data(
                    business_id=business_id,
                    business_data={
                        "business_name": business_data.business_name,
                        "google_maps_url": business_data.google_maps_url,
                        "yelp_url": business_data.yelp_url,
                        # Legacy fields (ignored by business_service, stored in MongoDB per-generation):
                        "intent": business_data.intent,
                        "tone": business_data.tone,
                        "color_palette_id": business_data.color_palette_id,
                    }
                )
                business_id_str = str(business_id)
            else:
                # Create business - the service will flush within this transaction
                # Note: intent, tone, and color_palette_id are ignored here.
                # They are passed for backward compatibility but not saved.
                business = await business_service.create_business_with_owner(
                    user_id=user_id,
                    business_data={
                        "business_name": business_data.business_name,
                        "google_maps_url": business_data.google_maps_url,
                        "yelp_url": business_data.yelp_url,
                        # Legacy fields (ignored by business_service, stored in MongoDB per-generation):
                        "intent": business_data.intent,
                        "tone": business_data.tone,
                        "color_palette_id": business_data.color_palette_id,
                    }
                )
                business_id_str = str(business.business_id)
            # Transaction will commit automatically when exiting the context
        
        # Run product-registered post-business-create hooks (non-blocking)
        await auth_config.run_on_business_created(
            business_id=business_id_str,
            business_data=business_payload,
            db=db,
        )
        
        # Update user's access token with business_id
        user = await user_service.get_user_by_id(user_id_str)
        res = await user_service.create_access_token_from_user(user, business_id=business_id_str)

        message = "Business updated successfully" if is_update else "Business created successfully"
        
        response = JSONResponse(
            CreateBusinessResponse(
                message=message,
                business_id=business_id_str
            ).model_dump()
        )
        
        # Update cookie with new business_id
        set_auth_cookie(response, res["access_token"])
        
        return response
        
    except Exception as e:
        # Check if it's an integrity error (duplicate business_user) - means another request already created it
        if isinstance(e, IntegrityError):
            # Another request already created the business, fetch and return it
            business_user_stmt = select(BusinessUser).where(
                BusinessUser.user_id == user.id,
                BusinessUser.role == BusinessRole.OWNER.value  # Sends 'owner' ✅
            ).limit(1)

            business_user_result = await db.execute(business_user_stmt)
            existing_business_user = business_user_result.scalar_one_or_none()
            
            if existing_business_user:
                user = await user_service.get_user_by_id(user_id_str)
                res = await user_service.create_access_token_from_user(user, business_id=str(existing_business_user.business_id))
                
                response = JSONResponse(
                    CreateBusinessResponse(
                        message="Business already exists (created by another request)",
                        business_id=str(existing_business_user.business_id)
                    ).model_dump()
                )
                set_auth_cookie(response, res["access_token"])
                return response
        
        logger.error(f"Error creating business: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create business. Please try again."
        )