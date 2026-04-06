"""
OpenAI wrapper — intercepts chat.completions.create (sync, async, streaming).

Usage:
    import juno
    client = juno.wrap(openai.OpenAI())
    # or
    client = juno.wrap(openai.AsyncOpenAI())
"""

import threading
from typing import Any, Iterator, AsyncIterator

from juno._buffer import JunoBuffer


def _get_token_count(response) -> int | None:
    try:
        return response.usage.completion_tokens
    except AttributeError:
        return None


def _get_input_token_count(response) -> int | None:
    try:
        return response.usage.prompt_tokens
    except AttributeError:
        return None


class _ChatCompletionsWrapper:
    def __init__(self, completions, buffer: JunoBuffer, conv_id_getter):
        self._completions = completions
        self._buffer = buffer
        self._conv_id_getter = conv_id_getter

    def create(self, **kwargs) -> Any:
        conversation_id = kwargs.pop("juno_conversation_id", None) or self._conv_id_getter()
        messages = kwargs.get("messages", [])
        stream = kwargs.get("stream", False)

        # Log input (user) messages
        for msg in messages:
            if msg.get("role") in ("user", "system"):
                self._buffer.add_turn(conversation_id, msg["role"], msg.get("content", ""))

        if stream:
            return self._handle_stream(self._completions.create(**kwargs), conversation_id)

        response = self._completions.create(**kwargs)

        # Log assistant response
        try:
            content = response.choices[0].message.content or ""
            self._buffer.add_turn(conversation_id, "assistant", content, _get_token_count(response))
        except (IndexError, AttributeError):
            pass

        return response

    def _handle_stream(self, stream, conversation_id: str) -> Iterator:
        """Accumulate streamed chunks then log the full assistant message."""
        chunks = []
        for chunk in stream:
            chunks.append(chunk)
            yield chunk

        # Reconstruct full content from chunks
        content = ""
        for chunk in chunks:
            try:
                delta = chunk.choices[0].delta.content
                if delta:
                    content += delta
            except (IndexError, AttributeError):
                pass

        if content:
            self._buffer.add_turn(conversation_id, "assistant", content)


class _AsyncChatCompletionsWrapper:
    def __init__(self, completions, buffer: JunoBuffer, conv_id_getter):
        self._completions = completions
        self._buffer = buffer
        self._conv_id_getter = conv_id_getter

    async def create(self, **kwargs) -> Any:
        conversation_id = kwargs.pop("juno_conversation_id", None) or self._conv_id_getter()
        messages = kwargs.get("messages", [])
        stream = kwargs.get("stream", False)

        for msg in messages:
            if msg.get("role") in ("user", "system"):
                self._buffer.add_turn(conversation_id, msg["role"], msg.get("content", ""))

        if stream:
            return self._handle_stream(await self._completions.create(**kwargs), conversation_id)

        response = await self._completions.create(**kwargs)

        try:
            content = response.choices[0].message.content or ""
            self._buffer.add_turn(conversation_id, "assistant", content, _get_token_count(response))
        except (IndexError, AttributeError):
            pass

        return response

    async def _handle_stream(self, stream, conversation_id: str) -> AsyncIterator:
        content = ""
        async for chunk in stream:
            try:
                delta = chunk.choices[0].delta.content
                if delta:
                    content += delta
            except (IndexError, AttributeError):
                pass
            yield chunk

        if content:
            self._buffer.add_turn(conversation_id, "assistant", content)


# Per-thread default conversation ID (fallback when developer doesn't pass one)
_thread_local = threading.local()


def _default_conv_id() -> str:
    if not hasattr(_thread_local, "conv_id"):
        import uuid
        _thread_local.conv_id = str(uuid.uuid4())
    return _thread_local.conv_id


class OpenAIWrapper:
    """Wraps openai.OpenAI — passes through all attributes, intercepts chat.completions."""

    def __init__(self, client, buffer: JunoBuffer):
        object.__setattr__(self, "_client", client)
        object.__setattr__(self, "_buffer", buffer)

        chat_wrapper = type("ChatWrapper", (), {})()
        completions_wrapper = _ChatCompletionsWrapper(client.chat.completions, buffer, _default_conv_id)
        chat_wrapper.completions = completions_wrapper
        object.__setattr__(self, "chat", chat_wrapper)

    def __getattr__(self, name: str):
        return getattr(object.__getattribute__(self, "_client"), name)


class AsyncOpenAIWrapper:
    """Wraps openai.AsyncOpenAI."""

    def __init__(self, client, buffer: JunoBuffer):
        object.__setattr__(self, "_client", client)
        object.__setattr__(self, "_buffer", buffer)

        chat_wrapper = type("ChatWrapper", (), {})()
        completions_wrapper = _AsyncChatCompletionsWrapper(client.chat.completions, buffer, _default_conv_id)
        chat_wrapper.completions = completions_wrapper
        object.__setattr__(self, "chat", chat_wrapper)

    def __getattr__(self, name: str):
        return getattr(object.__getattribute__(self, "_client"), name)
