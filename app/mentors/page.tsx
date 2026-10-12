import { createSupabaseServerClient } from '@/lib/supabase-server'
import MentorFilters from './MentorFilters'
import MentorCard from '../components/MentorCard'
import { Container, Empty } from '../components/ui'
import { Icon } from '../components/Icon'

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
    return sb.avg - sa.avg || sb.count - sa.count
  })

  return (
    <div>
      <section className="brand-gradient border-b">
        <Container size="xl" className="py-10 sm:py-14">
          <nav className="text-sm text-[color:var(--muted)] mb-3 flex items-center gap-1.5">
            <a href="/" className="hover:underline">Home</a>
            <Icon name="arrow-right" size={12} />
            <span>Advisors</span>
          </nav>
          <h1 className="text-display text-4xl sm:text-5xl font-bold tracking-tight">
            Find your advisor
          </h1>
          <p className="mt-3 text-[color:var(--muted-strong)] text-lg max-w-xl">
            {list.length} people ready to help across chat and video.
          </p>
        </Container>
      </section>

      <Container size="xl" className="py-10">
        <MentorFilters topics={allTopics} q={q} topic={topic} sort={sort} />

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
            <>
              <p className="text-sm text-[color:var(--muted)] mb-4">
                Showing <strong className="text-[color:var(--foreground)]">{sorted.length}</strong>{' '}
                of <strong className="text-[color:var(--foreground)]">{list.length}</strong> advisors
              </p>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((m) => {
                  const s = stats.get(m.id)
                  return (
                    <li key={m.id}>
                      <MentorCard
                        m={{
                          id: m.id,
                          full_name: m.full_name,
                          bio: m.bio,
                          topics: m.topics,
                          avg: s?.avg,
                          count: s?.count,
                        }}
                      />
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </Container>
    </div>
  )
}
