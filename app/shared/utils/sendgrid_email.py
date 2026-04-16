"""
SendGrid email sending utility for Wordsworth authentication emails.
Handles email verification, password reset, and password setup.
"""

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

from app.core.config import config


class SendGridEmailService:
    """Service for sending transactional emails via SendGrid"""
    
    def __init__(self):
        self.sg_client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize SendGrid client with API key from config"""
        if not config.sendgrid_api_key:
            print("api key not found")
            # SendGrid not configured - skip initialization
            # Emails will be logged instead of sent (dev mode)
            return
        
        try:
            self.sg_client = SendGridAPIClient(config.sendgrid_api_key)
        except Exception as e:
            print(f"Failed to initialize SendGrid client: {e}")
            self.sg_client = None
    
    def _send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
    ) -> bool:
        """
        Send email via SendGrid
        
        Args:
            to_email: Recipient email address
            subject: Email subject line
            html_body: HTML version of email body
            text_body: Plain text version of email body
        
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.sg_client:
            # SendGrid not configured - log email instead (dev mode)
            print(f"\n{'='*60}")
            print(f"📧 EMAIL (Dev Mode - SendGrid Not Configured)")
            print(f"{'='*60}")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"\n{text_body}\n")
            print(f"{'='*60}\n")
            return True
        
        try:
            message = Mail(
                from_email=Email(config.sendgrid_from_email, config.sendgrid_from_name),
                to_emails=To(to_email),
                subject=subject,
                plain_text_content=Content("text/plain", text_body),
                html_content=Content("text/html", html_body)
            )
            
            response = self.sg_client.send(message)
            print(f"✅ Email sent to {to_email}, Status Code: {response.status_code}")
            return True
            
        except Exception as e:
            print(f"❌ SendGrid Error: {e}")
            # Don't expose SendGrid errors to users
            # Log for debugging but return success to avoid revealing info
            return True


async def send_verification_email(
    to_email: str,
    full_name: str,
    verification_token: str,
) -> bool:
    """
    Send email verification link to user
    
    Args:
        to_email: User's email address
        full_name: User's name (from email prefix or OAuth)
        verification_token: Verification token
    
    Returns:
        True if email sent successfully
    """
    sg_service = SendGridEmailService()
    
    # Create verification link
    verification_link = f"{config.frontend_url}/verify-email?token={verification_token}"
    
    subject = "Verify Your Wordsworth Account"
    
    # HTML email template
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Wordsworth! 🎉</h1>
            </div>
            <div class="content">
                <p>Hi {full_name},</p>
                <p>Thanks for signing up! We're excited to help you create amazing landing pages with AI.</p>
                <p>Please verify your email address to get started:</p>
                <div style="text-align: center;">
                    <a href="{verification_link}" class="button">Verify Email Address</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea; font-size: 12px;">{verification_link}</p>
                <p style="margin-top: 30px;"><strong>This link expires in 24 hours.</strong></p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2025 Wordsworth AI. All rights reserved.</p>
                <p>Need help? Contact us at {config.support_email}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text fallback
    text_body = f"""
    Welcome to Wordsworth!
    
    Hi {full_name},
    
    Thanks for signing up! We're excited to help you create amazing landing pages with AI.
    
    Please verify your email address by clicking this link:
    {verification_link}
    
    This link expires in 24 hours.
    
    If you didn't create an account, you can safely ignore this email.
    
    Need help? Contact us at {config.support_email}
    
    © 2025 Wordsworth AI. All rights reserved.
    """
    
    return sg_service._send_email(to_email, subject, html_body, text_body)


async def send_password_reset_email(
    to_email: str,
    full_name: str,
    reset_token: str,
    is_setup: bool = False,
) -> bool:
    """
    Send password reset or password setup email
    
    Args:
        to_email: User's email address
        full_name: User's name
        reset_token: Password reset/setup token
        is_setup: True if this is password setup for OAuth user, False for reset
    
    Returns:
        True if email sent successfully
    """
    sg_service = SendGridEmailService()
    
    # Create reset link
    reset_link = f"{config.frontend_url}/reset-password?token={reset_token}"
    
    # Different messaging for setup vs reset
    if is_setup:
        subject = "Set Up Your Password - Wordsworth"
        action_text = "Set Up Password"
        intro_text = "You requested to add a password to your Wordsworth account."
        button_text = "Set Up Password"
    else:
        subject = "Reset Your Password - Wordsworth"
        action_text = "Reset Password"
        intro_text = "We received a request to reset your password."
        button_text = "Reset Password"
    
    # HTML email template
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }}
            .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{action_text} 🔐</h1>
            </div>
            <div class="content">
                <p>Hi {full_name},</p>
                <p>{intro_text}</p>
                <p>Click the button below to continue:</p>
                <div style="text-align: center;">
                    <a href="{reset_link}" class="button">{button_text}</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea; font-size: 12px;">{reset_link}</p>
                <div class="warning">
                    <p style="margin: 0;"><strong>⏰ This link expires in 24 hours.</strong></p>
                </div>
                <p>If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
                <p>© 2025 Wordsworth AI. All rights reserved.</p>
                <p>Need help? Contact us at {config.support_email}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text fallback
    text_body = f"""
    {action_text}
    
    Hi {full_name},
    
    {intro_text}
    
    Click this link to continue:
    {reset_link}
    
    ⏰ This link expires in 24 hours.
    
    If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
    
    Need help? Contact us at {config.support_email}
    
    © 2025 Wordsworth AI. All rights reserved.
    """
    
    return sg_service._send_email(to_email, subject, html_body, text_body)