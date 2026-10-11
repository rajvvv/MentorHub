'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const defaultRole = params.get('role') === 'mentor' ? 'mentor' : 'seeker'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'seeker' | 'mentor'>(defaultRole)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role } },
        })
        if (error) throw error
        if (!data.session) {
          setInfo('Check your email to confirm your account, then log in.')
          setMode('login')
          return
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="hidden lg:flex brand-gradient border-r p-10 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl grid place-items-center text-white font-bold bg-gradient-to-br from-indigo-600 to-indigo-400 shadow-sm">
            M
          </div>
          <span className="font-bold text-lg tracking-tight">MentorHub</span>
        </Link>
        <div className="max-w-md">
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            {mode === 'signup'
              ? 'Join a free community of advisors and seekers.'
              : 'Welcome back. Someone just needed your advice.'}
          </h2>
          <p className="mt-3 text-[color:var(--muted)]">
            Chat, book, and hop on free video calls. Rate what helps. Pay nothing.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              '🎥 Free unlimited video via Jitsi',
              '💬 Real-time chat between sessions',
              '📅 Smart booking with your available slots',
              '⭐ Reviews that build real reputation',
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span>{t.slice(0, 2)}</span>
                <span className="text-[color:var(--muted)]">{t.slice(3)}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-[color:var(--muted)]">
          By continuing you agree to be respectful. That&apos;s the only rule.
        </p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 justify-center"
            >
              <div className="w-9 h-9 rounded-xl grid place-items-center text-white font-bold bg-gradient-to-br from-indigo-600 to-indigo-400 shadow-sm">
                M
              </div>
              <span className="font-bold text-lg tracking-tight">
                MentorHub
              </span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'login' ? 'Log in' : 'Create your account'}
          </h1>
          <p className="text-[color:var(--muted)] mt-1">
            {mode === 'login'
              ? 'Welcome back.'
              : 'Takes less than a minute.'}
          </p>

          {/* Role tabs for signup */}
          {mode === 'signup' && (
            <div className="mt-6 inline-flex rounded-xl border p-1 bg-[color:var(--surface-2)]">
              <button
                type="button"
                onClick={() => setRole('seeker')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  role === 'seeker'
                    ? 'bg-[color:var(--surface)] shadow-sm'
                    : 'text-[color:var(--muted)]'
                }`}
              >
                I need advice
              </button>
              <button
                type="button"
                onClick={() => setRole('mentor')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  role === 'mentor'
                    ? 'bg-[color:var(--surface)] shadow-sm'
                    : 'text-[color:var(--muted)]'
                }`}
              >
                I give advice
              </button>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold tracking-wide text-[color:var(--muted)] uppercase">
                  Full name
                </label>
                <input
                  className="w-full border rounded-xl px-3 py-2.5 mt-1"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold tracking-wide text-[color:var(--muted)] uppercase">
                Email
              </label>
              <input
                type="email"
                className="w-full border rounded-xl px-3 py-2.5 mt-1"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide text-[color:var(--muted)] uppercase">
                Password
              </label>
              <input
                type="password"
                className="w-full border rounded-xl px-3 py-2.5 mt-1"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm bg-green-50 border border-green-200 text-green-700 rounded-xl p-3">
                {info}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[color:var(--brand)] text-white rounded-xl px-4 py-3 font-semibold hover:brightness-110 disabled:opacity-50"
            >
              {loading ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 flex justify-between text-sm">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="font-medium hover:underline"
            >
              {mode === 'login'
                ? 'New here? Sign up'
                : 'Already have an account? Log in'}
            </button>
            {mode === 'login' && (
              <Link
                href="/forgot-password"
                className="text-[color:var(--muted)] hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}
