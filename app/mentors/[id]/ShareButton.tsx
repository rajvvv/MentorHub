'use client'

import { useState } from 'react'
import { useToast } from '../../components/Toast'

export default function ShareButton({ name }: { name: string }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = `Check out ${name} on MentorHub — free 1-on-1 advice.`
    if (
      typeof navigator !== 'undefined' &&
      'share' in navigator &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({ title: name, text, url })
        return
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.show('Link copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.show('Could not copy link', 'error')
    }
  }

  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-1.5 border rounded-xl px-4 py-2 text-sm font-medium hover:bg-[color:var(--surface-2)]"
      aria-label="Share this profile"
    >
      {copied ? '✓ Copied' : '🔗 Share'}
    </button>
  )
}
