import logging
import re
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError
from app.products.page_builder.config.aws import aws_config

logger = logging.getLogger(__name__)


def get_s3_client(access_key_id=None, secret_access_key=None):
    access_key_id = aws_config.AWS_ACCESS_KEY_ID if access_key_id is None else access_key_id
    secret_access_key = aws_config.AWS_SECRET_ACCESS_KEY if secret_access_key is None else secret_access_key
    if not access_key_id or not secret_access_key:
        return None, "AWS credentials not found in environment variables"
    
    try:
        client = boto3.client(
            's3',
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key
        )
        return client, None
    except (NoCredentialsError, PartialCredentialsError) as e:
        return None, str(e)


def get_bucket_location(bucket_name):
    env_bucket_name = aws_config.S3_BUCKET_NAME
    # assert env_bucket_name == bucket_name
    env_bucket_location = aws_config.AWS_REGION
    return env_bucket_location


def _generate_s3_url(bucket_name, s3_filename, bucket_location):
    return "https://{0}.s3.{2}.amazonaws.com/{1}".format(
        bucket_name, s3_filename, bucket_location
    )


def generate_s3_url(s3_filename, bucket_name=None, bucket_location=None):
    if bucket_name is None:
        bucket_name = aws_config.S3_BUCKET_NAME
    
    if bucket_location is None:
        bucket_location = get_bucket_location(bucket_name)

    return _generate_s3_url(bucket_name, s3_filename, bucket_location)


def extract_s3_key_from_url(s3_url: str) -> tuple[str, str] | None:
    """
    Extract bucket name and S3 key from a direct S3 URL.

    Returns (bucket_name, s3_key) or None if the URL doesn't match.
    """
    match = re.match(
        r"https://(?P<bucket>[^.]+)\.s3\.[^.]+\.amazonaws\.com/(?P<key>.+)",
        s3_url,
    )
    if match:
        return match.group("bucket"), match.group("key")
    return None


def generate_presigned_url(
    s3_url: str,
    expiration: int = 3600,
    s3_client=None,
) -> str:
    """
    Generate a presigned URL from a direct S3 URL.

    Args:
        s3_url: Direct S3 URL (e.g. https://bucket.s3.region.amazonaws.com/key)
        expiration: URL expiration in seconds (default 1 hour)
        s3_client: Optional boto3 S3 client. Creates one if not provided.

    Returns:
        Presigned URL string, or the original URL if generation fails.
    """
    parsed = extract_s3_key_from_url(s3_url)
    if not parsed:
        return s3_url

    bucket_name, s3_key = parsed

    if s3_client is None:
        s3_client, err = get_s3_client()
        if err:
            logger.warning(f"Cannot generate presigned URL, S3 client error: {err}")
            return s3_url

    try:
        presigned = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": s3_key},
            ExpiresIn=expiration,
        )
        return presigned
    except ClientError as e:
        logger.warning(f"Failed to generate presigned URL for {s3_key}: {e}")
        return s3_url
