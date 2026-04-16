import secrets
import uuid
from datetime import datetime, timedelta, UTC
from typing import Optional, Union, cast

from fastapi import Depends, HTTPException, Request, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    JWT_COOKIE_NAME,
    SECRET_KEY,
    VERIFICATION_TOKEN_EXPIRE_HOURS,
    RESET_TOKEN_EXPIRE_HOURS,
)
from app.core.db import get_async_db_session
from app.shared.models import Business, BusinessRole, BusinessUser, User
from app.shared.schemas.auth.auth import CurrentUserResponse, SignupForm, DeleteAccountRequest
from app.shared.schemas.auth.user import UserUpdate
from app.shared.services.auth.oauth_service import OAuthService
from app.shared.utils.sendgrid_email import send_verification_email, send_password_reset_email

OAUTH_SERVICES = ["GOOGLE_OAUTH2"]


# Simple in-memory rate limiter for email resend
# TODO: Replace with Redis or proper rate limiting library (slowapi) in production
class InMemoryRateLimiter:
    def __init__(self):
        self.attempts = {}  # {email: [timestamp1, timestamp2, ...]}
    
    def check_rate_limit(self, email: str, max_attempts: int, window_minutes: int) -> bool:
        """Check if email has exceeded rate limit. Returns True if allowed, False if rate limited."""
        now = datetime.now(UTC).replace(tzinfo=None)
        cutoff = now - timedelta(minutes=window_minutes)
        
        # Clean old attempts
        if email in self.attempts:
            self.attempts[email] = [ts for ts in self.attempts[email] if ts > cutoff]
        else:
            self.attempts[email] = []
        
        # Check if under limit
        if len(self.attempts[email]) >= max_attempts:
            return False
        
        # Record this attempt
        self.attempts[email].append(now)
        return True


# Global rate limiter instance
# TODO: Move to Redis for multi-instance deployments
verification_rate_limiter = InMemoryRateLimiter()


