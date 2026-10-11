'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Slot = { id: string; starts_at: string; duration_min: number }

export default function BookingForm({
  mentorId,
  slots,
}: {
  mentorId: string
  slots: Slot[]
}) {
  const router = useRouter()
  const [slotId, setSlotId] = useState(slots[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        This mentor has no open slots right now. Check back later.
      </p>
    )
  }

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
      const slot = slots.find((s) => s.id === slotId)
      if (!slot) throw new Error('Pick a slot.')

      const jitsiRoom = `mentorhub-${crypto.randomUUID()}`
      const { data: booking, error: bErr } = await supabase
        .from('bookings')
        .insert({
          seeker_id: user.id,
          mentor_id: mentorId,
          scheduled_at: slot.starts_at,
          jitsi_room: jitsiRoom,
          slot_id: slot.id,
          notes,
        })
        .select('id')
        .single()
      if (bErr || !booking) throw bErr ?? new Error('Could not book')

      const { error: sErr, data: claimed } = await supabase
        .from('availability_slots')
        .update({ booking_id: booking.id })
        .eq('id', slot.id)
        .is('booking_id', null)
        .select('id')
      if (sErr) throw sErr
      if (!claimed || claimed.length === 0) {
        await supabase.from('bookings').delete().eq('id', booking.id)
        throw new Error('That slot was just taken — pick another.')
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <select
        value={slotId}
        onChange={(e) => setSlotId(e.target.value)}
        className="w-full border p-2 rounded"
        required
      >
        {slots.map((s) => (
          <option key={s.id} value={s.id}>
            {new Date(s.starts_at).toLocaleString()} · {s.duration_min}min
          </option>
        ))}
      </select>
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
