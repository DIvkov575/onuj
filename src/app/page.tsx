import WaitlistForm from '@/components/WaitlistForm'

const features = [
  {
    label: 'Gap Detection',
    description:
      'See exactly which questions your AI can\'t answer, ranked by frequency. A to-do list, not a dashboard.',
  },
  {
    label: 'Intent Clustering',
    description:
      'Automatically groups conversations by what users are trying to do — no predefined categories, no manual tagging.',
  },
  {
    label: 'One-line setup',
    description:
      'Wrap your existing OpenAI or Anthropic client. Nothing else changes. Insights within hours, not weeks.',
  },
]

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#080808', color: '#f0f0f0' }}
    >
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <span className="text-sm font-semibold tracking-tight" style={{ color: '#f0f0f0' }}>
          chatAnalytics
        </span>
        <a
          href="#waitlist"
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ color: '#a89ff7', border: '1px solid rgba(124,106,247,0.3)' }}
        >
          Join waitlist
        </a>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-3xl mx-auto w-full">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{
            background: 'rgba(124,106,247,0.12)',
            border: '1px solid rgba(124,106,247,0.25)',
            color: '#a89ff7',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#7c6af7' }}
          />
          Early access
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl font-semibold tracking-tight leading-tight mb-6"
          style={{ letterSpacing: '-0.03em' }}
        >
          Know what your users
          <br />
          <span style={{ color: '#7c6af7' }}>are actually asking.</span>
        </h1>

        {/* Subhead */}
        <p
          className="text-lg leading-relaxed mb-12 max-w-xl"
          style={{ color: '#888' }}
        >
          chatAnalytics finds the questions your AI can&rsquo;t answer
          and clusters what your users actually want —
          so you build the right thing next.
        </p>

        {/* Waitlist form */}
        <div id="waitlist" className="flex flex-col items-center gap-4 w-full">
          <WaitlistForm />
          <p className="text-xs" style={{ color: '#555' }}>
            No spam. Early access invites only.
          </p>
        </div>

        {/* Mock terminal — gap detection output */}
        <div
          className="mt-20 w-full max-w-2xl rounded-2xl overflow-hidden text-left"
          style={{
            background: '#0f0f0f',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Title bar */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: '#3a3a3a' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#3a3a3a' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#3a3a3a' }} />
            <span className="ml-2 text-xs" style={{ color: '#444' }}>
              Gap report — last 7 days
            </span>
          </div>

          {/* Content */}
          <div className="px-5 py-5 space-y-3 font-mono text-sm">
            {[
              { count: '412', label: 'How do I export data to CSV?', delta: '+3×' },
              { count: '287', label: 'Does it support team accounts?', delta: 'new' },
              { count: '198', label: 'What are the rate limits?', delta: '+40%' },
              { count: '143', label: 'Can I use my own model?', delta: '+22%' },
              { count: '91',  label: 'How do I cancel my subscription?', delta: '—' },
            ].map(({ count, label, delta }, i) => (
              <div key={i} className="flex items-center gap-4">
                <span
                  className="w-10 text-right text-xs tabular-nums shrink-0"
                  style={{ color: '#555' }}
                >
                  {count}
                </span>
                <span style={{ color: '#ccc', flex: 1 }}>{label}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-md shrink-0"
                  style={{
                    background: delta === 'new'
                      ? 'rgba(124,106,247,0.15)'
                      : 'rgba(255,255,255,0.04)',
                    color: delta === 'new' ? '#a89ff7' : '#555',
                  }}
                >
                  {delta}
                </span>
              </div>
            ))}
            <div
              className="pt-3 mt-3 text-xs"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                color: '#444',
              }}
            >
              5 gap clusters · 1,131 unanswered conversations this week
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid sm:grid-cols-3 gap-px"
          style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
          {features.map(({ label, description }) => (
            <div
              key={label}
              className="px-6 py-7"
              style={{ background: '#080808' }}
            >
              <p className="text-sm font-medium mb-2" style={{ color: '#f0f0f0' }}>
                {label}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#666' }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-6 text-center text-xs"
        style={{ color: '#333', borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        chatAnalytics · 2026
      </footer>
    </div>
  )
}
