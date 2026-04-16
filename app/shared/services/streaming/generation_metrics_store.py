"""
In-memory store for per-generation performance metrics (single-replica).

Accumulates node-update and status-poll stats keyed by generation_version_id.
Thread-safe via asyncio.Lock. Used only when RECORD_PERFORMANCE_METRICS is True.
"""
import threading
from datetime import datetime, UTC
from typing import Dict, Any, Optional

# Bounded list size for percentile computation (p50, p95)
DURATION_SAMPLE_SIZE = 100


def _update_min_max_sum_count(agg: Dict[str, Any], value: int) -> None:
    if agg is None:
        return
    agg["count"] = agg.get("count", 0) + 1
    agg["sum"] = agg.get("sum", 0) + value
    if agg.get("min") is None or value < agg["min"]:
        agg["min"] = value
    if agg.get("max") is None or value > agg["max"]:
        agg["max"] = value


def _append_duration_sample(samples: list, value: float, max_size: int = DURATION_SAMPLE_SIZE) -> None:
    samples.append(value)
    if len(samples) > max_size:
        samples.pop(0)


def _percentile(sorted_values: list, p: float) -> Optional[float]:
    if not sorted_values:
        return None
    k = (len(sorted_values) - 1) * (p / 100.0)
    f = int(k)
    c = f + 1 if f + 1 < len(sorted_values) else f
    return sorted_values[f] + (k - f) * (sorted_values[c] - sorted_values[f]) if f != c else sorted_values[f]


def _build_duration_stats(samples: list, agg_min_max_sum_count: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not samples and not agg_min_max_sum_count:
        return None
    result: Dict[str, Any] = {"count": agg_min_max_sum_count.get("count", 0) if agg_min_max_sum_count else 0}
    if agg_min_max_sum_count:
        result["min"] = agg_min_max_sum_count.get("min")
        result["max"] = agg_min_max_sum_count.get("max")
    if samples:
        sorted_vals = sorted(samples)
        result["p50"] = round(_percentile(sorted_vals, 50), 2)
        result["p95"] = round(_percentile(sorted_vals, 95), 2)
        if "min" not in result or result["min"] is None:
            result["min"] = int(min(samples))
        if "max" not in result or result["max"] is None:
            result["max"] = int(max(samples))
    return result


class GenerationMetricsStore:
    """In-memory store for per-generation metrics. Thread-safe."""

    def __init__(self) -> None:
        self._store: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def _get_or_create(self, generation_version_id: str) -> Dict[str, Any]:
        key = str(generation_version_id)
        with self._lock:
            if key not in self._store:
                self._store[key] = {
                    "started_at": None,
                    "node_updates": {
                        "count": 0,
                        "first_at": None,
                        "last_at": None,
                        "payload_bytes": {"min": None, "max": None, "sum": 0, "count": 0},
                        "redis_write_duration_ms": {"min": None, "max": None, "sum": 0, "count": 0},
                        "redis_write_samples": [],
                        "nodes_received": [],
                    },
                    "status_polls": {
                        "count": 0,
                        "response_bytes": {"min": None, "max": None, "sum": 0, "count": 0},
                        "redis_read_duration_ms": {"min": None, "max": None, "sum": 0, "count": 0},
                        "redis_read_samples": [],
                        "poll_timestamps": [],
                    },
                }
            return self._store[key]

    def record_node_update(
        self,
        generation_version_id: str,
        node_name: str,
        payload_bytes: int,
        redis_write_duration_ms: float,
    ) -> None:
        now = datetime.now(UTC).replace(tzinfo=None).isoformat()
        rec = self._get_or_create(generation_version_id)
        with self._lock:
            if rec["started_at"] is None:
                rec["started_at"] = now
            nu = rec["node_updates"]
            nu["count"] += 1
            nu["first_at"] = nu["first_at"] or now
            nu["last_at"] = now
            _update_min_max_sum_count(nu["payload_bytes"], payload_bytes)
            _update_min_max_sum_count(nu["redis_write_duration_ms"], int(round(redis_write_duration_ms)))
            _append_duration_sample(nu["redis_write_samples"], redis_write_duration_ms)
            if nu.get("nodes_received") is None:
                nu["nodes_received"] = []
            nodes_received = nu["nodes_received"]
            nodes_received.append({
                "node_name": node_name,
                "payload_bytes": payload_bytes,
                "redis_write_ms": int(round(redis_write_duration_ms)),
                "received_at": now,
            })

    def record_status_poll(
        self,
        generation_version_id: str,
        response_bytes: int,
        redis_read_duration_ms: float,
    ) -> None:
        now = datetime.now(UTC).replace(tzinfo=None).isoformat()
        rec = self._get_or_create(generation_version_id)
        with self._lock:
            if rec["started_at"] is None:
                rec["started_at"] = now
            sp = rec["status_polls"]
            sp["count"] += 1
            _update_min_max_sum_count(sp["response_bytes"], response_bytes)
            _update_min_max_sum_count(sp["redis_read_duration_ms"], int(round(redis_read_duration_ms)))
            _append_duration_sample(sp["redis_read_samples"], redis_read_duration_ms)
            if sp.get("poll_timestamps") is None:
                sp["poll_timestamps"] = []
            sp["poll_timestamps"].append(now)

    def get_and_remove(self, generation_version_id: str) -> Optional[Dict[str, Any]]:
        """Return aggregated record for this generation and remove it from the store."""
        key = str(generation_version_id)
        with self._lock:
            rec = self._store.pop(key, None)
        if rec is None:
            return None
        nu = rec["node_updates"]
        sp = rec["status_polls"]
        payload = nu["payload_bytes"]
        rw = nu["redis_write_duration_ms"]
        rb = sp["response_bytes"]
        rr = sp["redis_read_duration_ms"]
        nodes_received = nu.get("nodes_received") or []
        return {
            "started_at": rec["started_at"],
            "node_updates": {
                "received": nu["count"],
                "payload_bytes": {
                    "min": payload.get("min"),
                    "max": payload.get("max"),
                    "sum": payload.get("sum"),
                    "count": payload.get("count", 0),
                },
                "redis_write_duration_ms": _build_duration_stats(nu.get("redis_write_samples", []), rw),
                "nodes_received": list(nodes_received),
            },
            "status_polls": {
                "count": sp["count"],
                "response_bytes": {
                    "min": rb.get("min"),
                    "max": rb.get("max"),
                    "sum": rb.get("sum"),
                    "count": rb.get("count", 0),
                },
                "redis_read_duration_ms": _build_duration_stats(sp.get("redis_read_samples", []), rr),
                "poll_timestamps": list(sp.get("poll_timestamps") or []),
            },
        }


generation_metrics_store = GenerationMetricsStore()
