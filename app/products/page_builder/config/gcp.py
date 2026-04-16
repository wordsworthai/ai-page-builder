"""
GCP Configuration for BigQuery and Cloud Storage.

Handles credentials, project settings, and client initialization for
BigQuery analytics queries and GCS operations.
"""
import os
from pathlib import Path
from typing import Optional
import logging

from pydantic_settings import BaseSettings


class GCPConfig(BaseSettings):
    """
    GCP configuration settings.
    
    Supports two authentication modes:
    1. Local development: Uses JSON key file (GCP_CREDENTIALS_PATH)
    2. Cloud Run production: Uses Application Default Credentials (no file needed)
    """
    
    # Project Settings
    GCP_PROJECT_ID: str = "your-gcp-project-id"
    GCP_REGION: str = "us-central1"

    # BigQuery Settings
    BIGQUERY_DATASET: str = "website_analytics"
    BIGQUERY_TABLE: str = "daily_page_analytics"
    BIGQUERY_LOCATION: str = "us-central1"  # Must match dataset location

    # Cloud Storage Settings
    GCS_ANALYTICS_BUCKET: str = "your-analytics-bucket"
    
    # Authentication
    # Local dev: Set to path of service account JSON file
    # Production: Leave empty (uses Application Default Credentials)
    GCP_CREDENTIALS_PATH: Optional[str] = None
    
    # Query Settings
    BIGQUERY_TIMEOUT_SECONDS: int = 60
    BIGQUERY_MAX_RESULTS: int = 10000
    
    class Config:
        env_file = "local.env"
        case_sensitive = True
        extra = "ignore"
    
    def get_credentials_path(self) -> Optional[Path]:
        """
        Get absolute path to GCP credentials file.
        
        Returns:
            Path object if file exists, None otherwise (uses ADC)
        """
        if not self.GCP_CREDENTIALS_PATH:
            return None
        
        path = Path(self.GCP_CREDENTIALS_PATH)
        
        # Handle relative paths (e.g., './gcp-service-account.json')
        if not path.is_absolute():
            path = Path.cwd() / path
        
        if not path.exists():
            raise FileNotFoundError(
                f"GCP credentials file not found: {path}\n"
                f"Please ensure the file exists or set GCP_CREDENTIALS_PATH correctly."
            )
        
        return path
    
    def is_production(self) -> bool:
        """Check if running in production (Cloud Run) vs local development."""
        # Cloud Run sets K_SERVICE environment variable
        return os.getenv("K_SERVICE") is not None
    
    @property
    def bigquery_table_id(self) -> str:
        """Get fully qualified BigQuery table ID."""
        return f"{self.GCP_PROJECT_ID}.{self.BIGQUERY_DATASET}.{self.BIGQUERY_TABLE}"
    
    @property
    def gcs_staging_uri(self) -> str:
        """Get GCS URI for staging bucket."""
        return f"gs://{self.GCS_ANALYTICS_BUCKET}"


# Global configuration instance
gcp_config = GCPConfig()


def get_bigquery_client():
    """
    Get BigQuery client with appropriate credentials.
    
    Returns:
        google.cloud.bigquery.Client | None: Configured BigQuery client, or None if unavailable
    
    Raises:
        ImportError: If google-cloud-bigquery is not installed
        FileNotFoundError: If credentials file is missing (local dev)
    """
    try:
        from google.cloud import bigquery
        from google.oauth2 import service_account
    except ImportError:
        logging.warning("google-cloud-bigquery not installed; analytics disabled")
        return None
    
    credentials = None
    
    # Local development: Use service account JSON file
    try:
        if not gcp_config.is_production() and gcp_config.GCP_CREDENTIALS_PATH:
            credentials_path = gcp_config.get_credentials_path()
            if credentials_path:
                credentials = service_account.Credentials.from_service_account_file(
                    str(credentials_path)
                )
    except Exception as e:
        logging.warning(f"GCP credentials not configured correctly; analytics disabled: {e}")
        return None
    
    # Production or ADC: credentials=None uses Application Default Credentials
    try:
        return bigquery.Client(
            project=gcp_config.GCP_PROJECT_ID,
            credentials=credentials,
            location=gcp_config.BIGQUERY_LOCATION
        )
    except Exception as e:
        logging.warning(f"Failed to initialize BigQuery client; analytics disabled: {e}")
        return None