class UserService:
    def __init__(
        self,
        db: AsyncSession,
        current_user: Optional[CurrentUserResponse],
        request: Request,
    ):
        self.db = db
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.current_user = current_user
        self.request = request
        self.oauth_service = OAuthService(db, request)

    async def get_user_by_id(self, user_id: str) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        return result.scalar()

    async def get_user_by_stripe_customer_id(self, stripe_customer_id: str) -> User:
        result = await self.db.execute(
            select(User).where(User.stripe_customer_id == stripe_customer_id)
        )
        return result.scalar()

    async def get_user(self) -> User:
        return await self.get_user_by_id(self.current_user.user_id)

    async def login(self, email: str, password: str) -> dict:
        user = await self.authenticate_user(email, password)
        return await self.create_access_token_from_user(user)

    async def login_oauth(self, oauth_service: str) -> dict:
        """
        Handle OAuth login with account merging support
        
        Scenario A: Email signup first, then Google OAuth
        - Merges accounts, sets auth_provider='merged', auto-verifies email
        """
        if oauth_service not in OAUTH_SERVICES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth service",
            )
        
        user_data = self.oauth_service.google_callback()
        user = await self.get_user_by_email(user_data["email"])
        
        if not user:
            # New OAuth user - create account
            user = await self.create_oauth_user(user_data)
        elif user.deleted:
            # Deleted user trying to log in via OAuth
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This account has been deleted. Please contact support if you believe this is an error."
            )
        else:
            # Existing user - handle merging (Scenario A)
            if user.auth_provider == "email" and not user.verified:
                # User signed up with email but didn't verify
                # OAuth proves email ownership - merge and auto-verify
                user.auth_provider = "merged"
                user.verified = True
                user.google_id = user_data.get("sub") or user_data.get("id")
                user.last_login = datetime.now(UTC).replace(tzinfo=None)
                
                self.db.add(user)
                await self.db.commit()
                await self.db.refresh(user)
            elif user.auth_provider == "email" and user.verified:
                # Verified email user adding OAuth
                user.auth_provider = "merged"
                user.google_id = user_data.get("sub") or user_data.get("id")
                user.last_login = datetime.now(UTC).replace(tzinfo=None)
                
                self.db.add(user)
                await self.db.commit()
                await self.db.refresh(user)
            else:
                # ✅ FIX: Existing OAuth user (google/merged) logging in again
                # Update last_login and refresh
                user.last_login = datetime.now(UTC).replace(tzinfo=None)
                
                self.db.add(user)
                await self.db.commit()
                await self.db.refresh(user)
        
        return await self.create_access_token_from_user(user)

    async def create_access_token_from_user(self, user: User, business_id: str | None = None):
        email = user.email
        user_id = str(user.id)
        full_name = user.full_name
        verified = user.verified
        auth_provider = user.auth_provider
        business_name: str | None = None
        
        # Get business_id if not provided
        if business_id is None:
            business_user_stmt = select(BusinessUser).where(
                BusinessUser.user_id == user.id,
                BusinessUser.role == BusinessRole.OWNER.value  # Sends 'owner' ✅
            ).limit(1)

            print(f"DEBUG: Comparing role value: {BusinessRole.OWNER.value}")
            print(f"DEBUG: Full query params: user_id={user.id}, role={BusinessRole.OWNER.value}")

            business_user_result = await self.db.execute(business_user_stmt)
            business_user = business_user_result.scalar_one_or_none()
            if business_user:
                business_id = str(business_user.business_id)
                business = await self.db.get(Business, business_user.business_id)
                business_name = business.business_name if business else None
            else:
                business_id = None
        elif business_id:
            business_uuid = uuid.UUID(business_id)
            business = await self.db.get(Business, business_uuid)
            business_name = business.business_name if business else None
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(
            data={
                "sub": email,
                "user_id": user_id,
                "business_id": business_id,
                "business_name": business_name,
                "full_name": full_name,
                "verified": verified,
                "auth_provider": auth_provider,
            },
            expires_delta=access_token_expires,
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": CurrentUserResponse(
                user_id=user_id,
                email=email,
                full_name=full_name,
                verified=verified,
                auth_provider=auth_provider,
                business_id=business_id,
                business_name=business_name,
            )
        }
    
    def create_access_token_from_user_data(
        self,
        email: str,
        user_id: str,
        full_name: str,
        verified: bool,
        auth_provider: str,
        business_id: str | None = None,
        business_name: str | None = None,
    ) -> dict:
        """
        Create access token from user data (primitive values).
        """
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(
            data={
                "sub": email,
                "user_id": user_id,
                "business_id": business_id,
                "business_name": business_name,
                "full_name": full_name,
                "verified": verified,
                "auth_provider": auth_provider,
            },
            expires_delta=access_token_expires,
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": CurrentUserResponse(
                user_id=user_id,
                email=email,
                full_name=full_name,
                verified=verified,
                auth_provider=auth_provider,
                business_id=business_id,
                business_name=business_name,
            )
        }

    def generate_verification_token(self) -> str:
        """Generate cryptographically secure random token for email verification"""
        return secrets.token_urlsafe(32)

    async def create_user(self, data: SignupForm) -> User:
        """
        Create new user with email verification
        
        Scenario B: OAuth user trying to signup with email/password
        - Returns error directing them to OAuth or forgot password
        
        Full name is extracted from email prefix (e.g., john.doe@gmail.com -> john.doe)
        """
        # Check if email already exists (Scenario B)
        existing_user = await self.get_user_by_email(data.email)
        if existing_user:
            # Scenario B: OAuth user trying to signup
            if existing_user.auth_provider in ["google", "merged"] or existing_user.password_hash is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": "email_already_exists",
                        "message": "This email is already registered with Google Sign-In",
                        "suggestion": "Sign in with Google, or use 'Forgot Password' to add a password to your account",
                        "auth_methods": ["google"],
                    }
                )
            else:
                # Regular duplicate email
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered."
                )

        # Extract full_name from email prefix
        email_prefix = data.email.split('@')[0]
        full_name = email_prefix  # Keep as-is, user can update later in settings
        
        # Generate verification token
        verification_token = self.generate_verification_token()
        token_expires_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
        
        hashed_password = self.get_password_hash(data.password)
        email = data.email.lower()
        email_full_name = full_name
        
        stmt = (
            insert(User)
            .values(
                email=email,
                password_hash=hashed_password,
                full_name=email_full_name,
                verified=False,
                auth_provider="email",
                email_verification_token=verification_token,
                email_verification_expires_at=token_expires_at,
            )
            .returning(User)
        )

        try:
            result = await self.db.execute(stmt)
            await self.db.flush()
            await self.db.commit()
            new_user = result.scalar_one()  # ✅ Use scalar_one() instead of fetchone()
            
            
            # Send verification email (non-blocking - don't fail signup if email fails)
            try:
                await send_verification_email(
                    email,
                    email_full_name,
                    verification_token
                )
            except Exception as e:
                # Log error but don't fail user creation
                print(f"Failed to send verification email: {e}")
            
            return cast(User, new_user)
            
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered."
            )

    async def verify_email(self, token: str) -> bool:
        """
        Verify user's email using token
        
        NO authentication required - anyone with valid token can verify
        """
        # Find user with this verification token
        result = await self.db.execute(
            select(User).where(User.email_verification_token == token)
        )
        user = result.scalar()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
        
        # Check if token expired
        if user.email_verification_expires_at < datetime.now(UTC).replace(tzinfo=None):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired. Please request a new one."
            )
        
        # Check if already verified
        if user.verified:
            # Already verified - just clear token and return success
            user.email_verification_token = None
            user.email_verification_expires_at = None
            self.db.add(user)
            await self.db.commit()
            return True
        
        # Verify the user
        user.verified = True
        user.email_verification_token = None  # Single-use token
        user.email_verification_expires_at = None
        
        self.db.add(user)
        await self.db.commit()
        
        return True

    async def resend_verification_email(self, email: str) -> bool:
        """
        Resend verification email with rate limiting
        
        Rate limit: 3 emails per hour per user
        TODO: Replace in-memory rate limiter with Redis for production
        """
        # Check rate limit (3 per hour)
        if not verification_rate_limiter.check_rate_limit(email, max_attempts=3, window_minutes=60):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many verification emails sent. Please try again later."
            )
        
        user = await self.get_user_by_email(email)
        if not user:
            # Don't reveal if email exists - return success
            return True
        
        if user.verified:
            # Already verified
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already verified"
            )
        
        # Generate new token
        verification_token = self.generate_verification_token()
        token_expires_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
        
        # Update user with new token
        user_email = user.email
        user_full_name = user.full_name
        user.email_verification_token = verification_token
        user.email_verification_expires_at = token_expires_at
        
        self.db.add(user)
        await self.db.commit()
        
        # Send verification email
        try:
            await send_verification_email(
                user_email,
                user_full_name,
                verification_token
            )
        except Exception as e:
            print(f"Failed to send verification email: {e}")
        
        return True

    async def create_oauth_user(self, user_data: dict) -> User:
        """
        Create new user from OAuth data
        
        Fallback: If OAuth doesn't return name, extract from email
        """
        # Extract name from OAuth data, fallback to email prefix
        full_name = user_data.get("name", "").strip()
        if not full_name:
            # Fallback: extract from email if OAuth doesn't provide name
            email_prefix = user_data["email"].split('@')[0]
            full_name = email_prefix
        
        stmt = (
            insert(User)
            .values(
                email=user_data["email"].strip().lower(),
                full_name=full_name,
                verified=True,  # OAuth emails are pre-verified
                auth_provider="google",
                google_id=user_data.get("sub") or user_data.get("id"),
                last_login=datetime.now(UTC).replace(tzinfo=None),
            )
            .returning(User)
        )

        try:
            result = await self.db.execute(stmt)
            await self.db.commit()
            new_user = result.scalar_one()
            
            # ✅ FIX: Refresh user to load all attributes into session
            await self.db.refresh(new_user)
            
            return new_user
        except IntegrityError:
            await self.db.rollback()
            # User already exists, fetch and return existing user
            return await self.get_user_by_email(user_data["email"])

    @staticmethod
    def get_user_from_cookie(jwt_token: str) -> Optional[CurrentUserResponse]:
        try:
            payload = jwt.decode(jwt_token, SECRET_KEY, algorithms=[ALGORITHM])
            return CurrentUserResponse(
                user_id=payload.get("user_id"),
                email=payload.get("sub"),
                full_name=payload.get("full_name"),
                verified=payload.get("verified", False),
                auth_provider=payload.get("auth_provider", "email"),
                business_id=payload.get("business_id"),
                business_name=payload.get("business_name"),
            )

        except Exception:
            return None

    @staticmethod
    def get_user_id_from_cookie(jwt_token: str | None) -> Optional[str]:
        """Extract user_id from JWT without trusting other user fields."""
        if not jwt_token:
            return None
        try:
            payload = jwt.decode(jwt_token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            return str(user_id) if user_id else None
        except Exception:
            return None

    async def get_current_user_from_db(self, user_id: str) -> Optional[CurrentUserResponse]:
        """Fetch fresh current user data from DB for /auth/current."""
        try:
            user_uuid = uuid.UUID(user_id)
        except (TypeError, ValueError, AttributeError):
            return None

        user = await self.db.get(User, user_uuid)
        if not user or user.deleted:
            return None

        business_id: str | None = None
        business_name: str | None = None

        # Keep business selection consistent with token creation (owner role)
        business_user_stmt = (
            select(BusinessUser)
            .where(
                BusinessUser.user_id == user.id,
                BusinessUser.role == BusinessRole.OWNER.value,
            )
            .limit(1)
        )
        business_user_result = await self.db.execute(business_user_stmt)
        business_user = business_user_result.scalar_one_or_none()
        if business_user:
            business_id = str(business_user.business_id)
            business = await self.db.get(Business, business_user.business_id)
            business_name = business.business_name if business else None

        return CurrentUserResponse(
            user_id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            verified=user.verified,
            auth_provider=user.auth_provider,
            business_id=business_id,
            business_name=business_name,
        )

    @staticmethod
    def create_access_token(
        data: dict, expires_delta: Union[timedelta, None] = None
    ) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(UTC).replace(tzinfo=None) + expires_delta
        else:
            expire = datetime.now(UTC).replace(tzinfo=None) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return self.pwd_context.hash(password)

    async def authenticate_user(self, email: str, password: str) -> User:
        user = await self.get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if account is deleted
        if user.deleted:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This account has been deleted. Please contact support if you believe this is an error.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if OAuth-only account
        if user.password_hash is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": "oauth_only_account",
                    "message": "This account uses Google Sign-In",
                    "suggestion": "Sign in with Google, or click 'Forgot Password' to add a password",
                    "auth_methods": ["google"],
                }
            )
        
        if not self.verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update last login
        user.last_login = datetime.now(UTC).replace(tzinfo=None)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)  # ✅ ADD THIS LINE
        
        return user

    async def update_profile(self, user_update: UserUpdate) -> User:
        user = await self.db.get(User, self.current_user.user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Update user fields if provided
        if user_update.full_name:
            user.full_name = user_update.full_name
        if user_update.email:
            user.email = user_update.email

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def forgot_password(self, email: str) -> bool:
        user = await self.get_user_by_email(email)
        if not user:
            return True

        # ✅ PRODUCTION PATTERN: Extract ALL needed data BEFORE commit
        is_setup = user.password_hash is None
        user_email = user.email
        user_full_name = user.full_name
        
        # Generate token
        reset_token = self.generate_verification_token()
        token_expires_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
        
        # Update user with reset token
        user.password_reset_token = reset_token
        user.password_reset_expires_at = token_expires_at
        
        self.db.add(user)
        await self.db.commit()
        
        # Use extracted variables (safe - no session access)
        try:
            await send_password_reset_email(
                user_email,
                user_full_name,
                reset_token,
                is_setup=is_setup
            )
        except Exception as e:
            print(f"Failed to send password reset email: {e}")

        return True

    async def reset_password(self, token: str, new_password: str) -> bool:
        """
        Reset/setup password using token
        
        Handles both password reset and OAuth-to-password setup
        """
        # Find user with this reset token
        result = await self.db.execute(
            select(User).where(User.password_reset_token == token)
        )
        user = result.scalar()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )
        
        # Check if token expired
        if user.password_reset_expires_at < datetime.now(UTC).replace(tzinfo=None):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired. Please request a new one."
            )

        # Hash new password and update user
        hashed_password = self.get_password_hash(new_password)
        user.password_hash = hashed_password
        user.password_reset_token = None  # Single-use token
        user.password_reset_expires_at = None
        user.last_login = datetime.now(UTC).replace(tzinfo=None)
        
        # If OAuth user adding password, update auth_provider
        if user.auth_provider == "google":
            user.auth_provider = "merged"

        self.db.add(user)
        await self.db.commit()

        return True

    async def delete_account(self, request: DeleteAccountRequest) -> dict:
        """
        Soft delete user account with 30-day retention period
        
        - For email/merged users: requires password verification
        - For OAuth-only users: only requires confirmation
        - Sets deleted=True and schedules permanent deletion after 30 days
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )
        
        # Validate confirmation
        if request.confirmation != "DELETE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please type 'DELETE' to confirm account deletion"
            )
        
        user = await self.get_user()
        
        # Check if already deleted
        if user.deleted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is already scheduled for deletion"
            )
        
        # For users with password, require password verification
        if user.password_hash is not None:
            if not request.password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Password is required to delete your account"
                )
            if not self.verify_password(request.password, user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect password"
                )
        
        # Soft delete the user
        user.deleted = True
        user.deleted_at = datetime.now(UTC).replace(tzinfo=None)
        user.deletion_reason = request.reason
        
        self.db.add(user)
        await self.db.commit()
        
        # Calculate when hard delete will occur (30 days from now)
        hard_delete_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(days=30)
        
        return {
            "message": "Account scheduled for deletion. Your data will be permanently removed after 30 days.",
            "deletion_scheduled_at": hard_delete_at.isoformat()
        }


def get_current_user(request: Request) -> Optional[CurrentUserResponse]:
    res = UserService.get_user_from_cookie(request.cookies.get(JWT_COOKIE_NAME))
    if res is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not logged in",
        )

    return res


def get_current_user_optional(
    request: Request,
) -> Optional[CurrentUserResponse]:
    return UserService.get_user_from_cookie(request.cookies.get(JWT_COOKIE_NAME))


def get_user_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
    request: Request = None,
):
    return UserService(db_session, current_user, request)