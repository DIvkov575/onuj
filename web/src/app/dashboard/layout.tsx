'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const NAV = [
  { href: '/dashboard',               label: 'Overview',       icon: '▤' },
  { href: '/dashboard/clusters',      label: 'Intent clusters', icon: '◈' },
  { href: '/dashboard/gaps',          label: 'Gaps',            icon: '◻' },
  { href: '/dashboard/conversations', label: 'Conversations',   icon: '≡' },
  { href: '/dashboard/settings',      label: 'Settings',        icon: '⚙' },
]

function getToken() {
  if (typeof document === 'undefined') return ''
  return document.cookie.match(/juno_session=([^;]+)/)?.[1] ?? ''
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!getToken()) router.replace('/login')
  }, [router])

  function logout() {
    document.cookie = 'juno_session=; path=/; max-age=0'
    router.replace('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0efed', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', marginBottom: 32 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
            <rect x="13" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
            <rect x="2" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
            <rect x="13" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Juno</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
          {NAV.map(({ href, label, icon }) => {
            const active = href === '/dashboard' ? path === href : path.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 7, textDecoration: 'none',
                fontSize: 13, fontWeight: active ? 500 : 400,
                color: active ? '#0a0a0a' : 'rgba(0,0,0,0.45)',
                background: active ? 'rgba(0,0,0,0.06)' : 'transparent',
                transition: 'background 0.15s, color 0.15s',
              }}>
                <span style={{ fontSize: 14, opacity: 0.7 }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            margin: '0 12px', padding: '8px 10px', borderRadius: 7,
            fontSize: 13, color: 'rgba(0,0,0,0.35)',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontFamily: 'inherit',
          }}
        >
          Sign out
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, padding: '40px 48px' }}>
        {children}
      </main>
    </div>
  )
}
