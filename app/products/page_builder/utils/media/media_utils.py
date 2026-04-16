"""
Media utilities for file validation, metadata extraction, and video thumbnail generation.
"""
import io
import os
import uuid
import subprocess
import json
from typing import Tuple, Optional, Dict, Any

import filetype
from PIL import Image

# Size limits in bytes
MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB

# Allowed MIME types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", 
    "image/webp", "image/svg+xml", "image/bmp", "image/tiff"
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
    "video/x-matroska", "video/mpeg", "video/ogg"
}

# Extension mappings
MIME_TO_EXTENSION = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "video/x-msvideo": "avi",
    "video/x-matroska": "mkv",
    "video/mpeg": "mpeg",
    "video/ogg": "ogv",
}


class MediaValidationError(Exception):
    """Custom exception for media validation errors."""
    pass


class MediaProcessingError(Exception):
    """Custom exception for media processing errors."""
    pass


def validate_file_type(file_bytes: bytes, filename: Optional[str] = None) -> Tuple[str, str, str]:
    """
    Validate file type using magic bytes detection.
    
    Args:
        file_bytes: Raw file bytes
        filename: Optional original filename for fallback
        
    Returns:
        Tuple of (mime_type, extension, media_type)
        media_type is either "image" or "video"
        
    Raises:
        MediaValidationError: If file type is invalid or not allowed
    """
    # Detect file type from magic bytes
    kind = filetype.guess(file_bytes)
    
    if kind is None:
        # Fallback: check for SVG (text-based, no magic bytes)
        if filename and filename.lower().endswith('.svg'):
            # Basic SVG validation
            try:
                content = file_bytes.decode('utf-8', errors='ignore')
                if '<svg' in content.lower():
                    return "image/svg+xml", "svg", "image"
            except:
                pass
        raise MediaValidationError("Could not determine file type. File may be corrupted or unsupported.")
    
    mime_type = kind.mime
    extension = kind.extension
    
    # Determine if image or video
    if mime_type in ALLOWED_IMAGE_TYPES:
        media_type = "image"
    elif mime_type in ALLOWED_VIDEO_TYPES:
        media_type = "video"
    else:
        raise MediaValidationError(
            f"File type '{mime_type}' is not allowed. "
            f"Allowed types: images ({', '.join(ALLOWED_IMAGE_TYPES)}) "
            f"and videos ({', '.join(ALLOWED_VIDEO_TYPES)})"
        )
    
    return mime_type, extension, media_type


def validate_file_size(file_bytes: bytes, media_type: str) -> None:
    """
    Validate file size based on media type.
    
    Args:
        file_bytes: Raw file bytes
        media_type: "image" or "video"
        
    Raises:
        MediaValidationError: If file exceeds size limit
    """
    file_size = len(file_bytes)
    
    if media_type == "image":
        if file_size > MAX_IMAGE_SIZE:
            raise MediaValidationError(
                f"Image file size ({file_size / (1024*1024):.1f}MB) "
                f"exceeds the {MAX_IMAGE_SIZE / (1024*1024):.0f}MB limit."
            )
    elif media_type == "video":
        if file_size > MAX_VIDEO_SIZE:
            raise MediaValidationError(
                f"Video file size ({file_size / (1024*1024):.1f}MB) "
                f"exceeds the {MAX_VIDEO_SIZE / (1024*1024):.0f}MB limit."
            )


def extract_image_metadata(file_bytes: bytes) -> Dict[str, Any]:
    """
    Extract metadata from image file.
    
    Args:
        file_bytes: Raw image bytes
        
    Returns:
        Dict with width, height, aspect_ratio
        
    Raises:
        MediaProcessingError: If metadata extraction fails
    """
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            width, height = img.size
            aspect_ratio = round(width / height, 4) if height > 0 else 1.0
            
            return {
                "width": width,
                "height": height,
                "aspect_ratio": aspect_ratio
            }
    except Exception as e:
        raise MediaProcessingError(f"Failed to extract image metadata: {str(e)}")


