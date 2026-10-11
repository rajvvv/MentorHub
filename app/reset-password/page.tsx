'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Container } from '../components/ui'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setErr(error.message)
      return
    }
    router.push('/dashboard')
  }

  return (
    <Container size="sm" className="py-16">
      <div className="rounded-2xl border bg-[color:var(--surface)] p-8 shadow-[var(--shadow-sm)]">
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          If you got here from the email link, you&apos;re already signed in — just pick a new one.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password"
            required
            minLength={6}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5"
          />
          {err && (
            <p className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[color:var(--brand)] text-white rounded-xl px-4 py-2.5 font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {loading ? '…' : 'Update password'}
          </button>
        </form>
      </div>
    </Container>
  )
}
