"""AWS Configuration for S3 and CloudFront"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class AWSConfig(BaseSettings):
    """AWS credentials and configuration"""
    
    model_config = SettingsConfigDict(
        env_file=(".env", "local.env", "prod.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # AWS Credentials
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-east-1"
    
    # S3 Configuration
    S3_BUCKET_NAME: str = "my-pages"
    S3_MEDIA_BUCKET_NAME: str = "my-pages-media"
    S3_PREVIEW_BUCKET_NAME: str = "my-previews"
    S3_ENDPOINT_URL: str = "https://s3.amazonaws.com"

    # CloudFront Configuration
    CLOUDFRONT_DISTRIBUTION_ID: str = ""
    CLOUDFRONT_DOMAIN: str = "example.com"


# Singleton instance
aws_config = AWSConfig()