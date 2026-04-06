import { NextRequest, NextResponse } from 'next/server'

// ── Disable by removing <DocsChatbot /> from docs/page.tsx ────────────────────
// This route still exists but is only called from that component.

const DOCS_CONTEXT = `
You are a helpful assistant for Juno, an analytics SDK for conversational AI products.
Answer questions based on the documentation below. Be concise. Use code examples when helpful.
If asked something not covered in the docs, say so clearly.

=== JUNO DOCUMENTATION ===

INSTALLATION
  pip install juno-analytics
  Requires Python 3.9+.

QUICKSTART (OpenAI)
  import juno, openai
  juno.configure(api_key="juno_sk_...")   # or set JUNO_API_KEY env var
  client = juno.wrap(openai.OpenAI())
  response = client.chat.completions.create(
      model="gpt-4o",
      messages=[{"role": "user", "content": "..."}],
  )

QUICKSTART (Anthropic)
  import juno, anthropic
  juno.configure(api_key="juno_sk_...")
  client = juno.wrap(anthropic.Anthropic())
  response = client.messages.create(
      model="claude-opus-4-6",
      max_tokens=1024,
      system="You are a helpful assistant.",
      messages=[{"role": "user", "content": "..."}],
  )
  The system parameter is captured as a system turn. All other params pass through unchanged.

  The wrapped client is a transparent pass-through for both OpenAI and Anthropic. All methods work identically to the original.

CONVERSATION IDs
  Pass juno_conversation_id to group turns from the same session:
    client.chat.completions.create(
        model="gpt-4o",
        messages=[...],
        juno_conversation_id="session_abc123",
    )
  Without it, each thread gets an auto-generated ID.
  Re-sending the same external_id updates the conversation — safe to replay full histories.

ASYNC
  Pass openai.AsyncOpenAI() instead of OpenAI(). Works identically.
    client = juno.wrap(openai.AsyncOpenAI())
    response = await client.chat.completions.create(...)

STREAMING
  Works without changes. Juno accumulates chunks and logs the full message after the stream ends.
    stream = client.chat.completions.create(..., stream=True, juno_conversation_id=session_id)
    for chunk in stream:
        print(chunk.choices[0].delta.content or "", end="")

BACKFILL (upload historical conversations)
  From a file:
    juno.backfill("conversations.jsonl")

  From memory:
    juno.backfill([
        {
            "external_id": "session_001",
            "turns": [
                {"role": "user", "content": "..."},
                {"role": "assistant", "content": "..."},
            ],
        }
    ])

  Each conversation needs: external_id (string), turns (array of {role, content}).
  Optional: started_at (ISO 8601).

REST API
  POST /ingest
    Authorization: Bearer juno_sk_...
    Body: { "conversations": [{ "external_id": "...", "turns": [...] }] }
    Response: { "accepted": 1, "skipped": 0 }

  GET /status
    Response: { "total_conversations": 1482, "monthly_count": 341, "last_received_at": "...", "plan": "free", "monthly_limit": 10000 }

juno.configure(api_key, endpoint, flush_interval, flush_batch_size)
  api_key: your Juno API key (or JUNO_API_KEY env var)
  endpoint: defaults to https://api.juno.so
  flush_interval: seconds between auto-flushes (default 30)
  flush_batch_size: conversations per flush (default 50)

juno.wrap(client)
  Accepts openai.OpenAI, openai.AsyncOpenAI, anthropic.Anthropic, or anthropic.AsyncAnthropic.
  Returns wrapped client. Intercepts chat.completions.create (OpenAI) or messages.create (Anthropic).

juno.backfill(source, batch_size=100)
  source: path to .jsonl/.json file, or list of dicts. Returns count sent.

juno.flush()
  Immediately flushes buffer. Call before exit in short-lived scripts.
  Example: atexit.register(juno.flush)

=== END DOCUMENTATION ===
`.trim()

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
  conversationId: string
}

// ── Juno logging (non-blocking) ───────────────────────────────────────────────

function logToJuno(conversationId: string, messages: ChatMessage[]) {
  const apiKey = process.env.JUNO_API_KEY
  const endpoint = process.env.JUNO_API_URL ?? 'https://api.juno.so'
  if (!apiKey) return

  const turns = messages.map(m => ({ role: m.role, content: m.content }))

  fetch(`${endpoint}/ingest`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversations: [{ external_id: `docs-chat-${conversationId}`, turns }],
    }),
  }).catch(() => {}) // fire and forget — never block the response
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Chat unavailable' }, { status: 503 })
  }

  const { messages, conversationId }: RequestBody = await req.json()
  if (!messages?.length || !conversationId) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      system: DOCS_CONTEXT,
      messages,
      max_tokens: 600,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `Anthropic error: ${err}` }, { status: 502 })
  }

  const data = await response.json()
  const reply: string = data.content?.[0]?.text ?? ''

  // Log the full conversation (including assistant reply) to Juno
  logToJuno(conversationId, [...messages, { role: 'assistant', content: reply }])

  return NextResponse.json({ reply })
}
