import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const instant = false

type Mentor = {
  id: string
  full_name: string
  bio: string | null
  topics: string[] | null
}

export default async function MentorsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: mentors } = await supabase
    .from('profiles')
    .select('id, full_name, bio, topics')
    .eq('role', 'mentor')

  const list = (mentors ?? []) as Mentor[]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mentors</h1>
      {list.length === 0 ? (
        <p className="text-gray-600">No mentors yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((m) => (
            <li key={m.id} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold">{m.full_name}</h2>
              {m.bio && <p className="text-sm text-gray-700 mt-1">{m.bio}</p>}
              {m.topics && m.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.topics.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={`/mentors/${m.id}`}
                className="inline-block mt-3 text-sm underline"
              >
                View & book →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
