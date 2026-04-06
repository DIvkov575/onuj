"""
Juno SDK — user intent analytics for conversational AI.

Quickstart (OpenAI):
    import juno, openai
    juno.configure(api_key="juno_sk_...")
    client = juno.wrap(openai.OpenAI())
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[...],
        juno_conversation_id="session_abc123",
    )

Quickstart (Anthropic):
    import juno, anthropic
    juno.configure(api_key="juno_sk_...")
    client = juno.wrap(anthropic.Anthropic())
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[...],
        juno_conversation_id="session_abc123",
    )
"""

import logging
import os
from pathlib import Path
from typing import Union

from juno._buffer import JunoBuffer
from juno._backfill import backfill as _backfill_fn

log = logging.getLogger(__name__)

# Module-level config
_config: dict = {
    "api_key": None,
    "endpoint": "https://api.juno.so",
    "flush_interval": 30.0,
    "flush_batch_size": 50,
}
_buffer: JunoBuffer | None = None


def configure(
    api_key: str | None = None,
    endpoint: str | None = None,
    flush_interval: float | None = None,
    flush_batch_size: int | None = None,
):
    """Configure Juno. Can also be set via JUNO_API_KEY environment variable."""
    global _buffer

    _config["api_key"] = api_key or os.environ.get("JUNO_API_KEY") or _config["api_key"]
    if endpoint:
        _config["endpoint"] = endpoint
    if flush_interval:
        _config["flush_interval"] = flush_interval
    if flush_batch_size:
        _config["flush_batch_size"] = flush_batch_size

    # Recreate buffer with new config
    if _config["api_key"]:
        _buffer = JunoBuffer(
            api_key=_config["api_key"],
            endpoint=_config["endpoint"],
            flush_interval=_config["flush_interval"],
            flush_batch_size=_config["flush_batch_size"],
        )


def _get_buffer() -> JunoBuffer:
    global _buffer
    if _buffer is None:
        api_key = _config["api_key"] or os.environ.get("JUNO_API_KEY")
        if not api_key:
            raise RuntimeError(
                "Juno API key not set. Call juno.configure(api_key='juno_sk_...') "
                "or set the JUNO_API_KEY environment variable."
            )
        _buffer = JunoBuffer(
            api_key=api_key,
            endpoint=_config["endpoint"],
            flush_interval=_config["flush_interval"],
            flush_batch_size=_config["flush_batch_size"],
        )
    return _buffer


def wrap(client, conversation_id: str | None = None):
    """
    Wrap an OpenAI or AsyncOpenAI client to capture conversations.

    Args:
        client: openai.OpenAI() or openai.AsyncOpenAI()
        conversation_id: Optional default conversation ID for this client instance.

    Returns:
        Wrapped client — pass-through for all methods except chat.completions.create.
    """
    buffer = _get_buffer()

    # Detect client type by class name (avoids hard openai import dependency)
    class_name = type(client).__name__

    if class_name == "OpenAI":
        from juno.wrappers.openai import OpenAIWrapper
        return OpenAIWrapper(client, buffer)

    elif class_name == "AsyncOpenAI":
        from juno.wrappers.openai import AsyncOpenAIWrapper
        return AsyncOpenAIWrapper(client, buffer)

    elif class_name == "Anthropic":
        from juno.wrappers.anthropic import AnthropicWrapper
        return AnthropicWrapper(client, buffer)

    elif class_name == "AsyncAnthropic":
        from juno.wrappers.anthropic import AsyncAnthropicWrapper
        return AsyncAnthropicWrapper(client, buffer)

    else:
        raise TypeError(
            f"juno.wrap() received unsupported client type: {class_name}. "
            "Supported: openai.OpenAI, openai.AsyncOpenAI, anthropic.Anthropic, anthropic.AsyncAnthropic"
        )


def backfill(source: Union[str, Path, list[dict]], batch_size: int = 100) -> int:
    """
    Upload historical conversations to Juno.

    Args:
        source: Path to .jsonl or .json file, or a list of conversation dicts.
        batch_size: Conversations per HTTP request.

    Returns:
        Number of conversations sent.
    """
    buffer = _get_buffer()
    return _backfill_fn(
        source=source,
        api_key=_config["api_key"] or os.environ.get("JUNO_API_KEY", ""),
        endpoint=_config["endpoint"],
        batch_size=batch_size,
    )


def flush():
    """Manually flush buffered conversations to the API."""
    if _buffer:
        _buffer.flush_now()
