"""Utilities for serializing and deserializing dataclasses to/from dictionaries."""
import dataclasses
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


def dataclass_to_dict(obj: Any) -> Any:
    """Recursively convert dataclass instances to dictionaries for JSON serialization."""
    if obj is None:
        return None
    
    # Handle primitive types first
    if isinstance(obj, (str, int, float, bool)):
        return obj
    
    # Handle collections
    if isinstance(obj, dict):
        return {k: dataclass_to_dict(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [dataclass_to_dict(item) for item in obj]
    
    # Skip type objects
    if isinstance(obj, type):
        return obj
    
    # Check if it's a dataclass instance - try multiple detection methods
    is_dataclass_instance = False
    
    # Method 1: dataclasses.is_dataclass() on the instance
    try:
        if dataclasses.is_dataclass(obj):
            is_dataclass_instance = True
    except Exception:
        pass
    
    # Method 2: Check for __dataclass_fields__ attribute
    if not is_dataclass_instance and hasattr(obj, '__dataclass_fields__'):
        is_dataclass_instance = True
    
    # Method 3: Check the type of the object
    if not is_dataclass_instance:
        try:
            obj_type = type(obj)
            if dataclasses.is_dataclass(obj_type) or hasattr(obj_type, '__dataclass_fields__'):
                is_dataclass_instance = True
            # Also check if it's from wwai_agent_orchestration - these are likely dataclasses
            elif hasattr(obj_type, '__module__') and 'wwai_agent_orchestration' in obj_type.__module__:
                # If it has __dict__ and looks like a data object, treat it as a dataclass
                if hasattr(obj, '__dict__') and not callable(obj):
                    is_dataclass_instance = True
        except Exception:
            pass
    
    if is_dataclass_instance:
        # It's a dataclass instance, convert recursively
        result = {}
        try:
            # First try using dataclasses.asdict() with a custom factory for nested dataclasses
            if dataclasses.is_dataclass(obj):
                def dict_factory(items):
                    return {k: dataclass_to_dict(v) for k, v in items}
                try:
                    return dataclasses.asdict(obj, dict_factory=dict_factory)
                except Exception:
                    # Fall back to manual field iteration
                    for field in dataclasses.fields(obj):
                        field_value = getattr(obj, field.name, None)
                        result[field.name] = dataclass_to_dict(field_value)
                    return result
            # Fallback to __dataclass_fields__
            elif hasattr(obj, '__dataclass_fields__'):
                for field_name in obj.__dataclass_fields__:
                    field_value = getattr(obj, field_name, None)
                    result[field_name] = dataclass_to_dict(field_value)
                return result
        except Exception as e:
            logger.warning(f"Error converting dataclass using fields: {e}, trying __dict__")
            # Last resort: use __dict__ directly
            if hasattr(obj, '__dict__'):
                return {k: dataclass_to_dict(v) for k, v in obj.__dict__.items() if not k.startswith('_')}
            raise
    
    # For any other object type that has __dict__, try to convert it
    # This catches objects that might be dataclass-like but not detected above
    if hasattr(obj, '__dict__') and not isinstance(obj, (str, int, float, bool, dict, list, tuple, type)):
        try:
            obj_type = type(obj)
            type_name = obj_type.__name__
            module_name = obj_type.__module__
            
            # If it's from the orchestration package and has __dict__, treat it as a dataclass
            if 'wwai_agent_orchestration' in module_name or 'ExecutionConfig' in type_name or 'FormsConfig' in type_name or 'CacheStrategy' in type_name:
                result = {}
                for key, value in obj.__dict__.items():
                    if not key.startswith('_'):
                        result[key] = dataclass_to_dict(value)
                return result
        except Exception:
            pass
    
    # Last resort: try to use __dict__ for any object that has it and looks like a data object
    if hasattr(obj, '__dict__') and not callable(obj) and not isinstance(obj, type):
        try:
            obj_dict = obj.__dict__
            if obj_dict and any(not k.startswith('_') or k.startswith('__') and k.endswith('__') for k in obj_dict.keys()):
                return {k: dataclass_to_dict(v) for k, v in obj_dict.items() if not k.startswith('_') or (k.startswith('__') and k.endswith('__'))}
        except Exception:
            pass
    
    # If we get here, it's not serializable
    logger.error(f"Could not convert object to dict: type={type(obj)}, module={getattr(type(obj), '__module__', 'unknown')}, obj={obj}")
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


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
