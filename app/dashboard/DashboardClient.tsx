'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Booking = {
  id: string
  seeker_id: string
  mentor_id: string
  scheduled_at: string
  status: string
  notes: string | null
  jitsi_room: string
  seeker: { full_name: string } | null
  mentor: { full_name: string } | null
}

export default function DashboardClient() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tab, setTab] = useState<'seeker' | 'mentor'>('seeker')
  const [loading, setLoading] = useState(true)

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUserId(user.id)
    const { data } = await supabase
      .from('bookings')
      .select('*, seeker:seeker_id(full_name), mentor:mentor_id(full_name)')
      .or(`seeker_id.eq.${user.id},mentor_id.eq.${user.id}`)
      .order('scheduled_at', { ascending: false })
    setBookings((data ?? []) as unknown as Booking[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cancel(id: string) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    load()
  }

  if (loading) return <div className="p-8">Loading…</div>

  const asSeeker = bookings.filter((b) => b.seeker_id === userId)
  const asMentor = bookings.filter((b) => b.mentor_id === userId)
  const current = tab === 'seeker' ? asSeeker : asMentor

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="flex gap-2 border-b mb-4">
        <button
          onClick={() => setTab('seeker')}
          className={`px-4 py-2 ${tab === 'seeker' ? 'border-b-2 border-black font-semibold' : ''}`}
        >
          As Seeker ({asSeeker.length})
        </button>
        <button
          onClick={() => setTab('mentor')}
          className={`px-4 py-2 ${tab === 'mentor' ? 'border-b-2 border-black font-semibold' : ''}`}
        >
          As Mentor ({asMentor.length})
        </button>
      </div>
      {current.length === 0 ? (
        <p className="text-gray-600">No bookings yet.</p>
      ) : (
        <ul className="space-y-3">
          {current.map((b) => {
            const other =
              tab === 'seeker' ? b.mentor?.full_name : b.seeker?.full_name
            const when = new Date(b.scheduled_at).toLocaleString()
            return (
              <li key={b.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="font-semibold">{other ?? 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{when}</p>
                    <p className="text-xs mt-1">
                      Status: <span className="font-medium">{b.status}</span>
                    </p>
                    {b.notes && (
                      <p className="text-sm mt-2 text-gray-700">{b.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {b.status === 'confirmed' && (
                      <>
                        <Link
                          href={`/call/${b.id}`}
                          className="bg-black text-white px-3 py-1 rounded text-sm"
                        >
                          Join call
                        </Link>
                        <button
                          onClick={() => cancel(b.id)}
                          className="border px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
