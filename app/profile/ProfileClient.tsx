'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AvailabilityManager from './AvailabilityManager'
import { useToast } from '../components/Toast'

export default function ProfileClient() {
  const router = useRouter()
  const toast = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [topics, setTopics] = useState('')
  const [role, setRole] = useState<'seeker' | 'mentor'>('seeker')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setFullName(data.full_name ?? '')
        setBio(data.bio ?? '')
        setTopics((data.topics ?? []).join(', '))
        setRole(data.role ?? 'seeker')
      }
      setLoading(false)
    })()
  }, [router])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const topicsArr = topics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, bio, topics: topicsArr, role })
      .eq('id', user.id)
    setSaving(false)
    setMsg(error ? error.message : 'Saved!')
    toast.show(error ? error.message : 'Profile saved', error ? 'error' : 'success')
  }

  if (loading) return <div className="p-8">Loading…</div>

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your profile</h1>
      <form onSubmit={save} className="space-y-3">
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
          <option value="seeker">Seeker</option>
          <option value="mentor">Mentor</option>
        </select>
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Topics (comma separated)"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
      {role === 'mentor' && userId && <AvailabilityManager mentorId={userId} />}
    </div>
  )
}
