import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import BookingForm from './BookingForm'
import ReviewList from './ReviewList'

export const instant = false

type Slot = {
  id: string
  starts_at: string
  duration_min: number
}

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
  const { data: slots } = await supabase
    .from('availability_slots')
    .select('id, starts_at, duration_min')
    .eq('mentor_id', id)
    .is('booking_id', null)
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold">{mentor.full_name}</h1>
      {mentor.bio && <p className="mt-2 text-gray-700">{mentor.bio}</p>}
      {mentor.topics && mentor.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {mentor.topics.map((t: string) => (
            <span key={t} className="text-xs bg-gray-100 px-2 py-1 rounded">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-6">
        <Link
          href={`/messages/${mentor.id}`}
          className="inline-block border px-4 py-2 rounded text-sm"
        >
          Message {mentor.full_name.split(' ')[0]}
        </Link>
      </div>
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-3">Book a session</h2>
        <BookingForm mentorId={mentor.id} slots={(slots ?? []) as Slot[]} />
      </div>
      <ReviewList mentorId={mentor.id} />
    </div>
  )
}
