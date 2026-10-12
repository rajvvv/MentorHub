'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge, Card, Input, Label, Select } from '../components/ui'

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
        Discrete slots seekers can book. Unbooked ones can be removed anytime.
      </p>
      <form onSubmit={addSlot} className="grid gap-3 sm:grid-cols-[1fr_120px_auto] items-end">
        <div>
          <Label>Start</Label>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Minutes</Label>
          <Select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={45}>45</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
          </Select>
        </div>
        <button className="bg-[color:var(--brand)] text-white px-4 py-2.5 rounded-xl font-semibold hover:brightness-110">
          Add slot
        </button>
      </form>
      {error && (
        <p className="text-sm bg-[color:var(--danger-soft)] text-[color:var(--danger)] rounded-xl p-3 mt-3">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-[color:var(--muted)] mt-4">Loading…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-[color:var(--muted)] mt-4">No slots yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {slots.map((s) => (
            <li
              key={s.id}
              className="flex justify-between items-center border rounded-xl px-3 py-2 bg-[color:var(--surface)]"
            >
              <span className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {new Date(s.starts_at).toLocaleString()}
                </span>
                <span className="text-[color:var(--muted)]">
                  · {s.duration_min} min
                </span>
                {s.booking_id && <Badge tone="success">booked</Badge>}
              </span>
              {!s.booking_id && (
                <button
                  onClick={() => remove(s.id)}
                  className="text-sm text-[color:var(--danger)] hover:underline"
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
