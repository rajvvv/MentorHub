'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '../../components/Toast'

type Slot = { id: string; starts_at: string; duration_min: number }

export default function BookingForm({
  mentorId,
  slots,
  serviceId,
  serviceTitle,
}: {
  mentorId: string
  slots: Slot[]
  serviceId?: string
  serviceTitle?: string
}) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [slotId, setSlotId] = useState(slots[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (slots.length === 0) {
    return (
      <p className="text-sm text-[color:var(--muted)]">
        No open slots right now. Message the advisor to request a time.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-[color:var(--brand)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110"
      >
        Book this
      </button>
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
      if (user.id === mentorId) throw new Error("You can't book yourself.")

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
          service_id: serviceId ?? null,
          notes: serviceTitle ? `[${serviceTitle}] ${notes}`.trim() : notes,
        })
        .select('id')
        .single()
      if (bErr || !booking) throw bErr ?? new Error('Could not book')

      const { data: claimed, error: sErr } = await supabase
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

      toast.show('Session booked!', 'success')
      router.push('/dashboard')
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Failed to book'
      setError(m)
      toast.show(m, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t pt-3">
      <label className="block text-sm">
        Pick a slot
        <select
          value={slotId}
          onChange={(e) => setSlotId(e.target.value)}
          className="block w-full border p-2 rounded mt-1"
          required
        >
          {slots.map((s) => (
            <option key={s.id} value={s.id}>
              {new Date(s.starts_at).toLocaleString()} · {s.duration_min}min
            </option>
          ))}
        </select>
      </label>
      <textarea
        className="w-full border p-2 rounded"
        placeholder="What do you want to discuss?"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-[color:var(--brand)] text-white px-4 py-2 rounded-xl font-semibold hover:brightness-110 disabled:opacity-50"
        >
          {loading ? 'Booking…' : 'Confirm booking'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
