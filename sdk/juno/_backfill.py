"""
Historical backfill — upload past conversations to Juno.

Accepts:
  - path to an OpenAI JSONL export file
  - a list of dicts in the Juno conversation format

Usage:
    import juno
    juno.backfill("path/to/logs.jsonl")
    # or
    juno.backfill([{"external_id": "...", "turns": [...]}])
"""

import json
import logging
from pathlib import Path
from typing import Union

import httpx

log = logging.getLogger(__name__)


def backfill(
    source: Union[str, Path, list[dict]],
    api_key: str,
    endpoint: str,
    batch_size: int = 100,
):
    conversations = _load(source)
    total = len(conversations)
    sent = 0

    with httpx.Client(timeout=30.0) as client:
        for i in range(0, total, batch_size):
            batch = conversations[i : i + batch_size]
            try:
                resp = client.post(
                    f"{endpoint.rstrip('/')}/v1/backfill",
                    json={"conversations": batch},
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                resp.raise_for_status()
                sent += len(batch)
                log.info("Backfill: %d / %d", sent, total)
            except Exception as e:
                log.error("Backfill batch failed: %s", e)

    log.info("Backfill complete: %d conversations sent", sent)
    return sent


def _load(source) -> list[dict]:
    if isinstance(source, list):
        return source

    path = Path(source)
    if not path.exists():
        raise FileNotFoundError(f"Backfill file not found: {path}")

    conversations = []

    if path.suffix == ".jsonl":
        # OpenAI JSONL format: each line is a full API response or a messages array
        with open(path) as f:
            for i, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    conv = _parse_openai_export(obj, external_id=f"backfill_{i}")
                    if conv:
                        conversations.append(conv)
                except json.JSONDecodeError:
                    log.warning("Skipping malformed JSONL line %d", i)
    elif path.suffix == ".json":
        with open(path) as f:
            data = json.load(f)
            if isinstance(data, list):
                conversations = data
            else:
                conversations = [data]
    else:
        raise ValueError(f"Unsupported file format: {path.suffix}. Use .jsonl or .json")

    return conversations


def _parse_openai_export(obj: dict, external_id: str) -> dict | None:
    """Convert an OpenAI API response or messages array into Juno format."""
    turns = []

    # Format 1: list of messages directly
    if isinstance(obj, list):
        for msg in obj:
            if msg.get("role") and msg.get("content"):
                turns.append({"role": msg["role"], "content": msg["content"]})

    # Format 2: OpenAI API response object {"messages": [...], "response": {...}}
    elif "messages" in obj:
        for msg in obj["messages"]:
            if msg.get("role") and msg.get("content"):
                turns.append({"role": msg["role"], "content": msg["content"]})
        # Add assistant response if present
        try:
            content = obj["response"]["choices"][0]["message"]["content"]
            turns.append({"role": "assistant", "content": content})
        except (KeyError, IndexError):
            pass

    if not turns:
        return None

    return {
        "external_id": obj.get("id", external_id),
        "turns": turns,
        "started_at": obj.get("created_at"),
    }
