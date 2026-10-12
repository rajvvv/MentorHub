'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { downloadIcs } from '@/lib/ics'
import ReviewForm from './ReviewForm'
import { useToast } from '../components/Toast'
import { Avatar, Badge, Card, Container, Empty } from '../components/ui'

type Booking = {
  id: string
  seeker_id: string
  mentor_id: string
  scheduled_at: string
  status: 'confirmed' | 'completed' | 'cancelled'
  notes: string | null
  jitsi_room: string
  seeker: { full_name: string } | null
  mentor: { full_name: string } | null
}

const STATUS_TONE: Record<string, 'success' | 'brand' | 'danger' | 'neutral'> = {
  confirmed: 'brand',
  completed: 'success',
  cancelled: 'danger',
}

function timeUntil(iso: string): { label: string; soon: boolean } | null {
  const diffMs = new Date(iso).getTime() - Date.now()
  if (diffMs <= 0) return null
  const mins = Math.floor(diffMs / 60_000)
  const soon = mins < 60
  if (mins < 60) return { label: `in ${mins} min`, soon: true }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { label: `in ${hours}h`, soon: hours < 2 }
  const days = Math.floor(hours / 24)
  return { label: `in ${days} day${days === 1 ? '' : 's'}`, soon }
}

export default function DashboardClient() {
  const router = useRouter()
  const toast = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'seeker' | 'mentor'>('seeker')
  const [loading, setLoading] = useState(true)
  const [openReviewFor, setOpenReviewFor] = useState<string | null>(null)

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
    const bs = (data ?? []) as unknown as Booking[]
    setBookings(bs)
    const ids = bs.map((b) => b.id)
    if (ids.length > 0) {
      const { data: revs } = await supabase
        .from('reviews')
        .select('booking_id')
        .in('booking_id', ids)
      setReviewed(new Set((revs ?? []).map((r) => r.booking_id as string)))
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cancel(id: string) {
    if (!confirm('Cancel this booking?')) return
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
    toast.show(error ? error.message : 'Booking cancelled', error ? 'error' : 'success')
    load()
  }

  async function complete(id: string) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', id)
    toast.show(error ? error.message : 'Marked completed', error ? 'error' : 'success')
    load()
  }

  if (loading) {
    return (
      <Container className="py-10">
        <p className="text-[color:var(--muted)]">Loading…</p>
      </Container>
    )
  }

  const asSeeker = bookings.filter((b) => b.seeker_id === userId)
  const asMentor = bookings.filter((b) => b.mentor_id === userId)
  const current = tab === 'seeker' ? asSeeker : asMentor

  const upcoming = current.filter(
    (b) => b.status === 'confirmed' && new Date(b.scheduled_at) >= new Date()
  ).length

  return (
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[color:var(--muted)] mt-1">
            {upcoming === 0
              ? 'Nothing on the calendar yet.'
              : `${upcoming} upcoming session${upcoming === 1 ? '' : 's'}.`}
          </p>
        </div>
        <div className="inline-flex rounded-xl border p-1 bg-[color:var(--surface-2)]">
          <button
            onClick={() => setTab('seeker')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === 'seeker'
                ? 'bg-[color:var(--surface)] shadow-sm'
                : 'text-[color:var(--muted)]'
            }`}
          >
            As Seeker ({asSeeker.length})
          </button>
          <button
            onClick={() => setTab('mentor')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === 'mentor'
                ? 'bg-[color:var(--surface)] shadow-sm'
                : 'text-[color:var(--muted)]'
            }`}
          >
            As Advisor ({asMentor.length})
          </button>
        </div>
      </div>

      <div className="mt-6">
        {current.length === 0 ? (
          <Empty
            icon="📅"
            title={
              tab === 'seeker'
                ? 'No sessions yet'
                : 'No one has booked you yet'
            }
            body={
              tab === 'seeker'
                ? 'Browse advisors and book your first session.'
                : 'Make sure your profile and services are set up so seekers can find you.'
            }
            action={
              tab === 'seeker' ? (
                <Link
                  href="/mentors"
                  className="inline-flex items-center bg-[color:var(--brand)] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:brightness-110"
                >
                  Find an advisor
                </Link>
              ) : (
                <Link
                  href="/profile"
                  className="inline-flex items-center border rounded-xl px-4 py-2 text-sm font-medium hover:bg-[color:var(--surface-2)]"
                >
                  Edit profile
                </Link>
              )
            }
          />
        ) : (
          <ul className="space-y-3">
            {current.map((b) => {
              const other =
                tab === 'seeker' ? b.mentor?.full_name : b.seeker?.full_name
              const otherId = tab === 'seeker' ? b.mentor_id : b.seeker_id
              const when = new Date(b.scheduled_at).toLocaleString()
              const isPast = new Date(b.scheduled_at) < new Date()
              const hasReview = reviewed.has(b.id)
              const countdown =
                b.status === 'confirmed' ? timeUntil(b.scheduled_at) : null
              return (
                <li key={b.id}>
                  <Card>
                    <div className="flex items-start gap-4 flex-wrap">
                      <Avatar name={other ?? 'User'} id={otherId} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{other ?? 'Unknown'}</p>
                          <Badge tone={STATUS_TONE[b.status] ?? 'neutral'}>
                            {b.status}
                          </Badge>
                          {countdown && (
                            <Badge tone={countdown.soon ? 'warn' : 'neutral'}>
                              {countdown.label}
                            </Badge>
                          )}
                          {isPast && b.status === 'confirmed' && (
                            <Badge tone="warn">past time</Badge>
                          )}
                        </div>
                        <p className="text-sm text-[color:var(--muted)] mt-0.5">
                          🕒 {when}
                        </p>
                        {b.notes && (
                          <p className="text-sm mt-2">{b.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/messages/${otherId}`}
                          className="border px-3 py-1.5 rounded-xl text-sm hover:bg-[color:var(--surface-2)]"
                        >
                          💬 Message
                        </Link>
                        {b.status === 'confirmed' && (
                          <>
                            <Link
                              href={`/call/${b.id}`}
                              className="bg-[color:var(--brand)] text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:brightness-110"
                            >
                              🎥 Join call
                            </Link>
                            <button
                              onClick={() =>
                                downloadIcs({
                                  id: b.id,
                                  title: `MentorHub: ${other ?? 'Session'}`,
                                  description: b.notes ?? '',
                                  startISO: b.scheduled_at,
                                  durationMin: 30,
                                  url:
                                    typeof window !== 'undefined'
                                      ? `${window.location.origin}/call/${b.id}`
                                      : undefined,
                                })
                              }
                              className="border px-3 py-1.5 rounded-xl text-sm hover:bg-[color:var(--surface-2)]"
                            >
                              📅 Add to calendar
                            </button>
                            {tab === 'mentor' && isPast && (
                              <button
                                onClick={() => complete(b.id)}
                                className="border px-3 py-1.5 rounded-xl text-sm hover:bg-[color:var(--surface-2)]"
                              >
                                ✓ Mark completed
                              </button>
                            )}
                            <button
                              onClick={() => cancel(b.id)}
                              className="border px-3 py-1.5 rounded-xl text-sm text-[color:var(--danger)] hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {b.status === 'completed' &&
                          tab === 'seeker' &&
                          !hasReview && (
                            <button
                              onClick={() =>
                                setOpenReviewFor(
                                  openReviewFor === b.id ? null : b.id
                                )
                              }
                              className="border px-3 py-1.5 rounded-xl text-sm hover:bg-[color:var(--surface-2)]"
                            >
                              {openReviewFor === b.id ? 'Close' : '⭐ Leave review'}
                            </button>
                          )}
                        {b.status === 'completed' && hasReview && (
                          <Badge tone="success">Reviewed</Badge>
                        )}
                      </div>
                    </div>
                    {openReviewFor === b.id && userId && (
                      <ReviewForm
                        bookingId={b.id}
                        mentorId={b.mentor_id}
                        seekerId={userId}
                        onDone={() => {
                          setOpenReviewFor(null)
                          load()
                        }}
                      />
                    )}
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Container>
  )
}
