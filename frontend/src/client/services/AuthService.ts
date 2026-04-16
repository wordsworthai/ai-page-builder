/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateBusinessRequest } from '../models/CreateBusinessRequest';
import type { CreateBusinessResponse } from '../models/CreateBusinessResponse';
import type { CurrentUserResponse } from '../models/CurrentUserResponse';
import type { DeleteAccountRequest } from '../models/DeleteAccountRequest';
import type { DeleteAccountResponse } from '../models/DeleteAccountResponse';
import type { ForgotPasswordRequest } from '../models/ForgotPasswordRequest';
import type { ForgotPasswordResponse } from '../models/ForgotPasswordResponse';
import type { LoginForm } from '../models/LoginForm';
import type { LoginResponse } from '../models/LoginResponse';
import type { ResendVerificationRequest } from '../models/ResendVerificationRequest';
import type { ResendVerificationResponse } from '../models/ResendVerificationResponse';
import type { ResetPasswordRequest } from '../models/ResetPasswordRequest';
import type { SignupForm } from '../models/SignupForm';
import type { UserUpdate } from '../models/UserUpdate';
import type { VerifyEmailRequest } from '../models/VerifyEmailRequest';
import type { VerifyEmailResponse } from '../models/VerifyEmailResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Current User
     * Get current authenticated user (fresh from DB).
     * @returns CurrentUserResponse Successful Response
     * @throws ApiError
     */
    public static currentUserApiAuthCurrentGet(): CancelablePromise<CurrentUserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/current',
        });
    }
    /**
     * Login
     * Login with email and password
     *
     * Scenario C: OAuth-only users will receive specific error
     * directing them to use Google OAuth or add password via forgot password
     * @param requestBody
     * @returns LoginResponse Successful Response
     * @throws ApiError
     */
    public static loginApiAuthLoginPost(
        requestBody: LoginForm,
    ): CancelablePromise<LoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Logout
     * Logout user by deleting JWT cookie
     * @returns any Successful Response
     * @throws ApiError
     */
    public static logoutApiAuthLogoutGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/logout',
        });
    }
    /**
     * Signup
     * Sign up new user with email and password.
     *
     * Creates user account only. Business creation is handled separately via
     * /api/auth/business/create endpoint after authentication.
     *
     * Guaranteed Actions:
     * - Creates user in users table
     * - Generates email verification token
     * - Sends verification email (non-blocking)
     *
     * Scenario B: If email exists with OAuth, returns specific error
     * directing user to use Google OAuth or forgot password.
     * @param requestBody
     * @returns LoginResponse Successful Response
     * @throws ApiError
     */
    public static signupApiAuthSignupPost(
        requestBody: SignupForm,
    ): CancelablePromise<LoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/signup',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Google Callback
     * Google OAuth callback handler
     *
     * Scenario A: If email exists from email signup, merges accounts and auto-verifies
     * Creates business for new OAuth users who don't have a business_id.
     * @returns LoginResponse Successful Response
     * @throws ApiError
     */
    public static googleCallbackApiAuthGoogleCallbackGet(): CancelablePromise<LoginResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/google_callback',
        });
    }
    /**
     * Google Authorize
     * Redirect to Google OAuth authorization
     * @returns any Successful Response
     * @throws ApiError
     */
    public static googleAuthorizeApiAuthGoogleAuthorizeGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/google/authorize',
        });
    }
    /**
     * Verify Email
     * Verify user's email address using token from email
     *
     * No authentication required - token proves email ownership
     * Single-use token that expires in 24 hours
     * @param requestBody
     * @returns VerifyEmailResponse Successful Response
     * @throws ApiError
     */
    public static verifyEmailApiAuthVerifyEmailPost(
        requestBody: VerifyEmailRequest,
    ): CancelablePromise<VerifyEmailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/verify-email',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Resend Verification
     * Resend email verification link
     *
     * Rate limited: 3 emails per hour per user
     * TODO: Implement Redis-based rate limiting for production
     * @param requestBody
     * @returns ResendVerificationResponse Successful Response
     * @throws ApiError
     */
    public static resendVerificationApiAuthResendVerificationPost(
        requestBody: ResendVerificationRequest,
    ): CancelablePromise<ResendVerificationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/resend-verification',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update User Profile
     * Update user profile information
     * @param requestBody
     * @returns UserUpdate Successful Response
     * @throws ApiError
     */
    public static updateUserProfileApiAuthProfilePut(
        requestBody: UserUpdate,
    ): CancelablePromise<UserUpdate> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/auth/profile',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Forgot Password
     * Request password reset or password setup email
     *
     * Unified flow: Handles both password reset (existing password users)
     * and password setup (OAuth users adding password)
     *
     * Email adapts based on whether user has password or not
     * @param requestBody
     * @returns ForgotPasswordResponse Successful Response
     * @throws ApiError
     */
    public static forgotPasswordApiAuthForgotPasswordPost(
        requestBody: ForgotPasswordRequest,
    ): CancelablePromise<ForgotPasswordResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/forgot-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Reset Password
     * Reset password or set up password using token
     *
     * Handles both:
     * - Password reset for existing password users
     * - Password setup for OAuth users (sets auth_provider='merged')
     *
     * Single-use token that expires in 24 hours
     * @param requestBody
     * @returns ForgotPasswordResponse Successful Response
     * @throws ApiError
     */
    public static resetPasswordApiAuthResetPasswordPost(
        requestBody: ResetPasswordRequest,
    ): CancelablePromise<ForgotPasswordResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reset-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Account
     * Delete user account (soft delete with 30-day retention)
     *
     * Soft deletes the user account with a 30-day retention period.
     * After 30 days, all user data will be permanently deleted.
     *
     * Requirements:
     * - For email/merged users: password confirmation required
     * - For OAuth-only users: only DELETE confirmation required
     * - Must type "DELETE" to confirm
     *
     * Returns deletion confirmation and scheduled permanent deletion date.
     * @param requestBody
     * @returns DeleteAccountResponse Successful Response
     * @throws ApiError
     */
    public static deleteAccountApiAuthAccountDelete(
        requestBody: DeleteAccountRequest,
    ): CancelablePromise<DeleteAccountResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/auth/account',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Business
     * Create or update a business for the authenticated user.
     *
     * This endpoint is used when a user signs up via OAuth and needs to create
     * a business from the Create Site flow data, or when updating an existing business.
     *
     * - If user doesn't have a business: Creates a new business with provided data
     * - If user already has a business: Updates the existing business with provided data
     * (partial update - only provided fields are updated)
     *
     * Uses a transaction to prevent race conditions when multiple requests arrive simultaneously.
     * @param requestBody
     * @returns CreateBusinessResponse Successful Response
     * @throws ApiError
     */
    public static createBusinessApiAuthBusinessCreatePost(
        requestBody: CreateBusinessRequest,
    ): CancelablePromise<CreateBusinessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/business/create',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
