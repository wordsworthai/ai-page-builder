from typing import Optional, List, Dict, Any

from pydantic import BaseModel, EmailStr


class CurrentUserResponse(BaseModel):
    email: EmailStr
    full_name: str
    user_id: str
    verified: bool  # Email verification status
    auth_provider: str  # 'email', 'google', 'merged'
    business_id: Optional[str] = None
    business_name: Optional[str] = None


class LoginForm(BaseModel):
    email: EmailStr
    password: str


class SignupForm(BaseModel):
    email: EmailStr
    password: str
    # Optional business metadata
    business_name: Optional[str] = None
    google_maps_url: Optional[str] = None
    google_maps_data: Optional[Dict[str, Any]] = None
    yelp_url: Optional[str] = None
    intent: Optional[str] = None
    tone: Optional[str] = None
    color_palette_id: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    user: Optional[CurrentUserResponse] = None  # Include user data in response


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class ForgotPasswordResponse(BaseModel):
    message: str


# New schemas for email verification
class VerifyEmailRequest(BaseModel):
    token: str


class VerifyEmailResponse(BaseModel):
    message: str
    verified: bool


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    message: str


# Enhanced error responses for OAuth scenarios
class OAuthOnlyAccountError(BaseModel):
    error: str = "oauth_only_account"
    message: str
    suggestion: str
    auth_methods: List[str]


class EmailAlreadyExistsError(BaseModel):
    error: str = "email_already_exists"
    message: str
    suggestion: str
    auth_methods: List[str]


class CreateBusinessRequest(BaseModel):
    """Request schema for creating a business for authenticated user"""
    business_name: Optional[str] = None
    google_maps_url: Optional[str] = None
    google_maps_data: Optional[Dict[str, Any]] = None
    yelp_url: Optional[str] = None
    intent: Optional[str] = None
    tone: Optional[str] = None
    color_palette_id: Optional[str] = None


class CreateBusinessResponse(BaseModel):
    """Response schema for business creation"""
    message: str
    business_id: str


class DeleteAccountRequest(BaseModel):
    """Request schema for deleting user account (soft delete)"""
    password: Optional[str] = None  # Required for email/merged users, optional for OAuth-only
    confirmation: str  # User must type "DELETE" to confirm
    reason: Optional[str] = None  # Optional feedback on why they're leaving


class DeleteAccountResponse(BaseModel):
    """Response schema for account deletion"""
    message: str
    deletion_scheduled_at: str  # ISO format datetime when hard delete will occur