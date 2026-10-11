'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '../components/ui'

type Slot = {
  id: string
  starts_at: string
  duration_min: number
  booking_id: string | null
}

export default function AvailabilityManager({ mentorId }: { mentorId: string }) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [startsAt, setStartsAt] = useState('')
  const [duration, setDuration] = useState(30)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('availability_slots')
      .select('id, starts_at, duration_min, booking_id')
      .eq('mentor_id', mentorId)
      .order('starts_at', { ascending: true })
    setSlots((data ?? []) as Slot[])
    setLoading(false)
  }, [mentorId])

  useEffect(() => {
    load()
  }, [load])

  async function addSlot(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('availability_slots').insert({
      mentor_id: mentorId,
      starts_at: new Date(startsAt).toISOString(),
      duration_min: duration,
    })
    if (error) {
      setError(error.message)
      return
    }
    setStartsAt('')
    load()
  }

  async function remove(id: string) {
    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', id)
    if (error) setError(error.message)
    load()
  }

  return (
    <Card>
      <h2 className="text-lg font-bold">My availability</h2>
      <p className="text-sm text-[color:var(--muted)] mt-1 mb-4">
        Discrete slots seekers can book. Delete anytime an unbooked slot.
      </p>
      <form onSubmit={addSlot} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600">Start</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Minutes</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="border p-2 rounded"
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={45}>45</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
          </select>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded">
          Add slot
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500 mt-4">Loading…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-gray-500 mt-4">No slots yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {slots.map((s) => (
            <li
              key={s.id}
              className="flex justify-between items-center border rounded p-2"
            >
              <span>
                {new Date(s.starts_at).toLocaleString()} · {s.duration_min}min
                {s.booking_id && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    booked
                  </span>
                )}
              </span>
              {!s.booking_id && (
                <button
                  onClick={() => remove(s.id)}
                  className="text-sm text-red-600"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
