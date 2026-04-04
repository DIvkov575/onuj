'use server'

// Stores emails in-memory for now; swap for a DB write (Supabase, Postgres, etc.)
// or a Resend audience when ready.
const waitlist: string[] = []

export type WaitlistResult =
  | { success: true }
  | { success: false; error: string }

export async function joinWaitlist(
  formData: FormData
): Promise<WaitlistResult> {
  const email = formData.get('email')

  if (typeof email !== 'string' || !email.trim()) {
    return { success: false, error: 'Please enter your email address.' }
  }

  const normalized = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  if (waitlist.includes(normalized)) {
    return { success: true } // silently dedupe
  }

  waitlist.push(normalized)

  // TODO: replace with persistent storage + Resend confirmation email
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({ ... })

  console.log(`[juno:waitlist] ${normalized} — total: ${waitlist.length}`)

  return { success: true }
}
