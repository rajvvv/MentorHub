'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BookingForm({ mentorId }: { mentorId: string }) {
  const router = useRouter()
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      if (user.id === mentorId) {
        throw new Error("You can't book yourself.")
      }
      const jitsiRoom = `mentorhub-${crypto.randomUUID()}`
      const { error } = await supabase.from('bookings').insert({
        seeker_id: user.id,
        mentor_id: mentorId,
        scheduled_at: new Date(scheduledAt).toISOString(),
        jitsi_room: jitsiRoom,
        notes,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="datetime-local"
        className="w-full border p-2 rounded"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        required
      />
      <textarea
        className="w-full border p-2 rounded"
        placeholder="What do you want to discuss?"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Booking…' : 'Book session'}
      </button>
    </form>
  )
}
