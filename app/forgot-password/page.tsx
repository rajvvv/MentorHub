'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Container } from '../components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setErr('')
    setLoading(true)
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    setLoading(false)
    if (error) setErr(error.message)
    else setMsg('Check your email for a reset link.')
  }

  return (
    <Container size="sm" className="py-16">
      <div className="rounded-2xl border bg-[color:var(--surface)] p-8 shadow-[var(--shadow-sm)]">
        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          We&apos;ll email you a link to set a new one.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5"
          />
          {err && (
            <p className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
              {err}
            </p>
          )}
          {msg && (
            <p className="text-sm bg-green-50 border border-green-200 text-green-700 rounded-xl p-3">
              {msg}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[color:var(--brand)] text-white rounded-xl px-4 py-2.5 font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {loading ? '…' : 'Send reset link'}
          </button>
        </form>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-[color:var(--muted)] hover:underline"
        >
          ← Back to login
        </Link>
      </div>
    </Container>
  )
}
