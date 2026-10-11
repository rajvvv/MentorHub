'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        if (data.user) {
          await supabase
            .from('profiles')
            .update({ full_name: fullName, role })
            .eq('id', data.user.id)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
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
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg">
      <h1 className="text-2xl font-bold mb-4">
        {mode === 'login' ? 'Log in' : 'Sign up'}
      </h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {mode === 'signup' && (
          <>
            <input
              className="w-full border p-2 rounded"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <select
              className="w-full border p-2 rounded"
              value={role}
              onChange={(e) => setRole(e.target.value as 'seeker' | 'mentor')}
            >
              <option value="seeker">I'm looking for a mentor</option>
              <option value="mentor">I want to mentor others</option>
            </select>
          </>
        )}
        <input
          type="email"
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border p-2 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? '...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        className="mt-4 text-sm underline"
      >
        {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
      </button>
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
