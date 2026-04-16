"""Utilities for deserializing dictionaries to dataclasses."""
import dataclasses
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


def dict_to_dataclass(cls, data: Dict[str, Any]):
    """Recursively convert dict to dataclass instance."""
    if data is None:
        return None
    if isinstance(data, cls):
        return data
    if not isinstance(data, dict):
        return data
    
    # Get field types from dataclass
    try:
        field_types = {f.name: f.type for f in dataclasses.fields(cls)}
    except Exception:
        # Fallback: try to create from dict directly if cls has __init__
        try:
            return cls(**data)
        except Exception:
            return data
    
    # Convert each field
    converted = {}
    for field_name, field_value in data.items():
        if field_name not in field_types:
            # Field not in type hints, keep as-is
            converted[field_name] = field_value
            continue
        
        field_type = field_types[field_name]
        
        # Handle Optional types (Union[SomeType, None] or Optional[SomeType])
        if hasattr(field_type, '__origin__'):
            origin = field_type.__origin__
            # Check if it's Union or Optional
            if origin is type(None) or (hasattr(field_type, '__args__') and type(None) in field_type.__args__):
                # It's Optional, get the non-None type
                args = getattr(field_type, '__args__', ())
                non_none_types = [t for t in args if t is not type(None)]
                if non_none_types:
                    inner_type = non_none_types[0]
                    if dataclasses.is_dataclass(inner_type):
                        if field_value is not None and isinstance(field_value, dict):
                            converted[field_name] = dict_to_dataclass(inner_type, field_value)
                        else:
                            converted[field_name] = field_value
                    else:
                        converted[field_name] = field_value
                else:
                    converted[field_name] = field_value
            else:
                converted[field_name] = field_value
        # If it's a dataclass type directly, recursively convert
        elif dataclasses.is_dataclass(field_type):
            if isinstance(field_value, dict):
                converted[field_name] = dict_to_dataclass(field_type, field_value)
            else:
                converted[field_name] = field_value
        # Check if it's a class from wwai_agent_orchestration that should be converted
        elif isinstance(field_value, dict) and hasattr(field_type, '__module__') and 'wwai_agent_orchestration' in field_type.__module__:
            # Try to convert it as if it were a dataclass
            try:
                converted[field_name] = dict_to_dataclass(field_type, field_value)
            except Exception:
                converted[field_name] = field_value
        else:
            converted[field_name] = field_value
    
    # Create dataclass instance
    try:
        return cls(**converted)
    except Exception as e:
        logger.error(f"Failed to create {cls} instance: {e}, data keys: {list(data.keys())}, converted keys: {list(converted.keys())}")
        raise
