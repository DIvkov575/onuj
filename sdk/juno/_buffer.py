"""
Thread-safe conversation buffer. Flushes to the Juno API every flush_interval
seconds or when flush_batch_size turns have accumulated — whichever comes first.
"""

import json
import logging
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import httpx

log = logging.getLogger(__name__)


@dataclass
class Turn:
    role: str
    content: str
    token_count: int | None = None


@dataclass
class ConversationBuffer:
    external_id: str
    turns: list[Turn] = field(default_factory=list)
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class JunoBuffer:
    def __init__(
        self,
        api_key: str,
        endpoint: str,
        flush_interval: float = 30.0,
        flush_batch_size: int = 50,
    ):
        self._api_key = api_key
        self._endpoint = endpoint.rstrip("/")
        self._flush_interval = flush_interval
        self._flush_batch_size = flush_batch_size

        self._lock = threading.Lock()
        self._conversations: dict[str, ConversationBuffer] = {}

        self._thread = threading.Thread(target=self._flush_loop, daemon=True)
        self._thread.start()

    def add_turn(self, conversation_id: str, role: str, content: str, token_count: int | None = None):
        with self._lock:
            if conversation_id not in self._conversations:
                self._conversations[conversation_id] = ConversationBuffer(external_id=conversation_id)
            self._conversations[conversation_id].turns.append(Turn(role=role, content=content, token_count=token_count))

        total_turns = sum(len(c.turns) for c in self._conversations.values())
        if total_turns >= self._flush_batch_size:
            threading.Thread(target=self._flush, daemon=True).start()

    def _flush_loop(self):
        while True:
            time.sleep(self._flush_interval)
            self._flush()

    def _flush(self):
        with self._lock:
            if not self._conversations:
                return
            snapshot = self._conversations.copy()
            self._conversations.clear()

        payload = {
            "conversations": [
                {
                    "external_id": buf.external_id,
                    "turns": [
                        {"role": t.role, "content": t.content, "token_count": t.token_count}
                        for t in buf.turns
                    ],
                    "started_at": buf.started_at.isoformat(),
                }
                for buf in snapshot.values()
                if buf.turns
            ]
        }

        if not payload["conversations"]:
            return

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    f"{self._endpoint}/v1/ingest",
                    json=payload,
                    headers={"Authorization": f"Bearer {self._api_key}"},
                )
                resp.raise_for_status()
        except Exception as e:
            log.warning("Juno flush failed: %s — data dropped", e)

    def flush_now(self):
        self._flush()
