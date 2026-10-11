import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import BookingForm from './BookingForm'
import ReviewList from './ReviewList'
import FavoriteButton from './FavoriteButton'

export const instant = false

type Slot = {
  id: string
  starts_at: string
  duration_min: number
}

type Service = {
  id: string
  category_slug: string
  title: string
  description: string | null
  duration_min: number
}

type Category = { slug: string; name: string; icon: string | null }

export default async function MentorProfile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: mentor } = await supabase
    .from('profiles')
    .select('id, full_name, bio, topics, role')
    .eq('id', id)
    .eq('role', 'mentor')
    .single()

  if (!mentor) notFound()

  const now = new Date().toISOString()
  const [{ data: slots }, { data: services }, { data: cats }] = await Promise.all([
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
  ])

  const catMap = new Map(
    ((cats ?? []) as Category[]).map((c) => [c.slug, c])
  )
  const slotList = (slots ?? []) as Slot[]
  const serviceList = (services ?? []) as Service[]

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{mentor.full_name}</h1>
          {mentor.bio && <p className="mt-2 text-gray-700">{mentor.bio}</p>}
          {mentor.topics && mentor.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {mentor.topics.map((t: string) => (
                <span
                  key={t}
                  className="text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <FavoriteButton mentorId={mentor.id} />
      </div>

      <div className="mt-5 flex gap-2 flex-wrap">
        <Link
          href={`/messages/${mentor.id}`}
          className="border px-4 py-2 rounded text-sm"
        >
          💬 Message {mentor.full_name.split(' ')[0]}
        </Link>
      </div>

      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Services</h2>
        {serviceList.length === 0 ? (
          <p className="text-sm text-gray-600">
            This advisor hasn&apos;t listed services yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {serviceList.map((s) => {
              const c = catMap.get(s.category_slug)
              return (
                <li key={s.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {c?.icon} {c?.name} · {s.duration_min} min · Free
                      </p>
                      {s.description && (
                        <p className="text-sm text-gray-700 mt-2">{s.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <BookingForm
                      mentorId={mentor.id}
                      serviceId={s.id}
                      serviceTitle={s.title}
                      slots={slotList}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ReviewList mentorId={mentor.id} />
    </div>
  )
}
