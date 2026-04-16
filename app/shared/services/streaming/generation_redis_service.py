"""
Redis service for generation progress tracking.

SIMPLIFIED: Removed phase/parallel fields from NodeExecutionEntry.
"""
import json
import redis
from redis.connection import ConnectionPool
import time
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

from app.core.config_redis import redis_config

logger = logging.getLogger(__name__)

# Global connection pool for Redis (reused across all operations)
_redis_pool: Optional[ConnectionPool] = None
_redis_pool_config_hash: Optional[str] = None


def get_redis_pool() -> ConnectionPool:
    """Get or create Redis connection pool."""
    global _redis_pool, _redis_pool_config_hash
    
    # Create a hash of current config to detect changes
    current_config_hash = f"{redis_config.REDIS_HOST}:{redis_config.REDIS_PORT}:{redis_config.REDIS_DB}:{bool(redis_config.REDIS_PASSWORD)}"
    
    # Recreate pool if config changed
    if _redis_pool is None or _redis_pool_config_hash != current_config_hash:
        if _redis_pool is not None:
            logger.info(f"Redis config changed, recreating connection pool. Old: {_redis_pool_config_hash}, New: {current_config_hash}")
            try:
                _redis_pool.disconnect()
            except Exception:
                pass
        
        _redis_pool_config_hash = current_config_hash
        
        # Use password only if provided (for remote Redis)
        connection_kwargs = {
            "host": redis_config.REDIS_HOST,
            "port": redis_config.REDIS_PORT,
            "db": redis_config.REDIS_DB,
            "decode_responses": True,
            "max_connections": 50,  # Max connections in pool
            "socket_timeout": 5,  # 5 second timeout for operations
            "socket_connect_timeout": 5,  # 5 second timeout for connection
            "retry_on_timeout": True,
            "health_check_interval": 30,  # Check connection health every 30s
        }
        
        # Determine connection type
        connection_type = "remote" if redis_config.REDIS_PASSWORD else "local"
        
        # Only add password if provided (local Redis doesn't need it)
        if redis_config.REDIS_PASSWORD:
            connection_kwargs["password"] = redis_config.REDIS_PASSWORD
        
        _redis_pool = ConnectionPool(**connection_kwargs)
        
        # Log connection details (INFO level for one-time startup event)
        logger.info(
            f"Redis connection pool created: type={connection_type}, "
            f"host={redis_config.REDIS_HOST}, port={redis_config.REDIS_PORT}, "
            f"db={redis_config.REDIS_DB}"
        )
        
        # Warn if config doesn't match expected local values (for local development)
        if redis_config.REDIS_HOST != "localhost" or redis_config.REDIS_PORT != 6380:
            logger.warning(
                f"Redis config mismatch: Expected localhost:6380, got {redis_config.REDIS_HOST}:{redis_config.REDIS_PORT}. "
                f"Check ENV_FILE or REDIS_* env vars."
            )
    return _redis_pool


