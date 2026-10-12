import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import MentorFilters from './MentorFilters'
import {
  Avatar,
  Card,
  Container,
  Empty,
  SectionTitle,
  Stars,
} from '../components/ui'
import { OnlineDot } from '../components/Presence'

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
  searchParams: Promise<{ q?: string; topic?: string; sort?: string }>
}) {
  const { q = '', topic = '', sort = 'rated' } = await searchParams
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
    s.avg = (s.avg * s.count + r.rating) / (s.count + 1)
    s.count += 1
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

  const sorted = filtered.slice().sort((a, b) => {
    const sa = stats.get(a.id) ?? { avg: 0, count: 0 }
    const sb = stats.get(b.id) ?? { avg: 0, count: 0 }
    if (sort === 'reviewed') return sb.count - sa.count
    if (sort === 'name') return a.full_name.localeCompare(b.full_name)
    return sb.avg - sa.avg || sb.count - sa.count // 'rated' default
  })

  return (
    <Container size="lg" className="py-10">
      <SectionTitle
        title="Advisors"
        subtitle={`${list.length} available · chat and video, free`}
      />

      <div className="mt-6">
        <MentorFilters
          topics={allTopics}
          q={q}
          topic={topic}
          sort={sort}
        />
      </div>

      <div className="mt-8">
        {sorted.length === 0 ? (
          <Empty
            icon="🔎"
            title={list.length === 0 ? 'No advisors yet' : 'No matches'}
            body={
              list.length === 0
                ? 'Advisors who sign up will appear here.'
                : 'Try a different search or clear the filters.'
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((m) => {
              const s = stats.get(m.id)
              return (
                <li key={m.id}>
                  <Link href={`/mentors/${m.id}`}>
                    <Card hover className="h-full">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar name={m.full_name} id={m.id} size={48} />
                          <span className="absolute -bottom-0.5 -right-0.5 bg-[color:var(--surface)] rounded-full p-0.5">
                            <OnlineDot userId={m.id} size={10} />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {m.full_name}
                          </p>
                          {s ? (
                            <Stars value={s.avg} count={s.count} />
                          ) : (
                            <p className="text-xs text-[color:var(--muted)]">
                              New advisor
                            </p>
                          )}
                        </div>
                      </div>
                      {m.bio && (
                        <p className="text-sm text-[color:var(--muted)] mt-3 line-clamp-3">
                          {m.bio}
                        </p>
                      )}
                      {m.topics && m.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {m.topics.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="text-xs bg-[color:var(--surface-2)] text-[color:var(--muted)] px-2 py-0.5 rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                          {m.topics.length > 4 && (
                            <span className="text-xs text-[color:var(--muted)]">
                              +{m.topics.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </Card>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Container>
  )
}
