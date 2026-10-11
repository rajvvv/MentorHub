import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import MentorFilters from './MentorFilters'

export const instant = false

type Mentor = {
  id: string
  full_name: string
  bio: string | null
  topics: string[] | null
}

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; topic?: string }>
}) {
  const { q = '', topic = '' } = await searchParams
  const supabase = await createSupabaseServerClient()

  const { data: all } = await supabase
    .from('profiles')
    .select('id, full_name, bio, topics')
    .eq('role', 'mentor')

  const list = (all ?? []) as Mentor[]

  const allTopics = Array.from(
    new Set(list.flatMap((m) => m.topics ?? []))
  ).sort()

  const needle = q.trim().toLowerCase()
  const filtered = list.filter((m) => {
    if (topic && !(m.topics ?? []).includes(topic)) return false
    if (needle) {
      const hay = `${m.full_name} ${m.bio ?? ''}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mentors</h1>
      <MentorFilters topics={allTopics} q={q} topic={topic} />
      {filtered.length === 0 ? (
        <p className="text-gray-600 mt-6">
          {list.length === 0 ? 'No mentors yet.' : 'No mentors match.'}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 mt-6">
          {filtered.map((m) => (
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
