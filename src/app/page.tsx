import WaitlistForm from '@/components/WaitlistForm'
import Marquee from '@/components/Marquee'
import FadeUp from '@/components/FadeUp'
import CountUp from '@/components/CountUp'
import Grain from '@/components/Grain'

const stats = [
  { value: '3.2×', label: 'faster roadmap decisions' },
  { value: '68%', label: 'reduction in support escalations' },
  { value: '10K+', label: 'conversations clustered daily' },
  { value: '1hr', label: 'time to first insight' },
]

const features = [
  {
    label: 'Gap Detection',
    description: 'Ranked list of questions your AI fails to answer — with trend data. A sprint ticket, not a chart.',
  },
  {
    label: 'Intent Clustering',
    description: 'Conversations automatically grouped by what users are trying to do. No categories to define upfront.',
  },
  {
    label: 'One-line SDK',
    description: 'Wrap your existing OpenAI or Anthropic client. Zero other changes to your codebase.',
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
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>chatAnalytics</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', cursor: 'default' }}>Product</span>
            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', cursor: 'default' }}>Docs</span>
            <a href="#waitlist" className="nav-cta" style={{
              fontSize: 13, fontWeight: 500,
              padding: '8px 20px', borderRadius: 999,
              background: '#0a0a0a', color: '#f0efed',
              textDecoration: 'none',
            }}>
              Join waitlist
            </a>
          </div>
        </div>
      </header>

      {/* Hero card */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px 0' }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 520 }}>

          {/* Animated gradient */}
          <div className="hero-grad" style={{
            position: 'absolute',
            inset: '-12%',
            background: 'radial-gradient(130% 130% at 68% 58%, rgb(145, 152, 162) 0%, rgb(148, 46, 10) 50%, rgb(55, 42, 38) 100%)',
          }} />

          {/* Navy overlay — left bloom */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(75% 100% at 18% 50%, rgba(0,1,110,0.6) 0%, transparent 60%)',
          }} />

          {/* Light scattering */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(35% 45% at 32% 42%, rgba(215,222,235,0.22) 0%, transparent 55%)',
          }} />

          {/* Grain texture */}
          <div className="hero-grain" />

          {/* SVG grid — right side, draws in on load */}
          <svg
            style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '48%', opacity: 0.15 }}
            viewBox="0 0 440 520"
            preserveAspectRatio="xMidYMid slice"
          >
            {[55, 110, 170, 235, 305, 380].map((r, i) => (
              <circle key={r} className="draw-circle" cx="340" cy="260" r={r} stroke="white" strokeWidth="0.7" fill="none" />
            ))}
            {Array.from({ length: 18 }, (_, i) => {
              const a = (i * 360 / 18) * Math.PI / 180
              return <line key={i} x1="340" y1="260" x2={340 + Math.cos(a) * 420} y2={260 + Math.sin(a) * 420} stroke="white" strokeWidth="0.4" opacity="0.6"/>
            })}
            {Array.from({ length: 14 }, (_, row) =>
              Array.from({ length: 10 }, (_, col) => (
                <circle key={`${row}-${col}`} cx={180 + col * 26} cy={60 + row * 36} r="1.1" fill="white" opacity="0.5"/>
              ))
            )}
          </svg>

          {/* Bottom fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%',
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 10, padding: '52px 56px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40 }}>
              <h1 className="hero-h1" style={{
                fontSize: 'clamp(2.2rem, 3.8vw, 3.5rem)',
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '-0.04em',
                color: '#fff',
                maxWidth: 400,
              }}>
                Know what your users are asking.
              </h1>
              <p className="hero-sub" style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.6)',
                maxWidth: 280,
                paddingTop: 6,
              }}>
                A breakthrough in turning conversation logs into proof of what to build next.
              </p>
            </div>

            <div className="hero-cta" id="waitlist">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </section>

      {/* Marquee logos */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px' }}>
        <Marquee />
      </section>

      {/* Pull quote */}
      <FadeUp style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px 72px' }}>
        <p style={{
          fontSize: 'clamp(1.55rem, 2.8vw, 2.5rem)',
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: '-0.03em',
          maxWidth: 680,
          color: '#0a0a0a',
        }}>
          Built for teams who refuse to make product decisions based on gut feel.
        </p>
      </FadeUp>

      {/* Features */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(0,0,0,0.08)' }}>
          {features.map(({ label, description }, i) => (
            <FadeUp key={label} delay={i * 100}>
              <div className="feature-card" style={{ background: '#f0efed', padding: '40px 36px', height: '100%' }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'rgba(0,0,0,0.32)', marginBottom: 20,
                }}>
                  {label}
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: '#3a3a3a' }}>
                  {description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 100px' }}>
        <FadeUp>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'rgba(0,0,0,0.32)', marginBottom: 32,
          }}>
            From indie hackers to enterprise
          </p>
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(0,0,0,0.08)' }}>
          {stats.map(({ value, label }, i) => (
            <FadeUp key={label} delay={i * 80}>
              <div className="stat-card" style={{ background: '#f0efed', padding: '32px 28px' }}>
                <p style={{
                  fontSize: 'clamp(1.8rem, 2.8vw, 2.6rem)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#0a0a0a',
                  marginBottom: 8,
                }}>
                  <CountUp value={value} />
                </p>
                <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.42)', lineHeight: 1.4 }}>{label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <FadeUp style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 100px' }}>
        <div style={{
          borderRadius: 16, overflow: 'hidden', position: 'relative',
          padding: '64px 56px',
          background: '#0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40,
          flexWrap: 'wrap',
        }}>
          {/* Subtle rust glow */}
          <div style={{
            position: 'absolute', top: '-40%', right: '-10%',
            width: 500, height: 500,
            background: 'radial-gradient(ellipse, rgba(148,46,10,0.35) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 600, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
              Ready to stop guessing?
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Join the waitlist. Early access invites going out now.
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <WaitlistForm dark />
          </div>
        </div>
      </FadeUp>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(0,0,0,0.08)',
        padding: '24px 32px',
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em' }}>chatAnalytics</span>
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)' }}>© 2026</span>
      </footer>
    </div>
  )
}
