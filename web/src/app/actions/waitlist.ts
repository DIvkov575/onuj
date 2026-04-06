'use server'

import { appendFileSync, readFileSync } from 'fs'
import { join } from 'path'

const FILE = join(process.cwd(), 'waitlist.txt')

function readEmails(): string[] {
  try { return readFileSync(FILE, 'utf8').split('\n').filter(Boolean) } catch { return [] }
}

const waitlist: string[] = readEmails()

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
  appendFileSync(FILE, normalized + '\n')

  console.log(`[juno:waitlist] ${normalized} — total: ${waitlist.length}`)

  return { success: true }
}
