import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import BookingForm from './BookingForm'

export const instant = false

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
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-3">Book a session</h2>
        <BookingForm mentorId={mentor.id} />
      </div>
    </div>
  )
}