def extract_video_metadata(video_path: str) -> Dict[str, Any]:
    """
    Extract metadata from video file using ffprobe.
    
    Args:
        video_path: Path to video file
        
    Returns:
        Dict with width, height, aspect_ratio, duration
        
    Raises:
        MediaProcessingError: If metadata extraction fails
    """
    try:
        # Use ffprobe to get video metadata
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            video_path
        ]
        
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            timeout=30
        )
        
        if result.returncode != 0:
            raise MediaProcessingError(f"ffprobe failed: {result.stderr}")
        
        data = json.loads(result.stdout)
        
        # Find video stream
        video_stream = None
        for stream in data.get('streams', []):
            if stream.get('codec_type') == 'video':
                video_stream = stream
                break
        
        if not video_stream:
            raise MediaProcessingError("No video stream found in file")
        
        width = int(video_stream.get('width', 0))
        height = int(video_stream.get('height', 0))
        
        # Get duration from format or stream
        duration = float(data.get('format', {}).get('duration', 0))
        if duration == 0:
            duration = float(video_stream.get('duration', 0))
        
        aspect_ratio = round(width / height, 4) if height > 0 else 1.0
        
        return {
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "duration": round(duration, 2)
        }
        
    except subprocess.TimeoutExpired:
        raise MediaProcessingError("Video metadata extraction timed out")
    except json.JSONDecodeError:
        raise MediaProcessingError("Failed to parse ffprobe output")
    except Exception as e:
        raise MediaProcessingError(f"Failed to extract video metadata: {str(e)}")


def generate_video_thumbnail(
    video_path: str, 
    output_path: str,
    timestamp: Optional[float] = None
) -> Dict[str, Any]:
    """
    Generate a thumbnail image from video using ffmpeg.
    
    Args:
        video_path: Path to source video file
        output_path: Path for output thumbnail (should end in .jpg)
        timestamp: Time in seconds to capture frame (default: 1s or 25% of duration)
        
    Returns:
        Dict with width, height of generated thumbnail
        
    Raises:
        MediaProcessingError: If thumbnail generation fails
    """
    try:
        # If no timestamp specified, try to get one at 1 second or 25% of duration
        if timestamp is None:
            try:
                metadata = extract_video_metadata(video_path)
                duration = metadata.get('duration', 0)
                if duration > 4:
                    timestamp = min(1.0, duration * 0.25)
                else:
                    timestamp = 0.5
            except:
                timestamp = 1.0
        
        # Generate thumbnail using ffmpeg
        cmd = [
            'ffmpeg',
            '-y',  # Overwrite output
            '-ss', str(timestamp),  # Seek to timestamp
            '-i', video_path,
            '-vframes', '1',  # Extract single frame
            '-q:v', '2',  # Quality (2 is high quality)
            '-vf', 'scale=\'min(1920,iw)\':\'min(1080,ih)\':force_original_aspect_ratio=decrease',
            output_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0 or not os.path.exists(output_path):
            raise MediaProcessingError(f"ffmpeg thumbnail generation failed: {result.stderr}")
        
        # Get thumbnail dimensions
        with Image.open(output_path) as img:
            thumb_width, thumb_height = img.size
        
        return {
            "width": thumb_width,
            "height": thumb_height
        }
        
    except subprocess.TimeoutExpired:
        raise MediaProcessingError("Thumbnail generation timed out")
    except Exception as e:
        if isinstance(e, MediaProcessingError):
            raise
        raise MediaProcessingError(f"Failed to generate video thumbnail: {str(e)}")


def generate_unique_id() -> str:
    """Generate a unique identifier for media files."""
    return str(uuid.uuid4())


def get_extension_from_mime(mime_type: str) -> str:
    """Get file extension from MIME type."""
    return MIME_TO_EXTENSION.get(mime_type, "bin")


def sanitize_text(text: Optional[str], max_length: int = 500) -> Optional[str]:
    """
    Sanitize text input by removing potentially harmful content.
    
    Args:
        text: Input text
        max_length: Maximum allowed length
        
    Returns:
        Sanitized text or None
    """
    if not text:
        return None
    
    # Strip whitespace
    text = text.strip()
    
    if not text:
        return None
    
    # Truncate to max length
    if len(text) > max_length:
        text = text[:max_length]
    
    # Remove common script injection patterns (basic sanitization)
    # More robust sanitization should use a library like bleach
    dangerous_patterns = ['<script', '</script', 'javascript:', 'onerror=', 'onload=']
    for pattern in dangerous_patterns:
        text = text.replace(pattern, '')
    
    return text


def parse_tags(tags_string: Optional[str]) -> list:
    """
    Parse comma-separated tags string into a list.
    
    Args:
        tags_string: Comma-separated tags
        
    Returns:
        List of sanitized tag strings
    """
    if not tags_string:
        return []
    
    tags = []
    for tag in tags_string.split(','):
        sanitized = sanitize_text(tag.strip(), max_length=50)
        if sanitized:
            tags.append(sanitized.lower())
    
    return tags[:20]  # Limit to 20 tags
