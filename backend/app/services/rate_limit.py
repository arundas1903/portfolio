import time
from collections import defaultdict
from threading import Lock


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def _prune(self, key: str, now: float) -> list[float]:
        window_start = now - self.window_seconds
        hits = [timestamp for timestamp in self._hits[key] if timestamp > window_start]
        self._hits[key] = hits
        return hits

    def peek(self, key: str) -> tuple[int, int]:
        now = time.time()
        with self._lock:
            hits = self._prune(key, now)
            remaining = max(0, self.max_requests - len(hits))
            retry_after = 0
            if remaining == 0 and hits:
                retry_after = max(1, int(hits[0] + self.window_seconds - now))
            return remaining, retry_after

    def consume(self, key: str) -> tuple[bool, int, int]:
        now = time.time()
        with self._lock:
            hits = self._prune(key, now)
            if len(hits) >= self.max_requests:
                retry_after = max(1, int(hits[0] + self.window_seconds - now))
                return False, 0, retry_after

            hits.append(now)
            self._hits[key] = hits
            remaining = max(0, self.max_requests - len(hits))
            return True, remaining, 0


chat_rate_limiter = SlidingWindowRateLimiter(max_requests=20, window_seconds=30 * 60)