class GenerationRedisService:
    """Service for tracking generation progress in Redis"""
    
    def __init__(self):
        # Use connection pool for better performance and connection reuse
        pool = get_redis_pool()
        self.redis_client = redis.Redis(connection_pool=pool)
        self.ttl = redis_config.GENERATION_PROGRESS_TTL
    
    # ========================================================================
    # KEY GENERATION
    # ========================================================================
    
    def _get_status_key(self, gen_id: uuid.UUID) -> str:
        return f"generation:{gen_id}:status"
    
    def _get_progress_key(self, gen_id: uuid.UUID) -> str:
        return f"generation:{gen_id}:progress"
    
    def _get_current_node_key(self, gen_id: uuid.UUID) -> str:
        return f"generation:{gen_id}:current_node"
    
    def _get_current_node_display_key(self, gen_id: uuid.UUID) -> str:
        return f"generation:{gen_id}:current_node_display"
    
    def _get_events_key(self, gen_id: uuid.UUID) -> str:
        return f"generation:{gen_id}:events"
    
    def _get_preview_link_key(self, gen_id: uuid.UUID) -> str:
        return f"generation:{gen_id}:preview_link"
    
    def _get_error_key(self, gen_id: uuid.UUID) -> str:
        return f"generation:{gen_id}:error"
    
    def _get_execution_log_key(self, gen_id: uuid.UUID) -> str:
        return f"generation:{gen_id}:execution_log"
    
    def _get_started_at_key(self, gen_id: uuid.UUID) -> str:
        return f"generation:{gen_id}:started_at"
    
    # ========================================================================
    # INITIALIZATION
    # ========================================================================
    
    def initialize_generation(self, gen_id: uuid.UUID, status: str = "pending") -> None:
        """Initialize Redis keys for a new generation."""
        started_at_str = datetime.now(UTC).replace(tzinfo=None).isoformat()
        
        self.redis_client.setex(self._get_status_key(gen_id), self.ttl, status)
        self.redis_client.setex(self._get_progress_key(gen_id), self.ttl, "0")
        self.redis_client.setex(self._get_current_node_key(gen_id), self.ttl, "initializing")
        self.redis_client.setex(self._get_started_at_key(gen_id), self.ttl, started_at_str)
        
        # Initialize empty lists
        events_key = self._get_events_key(gen_id)
        self.redis_client.delete(events_key)
        self.redis_client.expire(events_key, self.ttl)
        
        execution_log_key = self._get_execution_log_key(gen_id)
        self.redis_client.delete(execution_log_key)
        self.redis_client.expire(execution_log_key, self.ttl)
    
    # ========================================================================
    # STATUS UPDATES
    # ========================================================================
    
    def update_status(self, gen_id: uuid.UUID, status: str) -> None:
        """Update generation status."""
        start_time = time.time()
        self.redis_client.setex(self._get_status_key(gen_id), self.ttl, status)
        elapsed = time.time() - start_time
        if elapsed > 0.01:  # Log if >10ms
            logger.warning(f"Slow Redis write (update_status) for {gen_id}: {elapsed*1000:.2f}ms")
    
    def update_progress(self, gen_id: uuid.UUID, progress: int, current_node: Optional[str] = None) -> None:
        """Update generation progress."""
        self.redis_client.setex(self._get_progress_key(gen_id), self.ttl, str(progress))
        if current_node:
            self.redis_client.setex(self._get_current_node_key(gen_id), self.ttl, current_node)
    
    def set_preview_link(self, gen_id: uuid.UUID, preview_link: str) -> None:
        """Store preview link."""
        self.redis_client.setex(self._get_preview_link_key(gen_id), self.ttl, preview_link)
    
    def set_error(self, gen_id: uuid.UUID, error_message: str) -> None:
        """Store error message."""
        self.redis_client.setex(self._get_error_key(gen_id), self.ttl, error_message)
        logger.info(f"Redis write (set_error) for {gen_id}: {error_message[:100]}")
    
    # ========================================================================
    # EXECUTION LOG (SIMPLIFIED)
    # ========================================================================
    
    def append_execution_entry_dict(self, gen_id: uuid.UUID, entry_dict: Dict[str, Any]) -> None:
        """
        Append a node execution entry from a dictionary.
        
        SIMPLIFIED: No phase/parallel fields expected.
        Expected fields: node_name, display_name, status, output_summary, completed_at, duration_ms
        """
        start_time = time.time()
        
        if "completed_at" not in entry_dict or entry_dict["completed_at"] is None:
            entry_dict["completed_at"] = datetime.now(UTC).replace(tzinfo=None).isoformat()
        
        execution_log_key = self._get_execution_log_key(gen_id)
        entry_json = json.dumps(entry_dict)
        payload_size = len(entry_json.encode('utf-8'))
        
        # Use pipeline for multiple operations
        pipe = self.redis_client.pipeline()
        pipe.rpush(execution_log_key, entry_json)
        pipe.expire(execution_log_key, self.ttl)
        
        # Update current node info
        node_name = entry_dict.get("node_name", "")
        display_name = entry_dict.get("display_name", node_name)
        
        if node_name:
            pipe.setex(self._get_current_node_key(gen_id), self.ttl, node_name)
        if display_name:
            pipe.setex(self._get_current_node_display_key(gen_id), self.ttl, display_name)
        
        pipe.execute()
        
        elapsed = time.time() - start_time
        if elapsed > 0.01:  # Log if >10ms
            logger.warning(f"Slow Redis write (append_execution_entry) for {gen_id}: {elapsed*1000:.2f}ms, payload_size={payload_size}B")
    
    def get_execution_log(self, gen_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Get the complete execution log for a generation."""
        execution_log_key = self._get_execution_log_key(gen_id)
        entries_json = self.redis_client.lrange(execution_log_key, 0, -1)
        
        entries = []
        for entry_str in entries_json:
            try:
                entries.append(json.loads(entry_str))
            except json.JSONDecodeError:
                continue
        return entries
    
    def get_nodes_completed_count(self, gen_id: uuid.UUID) -> int:
        """Get count of completed nodes."""
        return self.redis_client.llen(self._get_execution_log_key(gen_id))
    
    def get_started_at(self, gen_id: uuid.UUID) -> Optional[str]:
        """Get generation start timestamp."""
        return self.redis_client.get(self._get_started_at_key(gen_id))
    
    def get_current_node_display(self, gen_id: uuid.UUID) -> Optional[str]:
        """Get current node display name."""
        return self.redis_client.get(self._get_current_node_display_key(gen_id))
    
    # ========================================================================
    # EVENT TRACKING
    # ========================================================================
    
    def add_event(
        self,
        gen_id: uuid.UUID,
        event_type: str,
        node_name: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add an event to the generation timeline."""
        event = {
            "timestamp": datetime.now(UTC).replace(tzinfo=None).isoformat(),
            "event_type": event_type,
            "node_name": node_name,
            "data": data or {}
        }
        events_key = self._get_events_key(gen_id)
        self.redis_client.rpush(events_key, json.dumps(event))
        self.redis_client.expire(events_key, self.ttl)
    
    # ========================================================================
    # DATA RETRIEVAL
    # ========================================================================
    
    def get_status(self, gen_id: uuid.UUID) -> Optional[str]:
        return self.redis_client.get(self._get_status_key(gen_id))
    
    def get_progress(self, gen_id: uuid.UUID) -> int:
        progress_str = self.redis_client.get(self._get_progress_key(gen_id))
        return int(progress_str) if progress_str else 0
    
    def get_current_node(self, gen_id: uuid.UUID) -> Optional[str]:
        return self.redis_client.get(self._get_current_node_key(gen_id))
    
    def get_preview_link(self, gen_id: uuid.UUID) -> Optional[str]:
        return self.redis_client.get(self._get_preview_link_key(gen_id))
    
    def get_error(self, gen_id: uuid.UUID) -> Optional[str]:
        return self.redis_client.get(self._get_error_key(gen_id))
    
    def get_events(self, gen_id: uuid.UUID) -> List[Dict[str, Any]]:
        events_key = self._get_events_key(gen_id)
        events_json = self.redis_client.lrange(events_key, 0, -1)
        
        events = []
        for event_str in events_json:
            try:
                events.append(json.loads(event_str))
            except json.JSONDecodeError:
                continue
        return events
    
    def get_full_status(self, gen_id: uuid.UUID) -> Dict[str, Any]:
        """Get complete generation status for polling endpoint."""
        start_time = time.time()
        
        # Use pipeline to batch all Redis reads for better performance
        pipe = self.redis_client.pipeline()
        
        # Queue all reads in pipeline
        pipe.get(self._get_status_key(gen_id))
        pipe.get(self._get_progress_key(gen_id))
        pipe.get(self._get_current_node_key(gen_id))
        pipe.get(self._get_current_node_display_key(gen_id))
        pipe.get(self._get_preview_link_key(gen_id))
        pipe.get(self._get_error_key(gen_id))
        pipe.get(self._get_started_at_key(gen_id))
        pipe.lrange(self._get_events_key(gen_id), 0, -1)
        pipe.lrange(self._get_execution_log_key(gen_id), 0, -1)
        pipe.llen(self._get_execution_log_key(gen_id))
        
        # Execute all reads in one round trip
        results = pipe.execute()
        
        redis_read_time = time.time() - start_time
        
        # Unpack results
        status = results[0]
        progress_str = results[1]
        current_node = results[2]
        current_node_display = results[3]
        preview_link = results[4]
        error_message = results[5]
        started_at_str = results[6]
        events_json = results[7]
        execution_log_json = results[8]
        nodes_completed = results[9]
        
        # Parse JSON arrays
        events = []
        for event_str in events_json:
            try:
                events.append(json.loads(event_str))
            except json.JSONDecodeError:
                continue
        
        execution_log = []
        for entry_str in execution_log_json:
            try:
                execution_log.append(json.loads(entry_str))
            except json.JSONDecodeError:
                continue
        
        # Calculate elapsed time
        elapsed_seconds = 0
        if started_at_str:
            try:
                started_at = datetime.fromisoformat(started_at_str)
                elapsed_seconds = int((datetime.now(UTC).replace(tzinfo=None) - started_at).total_seconds())
            except (ValueError, TypeError):
                pass
        
        total_time = time.time() - start_time
        
        # Calculate total payload size read
        total_payload_size = 0
        for result in results:
            if isinstance(result, list):
                # For lists (events, execution_log), sum up all string sizes
                for item in result:
                    if isinstance(item, str):
                        total_payload_size += len(item.encode('utf-8'))
            elif isinstance(result, str):
                total_payload_size += len(result.encode('utf-8'))
        
        # Log only if slow (>10ms)
        if redis_read_time > 0.01:
            logger.warning(
                f"Slow Redis read (get_full_status) for {gen_id}: {redis_read_time*1000:.2f}ms "
                f"(total: {total_time*1000:.2f}ms), payload_size={total_payload_size}B, "
                f"events_count={len(events)}, execution_log_count={len(execution_log)}"
            )
        
        return {
            "status": status or "unknown",
            "progress": int(progress_str) if progress_str else 0,
            "current_node": current_node,
            "current_node_display": current_node_display,
            "preview_link": preview_link,
            "error_message": error_message,
            "events": events,
            "execution_log": execution_log,
            "nodes_completed": nodes_completed,
            "started_at": started_at_str,
            "elapsed_seconds": elapsed_seconds,
        }
    
    # ========================================================================
    # CLEANUP
    # ========================================================================
    
    def delete_generation_data(self, gen_id: uuid.UUID) -> None:
        """Delete all Redis data for a generation."""
        keys = [
            self._get_status_key(gen_id),
            self._get_progress_key(gen_id),
            self._get_current_node_key(gen_id),
            self._get_current_node_display_key(gen_id),
            self._get_events_key(gen_id),
            self._get_preview_link_key(gen_id),
            self._get_error_key(gen_id),
            self._get_execution_log_key(gen_id),
            self._get_started_at_key(gen_id),
        ]
        self.redis_client.delete(*keys)
    
    def reset_for_retry(self, gen_id: uuid.UUID) -> None:
        """Reset generation state for retry attempt."""
        self.redis_client.delete(self._get_execution_log_key(gen_id))
        self.update_status(gen_id, "processing")
        self.redis_client.delete(self._get_error_key(gen_id))
        self.redis_client.setex(self._get_current_node_key(gen_id), self.ttl, "retrying")
        self.add_event(gen_id, "retry_started", data={"timestamp": datetime.now(UTC).replace(tzinfo=None).isoformat()})
    
    def ping(self) -> bool:
        """Check Redis connection"""
        try:
            return self.redis_client.ping()
        except Exception:
            return False


generation_redis_service = GenerationRedisService()
