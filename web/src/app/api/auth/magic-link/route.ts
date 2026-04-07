import { NextRequest, NextResponse } from 'next/server'

const API = process.env.JUNO_API_URL ?? 'https://api.juno.so'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.juno.so'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const res = await fetch(`${API}/v1/auth/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) return NextResponse.json({ error: 'Failed to generate link' }, { status: 502 })

  const { token } = await res.json()
  const link = `${APP_URL}/auth/verify?token=${token}`

  const resendKey = process.env.RESEND_API_KEY
  const hasRealResendKey = resendKey && resendKey !== 're_...' && !resendKey.startsWith('re_placeholder')

  if (hasRealResendKey) {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Juno <noreply@juno.so>',
        to: email,
        subject: 'Sign in to Juno',
        html: `
          <p>Click the link below to sign in to Juno. It expires in 15 minutes.</p>
          <p><a href="${link}" style="color:#0a0a0a;font-weight:600">Sign in to Juno →</a></p>
          <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
        `,
      }),
    })
    if (!emailRes.ok) {
      console.error('Resend error:', await emailRes.text())
      return NextResponse.json({ error: 'Failed to send email' }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } else {
    // No email provider configured — return the link so the UI can display it
    console.log('\n🔗 Magic link (local dev):', link, '\n')
    return NextResponse.json({ ok: true, dev_link: link })
  }
}
