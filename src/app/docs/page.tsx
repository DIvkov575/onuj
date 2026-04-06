import type { Metadata } from 'next'
import DocsChatbot from '@/components/DocsChatbot'

export const metadata: Metadata = {
  title: 'Docs — Juno',
  description: 'Integration guide for the Juno SDK.',
}

const SIDEBAR = [
  { id: 'overview',          label: 'Overview' },
  { id: 'installation',      label: 'Installation' },
  { id: 'quickstart',        label: 'Quickstart' },
  { id: 'anthropic',         label: 'Anthropic' },
  { id: 'conversation-ids',  label: 'Conversation IDs' },
  { id: 'async',             label: 'Async' },
  { id: 'streaming',         label: 'Streaming' },
  { id: 'backfill',          label: 'Backfill' },
  { id: 'rest-api',          label: 'REST API' },
  { id: 'reference',         label: 'Reference' },
]

function Code({ children }: { children: string }) {
  return (
    <code style={{
      fontFamily: 'var(--font-geist-mono, monospace)',
      fontSize: '0.8em',
      background: 'rgba(0,0,0,0.06)',
      borderRadius: 4,
      padding: '2px 6px',
    }}>
      {children}
    </code>
  )
}

function Block({ children, comment }: { children: string; comment?: string }) {
  const lines = children.trim().split('\n')
  return (
    <div style={{
      background: '#0a0a0a',
      borderRadius: 10,
      padding: '20px 24px',
      fontFamily: 'var(--font-geist-mono, monospace)',
      fontSize: 13,
      lineHeight: 1.8,
      color: 'rgba(255,255,255,0.75)',
      overflowX: 'auto',
      marginTop: 12,
      marginBottom: comment ? 0 : 24,
    }}>
      {lines.map((line, i) => {
        // Minimal syntax colouring
        const coloured = line
          .replace(/^(#.*)$/, '<span style="color:rgba(255,255,255,0.28)">$1</span>')
          .replace(/\b(import|from|async|await|def|return|for|if|with|as|True|False|None)\b/g,
            '<span style="color:#a78bfa">$1</span>')
          .replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;|"[^"]*"|\'[^\']*\')/g,
            '<span style="color:#86efac">$1</span>')
          .replace(/\b([A-Z][a-zA-Z]+)\(/g,
            '<span style="color:#67e8f9">$1</span>(')
        return (
          <div key={i} dangerouslySetInnerHTML={{ __html: coloured || '&nbsp;' }} />
        )
      })}
    </div>
  )
}

function BlockNote({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', marginTop: 8, marginBottom: 24 }}>
      {children}
    </p>
  )
}

function H2({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} style={{
      fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em',
      color: '#0a0a0a', marginTop: 56, marginBottom: 16,
      scrollMarginTop: 80,
    }}>
      {children}
    </h2>
  )
}

function H3({ children }: { children: string }) {
  return (
    <h3 style={{
      fontSize: 14, fontWeight: 600, color: '#0a0a0a',
      marginTop: 28, marginBottom: 8,
    }}>
      {children}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, lineHeight: 1.75, color: '#3a3a3a', marginBottom: 12 }}>
      {children}
    </p>
  )
}

function PropRow({ name, type, children }: { name: string; type: string; children: React.ReactNode }) {
  return (
    <tr>
      <td style={{ padding: '10px 16px 10px 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
        <code style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 12 }}>{name}</code>
      </td>
      <td style={{ padding: '10px 16px 10px 0', verticalAlign: 'top', color: 'rgba(0,0,0,0.38)', fontSize: 12, whiteSpace: 'nowrap' }}>
        {type}
      </td>
      <td style={{ padding: '10px 0', verticalAlign: 'top', fontSize: 13, lineHeight: 1.6, color: '#3a3a3a' }}>
        {children}
      </td>
    </tr>
  )
}

