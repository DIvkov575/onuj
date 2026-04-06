"""
Anthropic wrapper — intercepts messages.create (sync, async, streaming).

Usage:
    import juno
    import anthropic

    client = juno.wrap(anthropic.Anthropic())
    # or
    client = juno.wrap(anthropic.AsyncAnthropic())
"""

import threading
from typing import Any, Iterator, AsyncIterator

from juno._buffer import JunoBuffer


def _extract_text(content) -> str:
    """Pull text out of Anthropic's content block list."""
    if isinstance(content, str):
        return content
    parts = []
    for block in content:
        text = getattr(block, "text", None)
        if text:
            parts.append(text)
    return "".join(parts)


class _MessagesWrapper:
    def __init__(self, messages, buffer: JunoBuffer, conv_id_getter):
        self._messages = messages
        self._buffer = buffer
        self._conv_id_getter = conv_id_getter

    def create(self, **kwargs) -> Any:
        conversation_id = kwargs.pop("juno_conversation_id", None) or self._conv_id_getter()
        messages = kwargs.get("messages", [])
        system = kwargs.get("system")
        stream = kwargs.get("stream", False)

        if system:
            self._buffer.add_turn(conversation_id, "system", system if isinstance(system, str) else str(system))
        for msg in messages:
            role = msg.get("role")
            if role in ("user", "assistant"):
                content = msg.get("content", "")
                self._buffer.add_turn(conversation_id, role, content if isinstance(content, str) else _extract_text(content))

        if stream:
            return self._handle_stream(self._messages.create(**kwargs), conversation_id)

        response = self._messages.create(**kwargs)
        text = _extract_text(response.content)
        output_tokens = getattr(getattr(response, "usage", None), "output_tokens", None)
        self._buffer.add_turn(conversation_id, "assistant", text, output_tokens)
        return response

    def _handle_stream(self, stream, conversation_id: str) -> Iterator:
        content = ""
        for event in stream:
            yield event
            event_type = getattr(event, "type", None)
            if event_type == "content_block_delta":
                delta = getattr(event, "delta", None)
                if getattr(delta, "type", None) == "text_delta":
                    content += delta.text or ""
        if content:
            self._buffer.add_turn(conversation_id, "assistant", content)


class _AsyncMessagesWrapper:
    def __init__(self, messages, buffer: JunoBuffer, conv_id_getter):
        self._messages = messages
        self._buffer = buffer
        self._conv_id_getter = conv_id_getter

    async def create(self, **kwargs) -> Any:
        conversation_id = kwargs.pop("juno_conversation_id", None) or self._conv_id_getter()
        messages = kwargs.get("messages", [])
        system = kwargs.get("system")
        stream = kwargs.get("stream", False)

        if system:
            self._buffer.add_turn(conversation_id, "system", system if isinstance(system, str) else str(system))
        for msg in messages:
            role = msg.get("role")
            if role in ("user", "assistant"):
                content = msg.get("content", "")
                self._buffer.add_turn(conversation_id, role, content if isinstance(content, str) else _extract_text(content))

        if stream:
            return self._handle_stream(await self._messages.create(**kwargs), conversation_id)

        response = await self._messages.create(**kwargs)
        text = _extract_text(response.content)
        output_tokens = getattr(getattr(response, "usage", None), "output_tokens", None)
        self._buffer.add_turn(conversation_id, "assistant", text, output_tokens)
        return response

    async def _handle_stream(self, stream, conversation_id: str) -> AsyncIterator:
        content = ""
        async for event in stream:
            yield event
            event_type = getattr(event, "type", None)
            if event_type == "content_block_delta":
                delta = getattr(event, "delta", None)
                if getattr(delta, "type", None) == "text_delta":
                    content += delta.text or ""
        if content:
            self._buffer.add_turn(conversation_id, "assistant", content)


# Per-thread default conversation ID
_thread_local = threading.local()


def _default_conv_id() -> str:
    if not hasattr(_thread_local, "conv_id"):
        import uuid
        _thread_local.conv_id = str(uuid.uuid4())
    return _thread_local.conv_id


class AnthropicWrapper:
    """Wraps anthropic.Anthropic — pass-through except messages.create."""

    def __init__(self, client, buffer: JunoBuffer):
        object.__setattr__(self, "_client", client)
        object.__setattr__(self, "_buffer", buffer)
        object.__setattr__(self, "messages", _MessagesWrapper(client.messages, buffer, _default_conv_id))

    def __getattr__(self, name: str):
        return getattr(object.__getattribute__(self, "_client"), name)


class AsyncAnthropicWrapper:
    """Wraps anthropic.AsyncAnthropic."""

    def __init__(self, client, buffer: JunoBuffer):
        object.__setattr__(self, "_client", client)
        object.__setattr__(self, "_buffer", buffer)
        object.__setattr__(self, "messages", _AsyncMessagesWrapper(client.messages, buffer, _default_conv_id))

    def __getattr__(self, name: str):
        return getattr(object.__getattribute__(self, "_client"), name)
