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

type ReviewRow = { mentor_id: string; rating: number }

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; topic?: string }>
}) {
  const { q = '', topic = '' } = await searchParams
  const supabase = await createSupabaseServerClient()

  const [{ data: all }, { data: reviews }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, bio, topics')
      .eq('role', 'mentor'),
    supabase.from('reviews').select('mentor_id, rating'),
  ])

  const list = (all ?? []) as Mentor[]
  const stats = new Map<string, { avg: number; count: number }>()
  for (const r of (reviews ?? []) as ReviewRow[]) {
    const s = stats.get(r.mentor_id) ?? { avg: 0, count: 0 }
    const total = s.avg * s.count + r.rating
    s.count += 1
    s.avg = total / s.count
    stats.set(r.mentor_id, s)
  }

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
      <h1 className="text-3xl font-bold mb-6">Advisors</h1>
      <MentorFilters topics={allTopics} q={q} topic={topic} />
      {filtered.length === 0 ? (
        <p className="text-gray-600 mt-6">
          {list.length === 0 ? 'No advisors yet.' : 'No advisors match.'}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 mt-6">
          {filtered.map((m) => {
            const s = stats.get(m.id)
            return (
              <li key={m.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold">{m.full_name}</h2>
                  {s && (
                    <span
                      className="text-sm text-gray-600"
                      title={`${s.count} review${s.count === 1 ? '' : 's'}`}
                    >
                      ★ {s.avg.toFixed(1)}{' '}
                      <span className="text-xs text-gray-500">({s.count})</span>
                    </span>
                  )}
                </div>
                {m.bio && (
                  <p className="text-sm text-gray-700 mt-1 line-clamp-3">{m.bio}</p>
                )}
                {m.topics && m.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.topics.slice(0, 5).map((t) => (
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
                  View &amp; book →
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