export default function DocsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0efed', color: '#0a0a0a' }}>

      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(240,239,237,0.9)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 32px',
          height: 56, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
            <rect x="13" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
            <rect x="2" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
            <rect x="13" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Juno</span>
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.25)', margin: '0 4px' }}>/</span>
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>Docs</span>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', gap: 64 }}>

        {/* Sidebar */}
        <nav style={{
          width: 180, flexShrink: 0, paddingTop: 40,
          position: 'sticky', top: 56, height: 'calc(100vh - 56px)',
          overflowY: 'auto',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)', marginBottom: 16 }}>
            On this page
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SIDEBAR.map(({ id, label }) => (
              <li key={id}>
                <a href={`#${id}`} className="docs-nav-link">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0, paddingTop: 40, paddingBottom: 100 }}>

          {/* Page title */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)', marginBottom: 16 }}>
            Integration guide
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8 }}>
            SDK Documentation
          </h1>
          <p style={{ fontSize: 15, color: '#5a5a5a', lineHeight: 1.7, marginBottom: 48, maxWidth: 560 }}>
            Add Juno to any Python project in two lines. Conversations are captured automatically, embedded, and surfaced in the dashboard.
          </p>

          <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', marginBottom: 48 }} />

          {/* ── Overview ── */}
          <H2 id="overview">Overview</H2>
          <P>
            Juno instruments your existing OpenAI or Anthropic client to capture every conversation turn. It batches them in a background thread and flushes to the API every 30 seconds — no latency added to your responses.
          </P>
          <P>
            Once conversations arrive, Juno embeds the first user message, scores whether the AI failed to answer, and clusters conversations by intent. Results appear in the dashboard within seconds.
          </P>

          {/* ── Installation ── */}
          <H2 id="installation">Installation</H2>
          <Block>{`pip install juno-analytics`}</Block>
          <P>
            Requires Python 3.9+. The SDK has no mandatory dependencies beyond <Code>httpx</Code> — it imports your existing AI library at runtime, not at install time.
          </P>

          {/* ── Quickstart ── */}
          <H2 id="quickstart">Quickstart</H2>
          <P>
            Get your API key from the dashboard, then wrap your client once at startup:
          </P>
          <Block>{`import juno
import openai

juno.configure(api_key="juno_sk_...")
client = juno.wrap(openai.OpenAI())

# Your existing code — unchanged
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "How do I reset my password?"}],
)`}</Block>
          <BlockNote>
            The JUNO_API_KEY environment variable is read automatically — juno.configure() is optional if the env var is set.
          </BlockNote>
          <P>
            Every <Code>chat.completions.create</Code> call is now captured. The wrapped client is a transparent pass-through — all other methods, attributes, and options work identically to the original.
          </P>

          {/* ── Anthropic ── */}
          <H2 id="anthropic">Anthropic</H2>
          <P>
            Pass an <Code>anthropic.Anthropic()</Code> client to <Code>juno.wrap()</Code>. The wrapper intercepts <Code>messages.create</Code> and captures the system prompt, user turns, and assistant reply automatically.
          </P>
          <Block>{`import juno
import anthropic

juno.configure(api_key="juno_sk_...")
client = juno.wrap(anthropic.Anthropic())

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system="You are a helpful assistant.",
    messages=[{"role": "user", "content": "How do I reset my password?"}],
    juno_conversation_id="session_abc123",
)`}</Block>
          <P>
            The <Code>system</Code> parameter is captured as a system turn. All other parameters are passed through unchanged — the wrapped client behaves identically to the original.
          </P>
          <P>
            Async and streaming work the same way as with OpenAI — pass <Code>anthropic.AsyncAnthropic()</Code> for async, and <Code>stream=True</Code> for streaming.
          </P>

          {/* ── Conversation IDs ── */}
          <H2 id="conversation-ids">Conversation IDs</H2>
          <P>
            By default, each thread gets its own auto-generated conversation ID. For multi-turn conversations, pass <Code>juno_conversation_id</Code> to group turns together:
          </P>
          <Block>{`session_id = "user_789_session_abc"  # your session/thread ID

# Turn 1
client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What's your refund policy?"}],
    juno_conversation_id=session_id,
)

# Turn 2 — same session
client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user",      "content": "What's your refund policy?"},
        {"role": "assistant", "content": "..."},
        {"role": "user",      "content": "What if I paid by card?"},
    ],
    juno_conversation_id=session_id,
)`}</Block>
          <BlockNote>
            Use any stable string as the ID — a database row ID, a session token, a UUID. Juno deduplicates on this ID so replaying the full message history each turn is safe.
          </BlockNote>

          {/* ── Async ── */}
          <H2 id="async">Async</H2>
          <P>
            Pass <Code>openai.AsyncOpenAI()</Code> instead. The wrapper handles async transparently:
          </P>
          <Block>{`import juno
import openai

juno.configure(api_key="juno_sk_...")
client = juno.wrap(openai.AsyncOpenAI())

async def handle_message(session_id: str, text: str):
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": text}],
        juno_conversation_id=session_id,
    )
    return response.choices[0].message.content`}</Block>

          {/* ── Streaming ── */}
          <H2 id="streaming">Streaming</H2>
          <P>
            Streaming works without any changes. Juno accumulates chunks in the background and logs the full assistant message once the stream ends — your generator is unaffected:
          </P>
          <Block>{`stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Explain embeddings briefly."}],
    stream=True,
    juno_conversation_id=session_id,
)

for chunk in stream:
    delta = chunk.choices[0].delta.content or ""
    print(delta, end="", flush=True)

# Full assistant turn is logged automatically after the loop`}</Block>

          {/* ── Backfill ── */}
          <H2 id="backfill">Backfill</H2>
          <P>
            Upload historical conversations so you start with signal rather than an empty dashboard. Accepts a <Code>.jsonl</Code> file, a <Code>.json</Code> file, or a list of dicts:
          </P>
          <H3>From a file</H3>
          <Block>{`import juno

juno.configure(api_key="juno_sk_...")
count = juno.backfill("conversations.jsonl")
print(f"Uploaded {count} conversations")`}</Block>

          <H3>From memory</H3>
          <Block>{`conversations = [
    {
        "external_id": "session_001",
        "turns": [
            {"role": "user",      "content": "How do I cancel my subscription?"},
            {"role": "assistant", "content": "You can cancel from Settings > Billing."},
        ],
    },
    # ...
]

juno.backfill(conversations)`}</Block>

          <H3>Expected format</H3>
          <P>
            Each conversation object must have:
          </P>
          <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8, marginBottom: 24 }}>
            <tbody>
              <PropRow name="external_id" type="string">Unique ID for this conversation in your system.</PropRow>
              <PropRow name="turns" type="array">List of turn objects with <Code>role</Code> (<Code>user</Code> | <Code>assistant</Code> | <Code>system</Code>) and <Code>content</Code>.</PropRow>
              <PropRow name="started_at" type="ISO 8601 (optional)">Conversation start time. Defaults to ingest time.</PropRow>
            </tbody>
          </table>

          {/* ── REST API ── */}
          <H2 id="rest-api">REST API</H2>
          <P>
            The SDK is a thin wrapper around a simple HTTP API. You can send conversations directly if you are not using Python:
          </P>
          <H3>POST /ingest</H3>
          <Block>{`curl https://api.juno.so/ingest \\
  -H "Authorization: Bearer juno_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "conversations": [
      {
        "external_id": "session_001",
        "turns": [
          {"role": "user",      "content": "How do I export my data?"},
          {"role": "assistant", "content": "Go to Settings > Export."}
        ]
      }
    ]
  }'`}</Block>
          <Block>{`# Response
{
  "accepted": 1,
  "skipped": 0
}`}</Block>
          <BlockNote>
            Sending the same external_id again updates the conversation in place — safe to re-send complete turn histories.
          </BlockNote>

          <H3>GET /status</H3>
          <Block>{`curl https://api.juno.so/status \\
  -H "Authorization: Bearer juno_sk_..."

# Response
{
  "total_conversations": 1482,
  "monthly_count": 341,
  "last_received_at": "2026-04-05T14:22:01Z",
  "plan": "free",
  "monthly_limit": 10000
}`}</Block>

          {/* ── Reference ── */}
          <H2 id="reference">Reference</H2>

          <H3>juno.configure()</H3>
          <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8, marginBottom: 24 }}>
            <tbody>
              <PropRow name="api_key" type="str">Your Juno API key. Defaults to <Code>JUNO_API_KEY</Code> env var.</PropRow>
              <PropRow name="endpoint" type="str">API base URL. Defaults to <Code>https://api.juno.so</Code>.</PropRow>
              <PropRow name="flush_interval" type="float">Seconds between automatic flushes. Default: <Code>30.0</Code>.</PropRow>
              <PropRow name="flush_batch_size" type="int">Conversations per flush. Default: <Code>50</Code>.</PropRow>
            </tbody>
          </table>

          <H3>juno.wrap(client)</H3>
          <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8, marginBottom: 24 }}>
            <tbody>
              <PropRow name="client" type="OpenAI | AsyncOpenAI | Anthropic | AsyncAnthropic">An instantiated OpenAI or Anthropic client. Sync vs async is detected automatically.</PropRow>
            </tbody>
          </table>
          <P>Returns a wrapped client identical to the original except <Code>chat.completions.create</Code> (OpenAI) and <Code>messages.create</Code> (Anthropic), both of which accept the additional <Code>juno_conversation_id</Code> parameter.</P>

          <H3>juno.backfill(source)</H3>
          <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8, marginBottom: 24 }}>
            <tbody>
              <PropRow name="source" type="str | Path | list">Path to a <Code>.jsonl</Code> / <Code>.json</Code> file, or a list of conversation dicts.</PropRow>
              <PropRow name="batch_size" type="int">Conversations per HTTP request. Default: <Code>100</Code>.</PropRow>
            </tbody>
          </table>
          <P>Returns the number of conversations sent.</P>

          <H3>juno.flush()</H3>
          <P>Immediately flushes buffered conversations to the API. Call this before process exit in short-lived scripts to avoid losing buffered turns.</P>
          <Block>{`import juno
import atexit

atexit.register(juno.flush)  # safe for long-running servers too`}</Block>

        </main>
      </div>

      {/* Remove this line to disable before deployment */}
      <DocsChatbot />
    </div>
  )
}
