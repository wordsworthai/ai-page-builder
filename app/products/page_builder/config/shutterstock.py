from pydantic_settings import BaseSettings, SettingsConfigDict
import os

def _get_env_files():
    env_file = os.environ.get("ENV_FILE")
    if env_file:
        return [env_file]
    return ["local.env", ".env"]

class ShutterstockConfig(BaseSettings):
    """Shutterstock API configuration."""

    api_token: str
    base_url: str = "https://api.shutterstock.com/v2"
	
    model_config = SettingsConfigDict(
        env_file=_get_env_files(),
        env_prefix="SHUTTERSTOCK_",
        case_sensitive=False,
        extra="ignore"
    )

shutterstock_config = ShutterstockConfig()