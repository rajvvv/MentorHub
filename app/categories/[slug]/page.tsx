import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import {
  Avatar,
  Badge,
  Card,
  Container,
  Empty,
  Stars,
} from '../../components/ui'

type Service = {
  id: string
  mentor_id: string
  title: string
  description: string | null
  duration_min: number
}

type Mentor = {
  id: string
  full_name: string
  bio: string | null
  topics: string[] | null
}

type ReviewRow = { mentor_id: string; rating: number }

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  const { data: category } = await supabase
    .from('categories')
    .select('slug, name, icon')
    .eq('slug', slug)
    .single()

  if (!category) notFound()

  const { data: services } = await supabase
    .from('services')
    .select('id, mentor_id, title, description, duration_min')
    .eq('category_slug', slug)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const svList = (services ?? []) as Service[]
  const mentorIds = Array.from(new Set(svList.map((s) => s.mentor_id)))

  let mentorMap = new Map<string, Mentor>()
  const stats = new Map<string, { avg: number; count: number }>()
  if (mentorIds.length > 0) {
    const [{ data: ms }, { data: revs }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, bio, topics')
        .eq('role', 'mentor')
        .in('id', mentorIds),
      supabase
        .from('reviews')
        .select('mentor_id, rating')
        .in('mentor_id', mentorIds),
    ])
    mentorMap = new Map(((ms ?? []) as Mentor[]).map((m) => [m.id, m]))
    for (const r of (revs ?? []) as ReviewRow[]) {
      const s = stats.get(r.mentor_id) ?? { avg: 0, count: 0 }
      s.avg = (s.avg * s.count + r.rating) / (s.count + 1)
      s.count += 1
      stats.set(r.mentor_id, s)
    }
  }

  const byMentor = new Map<string, Service[]>()
  for (const s of svList) {
    const list = byMentor.get(s.mentor_id) ?? []
    list.push(s)
    byMentor.set(s.mentor_id, list)
  }

  return (
    <>
      <section className="brand-gradient border-b">
        <Container size="lg" className="py-10">
          <nav className="text-sm text-[color:var(--muted)]">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span className="mx-1.5">›</span>
            <Link href="/mentors" className="hover:underline">
              Advisors
            </Link>
          </nav>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl grid place-items-center text-2xl bg-[color:var(--surface)] border">
              {category.icon}
            </span>
            {category.name}
          </h1>
          <p className="text-[color:var(--muted)] mt-2">
            {byMentor.size} advisor{byMentor.size === 1 ? '' : 's'} ·{' '}
            {svList.length} service{svList.length === 1 ? '' : 's'}
          </p>
        </Container>
      </section>

      <Container size="lg" className="py-10">
        {byMentor.size === 0 ? (
          <Empty
            icon={category.icon ?? '✨'}
            title={`No ${category.name.toLowerCase()} services yet`}
            body="Be the first to offer services in this category."
            action={
              <Link
                href="/login?role=mentor"
                className="inline-flex items-center bg-[color:var(--brand)] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:brightness-110"
              >
                Become an advisor
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {Array.from(byMentor.entries()).map(([mid, servicesForMentor]) => {
              const m = mentorMap.get(mid)
              if (!m) return null
              const s = stats.get(mid)
              return (
                <li key={mid}>
                  <Card hover>
                    <div className="flex items-start gap-4 flex-wrap">
                      <Avatar name={m.full_name} id={m.id} size={56} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/mentors/${mid}`}
                            className="text-lg font-semibold hover:underline"
                          >
                            {m.full_name}
                          </Link>
                          {s && <Stars value={s.avg} count={s.count} />}
                        </div>
                        {m.bio && (
                          <p className="text-sm text-[color:var(--muted)] mt-1 line-clamp-2">
                            {m.bio}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/mentors/${mid}`}
                        className="shrink-0 inline-flex items-center bg-[color:var(--brand)] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:brightness-110"
                      >
                        View & book
                      </Link>
                    </div>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {servicesForMentor.map((sv) => (
                        <li
                          key={sv.id}
                          className="border rounded-xl p-3 bg-[color:var(--surface-2)]"
                        >
                          <p className="font-medium text-sm">{sv.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge tone="neutral">{sv.duration_min} min</Badge>
                            <Badge tone="success">Free</Badge>
                          </div>
                          {sv.description && (
                            <p className="text-xs text-[color:var(--muted)] mt-1 line-clamp-2">
                              {sv.description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </Container>
    </>
  )
}
