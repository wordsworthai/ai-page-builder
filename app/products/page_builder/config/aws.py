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
    
    # AWS Credentials (optional — only required for S3 publishing/CloudFront features)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    
    # S3 Configuration (general — media, previews, support uploads, etc.)
    S3_BUCKET_NAME: str = "my-pages"
    S3_MEDIA_BUCKET_NAME: str = "my-pages-media"
    S3_PREVIEW_BUCKET_NAME: str = "my-previews"
    S3_ENDPOINT_URL: str = ""

    # S3 Publish Configuration (separate bucket/region for final published pages served via CloudFront)
    S3_PUBLISH_BUCKET_NAME: str = ""
    S3_PUBLISH_REGION: str = ""
    S3_PUBLISH_ENDPOINT_URL: str = ""

    # CloudFront Configuration
    CLOUDFRONT_DISTRIBUTION_ID: str = ""
    CLOUDFRONT_DOMAIN: str = "example.com"

    @property
    def publish_bucket(self) -> str:
        return self.S3_PUBLISH_BUCKET_NAME or self.S3_BUCKET_NAME

    @property
    def publish_region(self) -> str:
        return self.S3_PUBLISH_REGION or self.AWS_REGION

    @property
    def publish_endpoint_url(self) -> str | None:
        if self.S3_PUBLISH_ENDPOINT_URL:
            return self.S3_PUBLISH_ENDPOINT_URL
        # If a separate publish region is set, don't inherit the general endpoint —
        # let boto3 resolve it from the region to avoid cross-region redirects.
        if self.S3_PUBLISH_REGION:
            return None
        return self.S3_ENDPOINT_URL or None


# Singleton instance
aws_config = AWSConfig()