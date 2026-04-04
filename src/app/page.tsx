'use client'

import WaitlistForm from '@/components/WaitlistForm'
import FadeUp from '@/components/FadeUp'
import Grain from '@/components/Grain'
import HeroCanvas from '@/components/HeroCanvas'

const pains = [
  {
    label: 'Intent blindness',
    description: 'A chat interface replaces dozens of discrete UI surfaces. All of that signal collapses into one input. You know users opened it — not what they were trying to accomplish.',
  },
  {
    label: 'Hidden demand',
    description: 'Users ask for things your product can\'t yet answer. That demand accumulates in logs, unread. It\'s the most honest product roadmap you have.',
  },
  {
    label: 'Silent failure',
    description: 'A conversational app returns 200 OK whether the answer was useful or not. Misunderstood intent and wrong answers leave no trace in your existing monitoring.',
  },
]

const features = [
  {
    label: 'Gap Detection',
    description: 'Surfaces and ranks what your AI consistently fails to answer — grouped by topic, sorted by frequency. Concrete enough to drop into a sprint without interpretation.',
  },
  {
    label: 'Intent Clustering',
    description: 'Conversations are automatically grouped by underlying user goal, not surface phrasing. No categories to define upfront. Clusters emerge from your actual traffic.',
  },
  {
    label: 'One-line SDK',
    description: 'Wrap your existing OpenAI or Anthropic client. Nothing else changes. Backfill historical logs on first login so you start with signal, not an empty state.',
  },
]

const segments = [
  {
    label: 'AI-native startups',
    description: 'Your product is a chat interface. You have traces and cost data from LangSmith and Helicone. What you\'re missing is intent — what users are actually trying to do.',
  },
  {
    label: 'SaaS teams shipping AI features',
    description: 'Your AI assistant is live. Your existing analytics tells you how many users opened it. It can\'t tell you what they asked, or whether they got what they needed.',
  },
  {
    label: 'Developer tool companies',
    description: 'Developers ask your docs AI questions every day. The gap between what they ask and what it can answer is a direct signal about documentation coverage and developer friction.',
  },
]

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0efed', color: '#0a0a0a' }}>
      <Grain opacity={0.18} zIndex={9999} />

      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(240,239,237,0.85)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
              <rect x="13" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
              <rect x="2" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
              <rect x="13" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Juno</span>
          </div>
          <a href="#waitlist" className="nav-cta" style={{
            fontSize: 13, fontWeight: 500,
            padding: '8px 20px', borderRadius: 999,
            background: '#0a0a0a', color: '#f0efed', textDecoration: 'none',
          }}>
            Join waitlist
          </a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px 0' }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 520 }}>

          {/* Interactive canvas */}
          <HeroCanvas />

          {/* Bottom fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))', pointerEvents: 'none' }} />

          {/* Text content */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, padding: '52px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40 }}>
              <h1 className="hero-h1" style={{
                fontSize: 'clamp(2.2rem, 3.8vw, 3.5rem)',
                fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.04em',
                color: '#fff', maxWidth: 420,
              }}>
                Understand what your users are asking.
              </h1>
              <p className="hero-sub" style={{
                fontSize: 15, lineHeight: 1.7,
                color: 'rgba(255,255,255,0.6)', maxWidth: 260, paddingTop: 6,
              }}>
                Intent clustering and gap detection for teams building on conversational AI.
              </p>
            </div>
            <div className="hero-cta" id="waitlist" style={{ pointerEvents: 'all' }}>
              <WaitlistForm />
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <FadeUp style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px 48px' }}>
        <p style={{
          fontSize: 'clamp(1.4rem, 2.6vw, 2.2rem)', fontWeight: 500,
          lineHeight: 1.3, letterSpacing: '-0.03em', maxWidth: 600, color: '#0a0a0a',
        }}>
          Existing analytics tools are built around discrete interactions — clicks, page views, form submissions. Conversational interfaces don't produce those. They produce text, and most teams have no way to read it at scale.
        </p>
      </FadeUp>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(0,0,0,0.08)' }}>
          {pains.map(({ label, description }, i) => (
            <FadeUp key={label} delay={i * 80}>
              <div className="feature-card" style={{ background: '#f0efed', padding: '36px 36px', height: '100%' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.32)', marginBottom: 16 }}>
                  {label}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#3a3a3a' }}>{description}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 80px' }}>
        <FadeUp>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.32)', marginBottom: 24 }}>
            Features
          </p>
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(0,0,0,0.08)' }}>
          {features.map(({ label, description }, i) => (
            <FadeUp key={label} delay={i * 80}>
              <div className="feature-card" style={{ background: '#f0efed', padding: '40px 36px', height: '100%' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.32)', marginBottom: 20 }}>
                  {label}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#3a3a3a' }}>{description}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* Code snippet */}
      <FadeUp style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 80px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.32)', marginBottom: 24 }}>
          Integration
        </p>
        <div style={{
          background: '#0a0a0a', borderRadius: 12, padding: '28px 32px',
          fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 13, lineHeight: 1.8,
          color: 'rgba(255,255,255,0.75)', overflowX: 'auto',
        }}>
          <div><span style={{ color: 'rgba(255,255,255,0.3)' }}>{'# Before'}</span></div>
          <div><span style={{ color: '#a78bfa' }}>import</span> openai</div>
          <div>client = openai.<span style={{ color: '#67e8f9' }}>OpenAI</span>()</div>
          <div style={{ marginTop: 16 }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>{'# After — zero other changes'}</span></div>
          <div><span style={{ color: '#a78bfa' }}>import</span> juno</div>
          <div>client = juno.<span style={{ color: '#67e8f9' }}>wrap</span>(openai.<span style={{ color: '#67e8f9' }}>OpenAI</span>())</div>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', marginTop: 14 }}>
          OpenAI and Anthropic. Pass historical logs on first login.
        </p>
      </FadeUp>

      {/* Who it's for */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 80px' }}>
        <FadeUp>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.32)', marginBottom: 24 }}>
            Who it&rsquo;s for
          </p>
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(0,0,0,0.08)' }}>
          {segments.map(({ label, description }, i) => (
            <FadeUp key={label} delay={i * 80}>
              <div className="feature-card" style={{ background: '#f0efed', padding: '36px 36px', height: '100%' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a', marginBottom: 14 }}>{label}</p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#5a5a5a' }}>{description}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <FadeUp style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 100px' }}>
        <div style={{
          borderRadius: 16, overflow: 'hidden', position: 'relative',
          padding: '64px 56px', background: '#0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap',
        }}>
          <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(148,46,10,0.35) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 600, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
              Early access is open.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: 340 }}>
              Self-serve, no sales call. 10,000 conversations per month on the free tier — gap detection included.
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <WaitlistForm dark />
          </div>
        </div>
      </FadeUp>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(0,0,0,0.08)', padding: '24px 32px',
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em' }}>Juno</span>
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)' }}>© 2026</span>
      </footer>
    </div>
  )
}
