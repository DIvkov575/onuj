'use client'

const logos = ['Acme Corp', 'Vercel', 'Linear', 'Stripe', 'Notion', 'Figma', 'Loom', 'Raycast', 'Arc', 'Supabase']

export default function Marquee() {
  const doubled = [...logos, ...logos]

  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <div className="marquee-track" style={{ alignItems: 'center' }}>
        {doubled.map((logo, i) => (
          <div key={i} style={{
            padding: '18px 48px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.22)',
            whiteSpace: 'nowrap',
            borderRight: '1px solid rgba(0,0,0,0.07)',
          }}>
            {logo}
          </div>
        ))}
      </div>
    </div>
  )
}
