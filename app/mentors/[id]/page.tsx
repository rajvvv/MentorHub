import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import BookingForm from './BookingForm'
import ReviewList from './ReviewList'
import FavoriteButton from './FavoriteButton'
import ShareButton from './ShareButton'
import RequestCallButton from '../../components/RequestCallButton'
import {
  Avatar,
  Badge,
  Card,
  Container,
  Empty,
  Stars,
} from '../../components/ui'
import { OnlineDot } from '../../components/Presence'
import { Icon } from '../../components/Icon'

type Slot = { id: string; starts_at: string; duration_min: number }
type Service = {
  id: string
  category_slug: string
  title: string
  description: string | null
  duration_min: number
}
type Category = { slug: string; name: string; icon: string | null }
type ReviewRow = { rating: number }

export default async function MentorProfile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: mentor } = await supabase
    .from('profiles')
    .select('id, full_name, bio, topics, role, created_at')
    .eq('id', id)
    .eq('role', 'mentor')
    .single()

  if (!mentor) notFound()

  const now = new Date().toISOString()
  const [
    { data: slots },
    { data: services },
    { data: cats },
    { data: reviewRows },
    { count: sessions },
  ] = await Promise.all([
    supabase
      .from('availability_slots')
      .select('id, starts_at, duration_min')
      .eq('mentor_id', id)
      .is('booking_id', null)
      .gte('starts_at', now)
      .order('starts_at'),
    supabase
      .from('services')
      .select('id, category_slug, title, description, duration_min')
      .eq('mentor_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('slug, name, icon'),
    supabase.from('reviews').select('rating').eq('mentor_id', id),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', id)
      .eq('status', 'completed'),
  ])

  const catMap = new Map(((cats ?? []) as Category[]).map((c) => [c.slug, c]))
  const slotList = (slots ?? []) as Slot[]
  const serviceList = (services ?? []) as Service[]
  const revs = (reviewRows ?? []) as ReviewRow[]
  const avg = revs.length ? revs.reduce((s, r) => s + r.rating, 0) / revs.length : 0

  const joined = new Date(mentor.created_at).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })

  return (
    <>
      {/* HERO */}
      <section className="brand-gradient border-b relative overflow-hidden">
        <Container size="lg" className="relative py-12 sm:py-16">
          <nav className="text-sm text-[color:var(--muted)] mb-5 flex items-center gap-1.5">
            <Link href="/" className="hover:underline">Home</Link>
            <Icon name="arrow-right" size={12} />
            <Link href="/mentors" className="hover:underline">Advisors</Link>
            <Icon name="arrow-right" size={12} />
            <span className="truncate">{mentor.full_name}</span>
          </nav>
          <div className="flex items-start gap-6 flex-wrap">
            <div className="relative">
              <Avatar
                name={mentor.full_name}
                id={mentor.id}
                size={112}
                className="shadow-[var(--shadow-lg)]"
                ring
              />
              <span className="absolute bottom-1 right-1 bg-[color:var(--surface)] rounded-full p-1 shadow-sm">
                <OnlineDot userId={mentor.id} size={14} />
              </span>
            </div>
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-display text-4xl sm:text-5xl font-bold tracking-tight">
                  {mentor.full_name}
                </h1>
                {revs.length >= 5 && (
                  <span
                    className="inline-flex items-center gap-1 bg-[color:var(--brand-soft)] text-[color:var(--brand)] px-2 py-0.5 rounded-full text-xs font-medium"
                    title="Verified advisor"
                  >
                    <Icon name="check-circle" size={13} strokeWidth={2.5} />
                    Verified
                  </span>
                )}
                <OnlineDot userId={mentor.id} size={10} label />
              </div>
              <div className="mt-3 flex items-center flex-wrap gap-x-6 gap-y-2 text-sm text-[color:var(--muted)]">
                {revs.length > 0 && <Stars value={avg} count={revs.length} size="md" />}
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="users" size={14} />
                  <strong className="text-[color:var(--foreground)]">
                    {sessions ?? 0}
                  </strong>
                  sessions completed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" size={14} />
                  Joined {joined}
                </span>
              </div>
              {mentor.bio && (
                <p className="mt-5 text-[color:var(--foreground)] max-w-2xl leading-relaxed">
                  {mentor.bio}
                </p>
              )}
              {mentor.topics && mentor.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {mentor.topics.map((t: string) => (
                    <span
                      key={t}
                      className="text-xs bg-[color:var(--surface)] border px-2.5 py-1 rounded-full font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-7 flex gap-2 flex-wrap">
                <RequestCallButton mentorId={mentor.id} />
                <Link
                  href={`/messages/${mentor.id}`}
                  className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-xl text-sm font-medium bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)]"
                >
                  <Icon name="message" size={16} />
                  Message
                </Link>
                <FavoriteButton mentorId={mentor.id} />
                <ShareButton name={mentor.full_name} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* BODY */}
      <Container size="lg" className="py-10">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Services</h2>
            <p className="text-[color:var(--muted)] mt-1 mb-5">
              Pick a service and a slot that works for both of you.
            </p>
            {serviceList.length === 0 ? (
              <Empty
                icon="📦"
                title="No services listed yet"
                body="This advisor hasn't packaged any offerings. Send them a message to ask."
              />
            ) : (
              <ul className="space-y-4">
                {serviceList.map((s) => {
                  const c = catMap.get(s.category_slug)
                  return (
                    <li key={s.id}>
                      <Card>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <h3 className="font-semibold">{s.title}</h3>
                              <Badge tone="brand">
                                {c?.icon} {c?.name}
                              </Badge>
                              <Badge tone="neutral">
                                {s.duration_min} min
                              </Badge>
                              <Badge tone="success">Free</Badge>
                            </div>
                            {s.description && (
                              <p className="text-sm text-[color:var(--muted)] mt-2">
                                {s.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <BookingForm
                            mentorId={mentor.id}
                            serviceId={s.id}
                            serviceTitle={s.title}
                            slots={slotList}
                          />
                        </div>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="mt-10">
              <ReviewList mentorId={mentor.id} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
            <Card>
              <h3 className="font-semibold">Quick actions</h3>
              <div className="mt-3 flex flex-col gap-2">
                <RequestCallButton
                  mentorId={mentor.id}
                  label="📞 Request video call"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[color:var(--success)] text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:brightness-110"
                />
                <Link
                  href={`/messages/${mentor.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 border px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[color:var(--surface-2)]"
                >
                  💬 Send a message
                </Link>
              </div>
            </Card>
            <Card>
              <h3 className="font-semibold">Open slots</h3>
              {slotList.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)] mt-2">
                  No open slots right now — chat to request a time.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {slotList.slice(0, 5).map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>{new Date(s.starts_at).toLocaleString()}</span>
                      <Badge tone="neutral">{s.duration_min}m</Badge>
                    </li>
                  ))}
                  {slotList.length > 5 && (
                    <li className="text-xs text-[color:var(--muted)]">
                      + {slotList.length - 5} more
                    </li>
                  )}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      </Container>
    </>
  )
}
