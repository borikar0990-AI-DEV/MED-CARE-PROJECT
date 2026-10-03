"""
Minimal in-memory rate limiter for brute-force protection on auth routes.

This is intentionally simple (a dict guarded by a lock, pruned on each
call) so the project has zero extra infrastructure to run for a college
demo. It is per-process and resets on restart, which is fine for one
FastAPI worker but NOT sufficient for a real multi-instance deployment.

Production upgrade path (documented, not implemented here — see README
"Future Scope"): swap this module for `slowapi` + Redis, so limits are
shared across all app instances and survive restarts.
"""
import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import HTTPException, Request, status

_lock = threading.Lock()
_hits: Dict[str, Deque[float]] = defaultdict(deque)


def rate_limit(max_requests: int, window_seconds: int):
    """FastAPI dependency factory: allows `max_requests` per `window_seconds`,
    keyed by client IP + route. Raises HTTP 429 once the window fills up."""

    def _dependency(request: Request) -> None:
        key = f"{request.url.path}:{request.client.host if request.client else 'unknown'}"
        now = time.monotonic()

        with _lock:
            bucket = _hits[key]
            while bucket and now - bucket[0] > window_seconds:
                bucket.popleft()

            if len(bucket) >= max_requests:
                retry_after = max(1, int(window_seconds - (now - bucket[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many attempts. Please wait a moment and try again.",
                    headers={"Retry-After": str(retry_after)},
                )
            bucket.append(now)

    return _dependency
