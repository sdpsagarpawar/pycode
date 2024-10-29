import json

import redis

from typing import Any, Optional

from ssi_camera.env_vars import redis_port

class Store:
    """
    Session store based on Redis.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super().__new__(cls, *args, **kwargs)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if not self.initialized:
            self.initialized = True
            self.redis = redis.Redis(host='localhost', port=int(redis_port), db=0)

    def set(self, k: str, v: Any) -> None:
        as_json = json.dumps(v)
        self.redis.set(k, as_json)

    def get(self, k: str) -> Optional[Any]:
        as_json: str = self.redis.get(k)
        return json.loads(as_json)