def get_gcs_client():
    """
    Get Cloud Storage client with appropriate credentials.
    
    Returns:
        google.cloud.storage.Client: Configured GCS client
    
    Raises:
        ImportError: If google-cloud-storage is not installed
        FileNotFoundError: If credentials file is missing (local dev)
    """
    try:
        from google.cloud import storage
        from google.oauth2 import service_account
    except ImportError as e:
        raise ImportError(
            "google-cloud-storage is not installed. "
            "Run: pip install google-cloud-storage"
        ) from e
    
    credentials = None
    
    # Local development: Use service account JSON file
    if not gcp_config.is_production() and gcp_config.GCP_CREDENTIALS_PATH:
        credentials_path = gcp_config.get_credentials_path()
        if credentials_path:
            credentials = service_account.Credentials.from_service_account_file(
                str(credentials_path)
            )
    
    # Production or ADC: credentials=None uses Application Default Credentials
    return storage.Client(
        project=gcp_config.GCP_PROJECT_ID,
        credentials=credentials
    )


def verify_gcp_setup() -> dict:
    """
    Verify GCP configuration and credentials.
    
    Returns:
        dict: Status information about GCP setup
    """
    status = {
        "project_id": gcp_config.GCP_PROJECT_ID,
        "dataset": gcp_config.BIGQUERY_DATASET,
        "table": gcp_config.BIGQUERY_TABLE,
        "table_id": gcp_config.bigquery_table_id,
        "is_production": gcp_config.is_production(),
        "credentials_configured": False,
        "bigquery_accessible": False,
        "gcs_accessible": False,
        "errors": []
    }
    
    # Check credentials
    try:
        if gcp_config.is_production():
            status["credentials_configured"] = True
            status["auth_method"] = "Application Default Credentials (Cloud Run)"
        elif gcp_config.GCP_CREDENTIALS_PATH:
            path = gcp_config.get_credentials_path()
            status["credentials_configured"] = True
            status["auth_method"] = f"Service Account JSON: {path}"
        else:
            status["errors"].append(
                "GCP_CREDENTIALS_PATH not set in local.env. "
                "Set it to your service account JSON file path."
            )
    except FileNotFoundError as e:
        status["errors"].append(str(e))
    
    # Test BigQuery access
    if status["credentials_configured"]:
        try:
            client = get_bigquery_client()
            # Try to access the dataset
            dataset = client.get_dataset(gcp_config.BIGQUERY_DATASET)
            status["bigquery_accessible"] = True
            status["dataset_location"] = dataset.location
        except Exception as e:
            status["errors"].append(f"BigQuery access failed: {str(e)}")
    
    # Test GCS access
    if status["credentials_configured"]:
        try:
            client = get_gcs_client()
            # Try to access the bucket
            bucket = client.get_bucket(gcp_config.GCS_ANALYTICS_BUCKET)
            status["gcs_accessible"] = True
            status["bucket_location"] = bucket.location
        except Exception as e:
            status["errors"].append(f"GCS access failed: {str(e)}")
    
    return status


# Example usage and testing
if __name__ == "__main__":
    """Test GCP configuration."""
    print("=" * 60)
    print("GCP Configuration Test")
    print("=" * 60)
    
    print(f"\nProject ID: {gcp_config.GCP_PROJECT_ID}")
    print(f"BigQuery Dataset: {gcp_config.BIGQUERY_DATASET}")
    print(f"BigQuery Table: {gcp_config.BIGQUERY_TABLE}")
    print(f"Full Table ID: {gcp_config.bigquery_table_id}")
    print(f"GCS Bucket: {gcp_config.GCS_ANALYTICS_BUCKET}")
    print(f"Running in Production: {gcp_config.is_production()}")
    
    print("\n" + "=" * 60)
    print("Verification Results")
    print("=" * 60)
    
    status = verify_gcp_setup()
    
    print(f"\n✓ Credentials configured: {status['credentials_configured']}")
    if 'auth_method' in status:
        print(f"  Method: {status['auth_method']}")
    
    print(f"\n✓ BigQuery accessible: {status['bigquery_accessible']}")
    if 'dataset_location' in status:
        print(f"  Dataset location: {status['dataset_location']}")
    
    print(f"\n✓ GCS accessible: {status['gcs_accessible']}")
    if 'bucket_location' in status:
        print(f"  Bucket location: {status['bucket_location']}")
    
    if status['errors']:
        print("\n❌ Errors:")
        for error in status['errors']:
            print(f"  - {error}")
    else:
        print("\n✅ All checks passed!")
    
    print("\n" + "=" * 60)