import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import HeroSearch from './components/HeroSearch'
import { Avatar, Badge, Card, Container, LinkButton, Stars } from './components/ui'

type Category = {
  slug: string
  name: string
  icon: string | null
  sort_order: number
}

type Featured = { id: string; full_name: string; bio: string | null }
type ReviewRow = { mentor_id: string; rating: number }

export default async function Home() {
  const supabase = await createSupabaseServerClient()

  const [{ data: cats }, { data: mentors }, { data: reviews }, { count: adv }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('slug, name, icon, sort_order')
        .order('sort_order'),
      supabase
        .from('profiles')
        .select('id, full_name, bio')
        .eq('role', 'mentor')
        .limit(12),
      supabase.from('reviews').select('mentor_id, rating'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'mentor'),
    ])

  const categories = (cats ?? []) as Category[]
  const mentorList = (mentors ?? []) as Featured[]
  const stats = new Map<string, { avg: number; count: number }>()
  for (const r of (reviews ?? []) as ReviewRow[]) {
    const s = stats.get(r.mentor_id) ?? { avg: 0, count: 0 }
    s.avg = (s.avg * s.count + r.rating) / (s.count + 1)
    s.count += 1
    stats.set(r.mentor_id, s)
  }
  const featured = mentorList
    .map((m) => ({ ...m, ...(stats.get(m.id) ?? { avg: 0, count: 0 }) }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, 6)

  return (
    <div>
      {/* HERO */}
      <section className="brand-gradient border-b">
        <Container size="lg" className="py-16 sm:py-24">
          <div className="max-w-3xl">
            <Badge tone="brand" className="mb-5">
              <span className="w-1.5 h-1.5 bg-[color:var(--brand)] rounded-full" />
              100% free · chat + video
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
              Talk to someone who&apos;s{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent">
                been there.
              </span>
            </h1>
            <p className="mt-5 text-lg text-[color:var(--muted)] max-w-xl">
              Book free 1-on-1 video sessions with advisors across careers,
              coding, design, business, wellbeing and more. Chat anytime.
              Hop on a call when it clicks.
            </p>
            <div className="mt-8 max-w-xl">
              <HeroSearch />
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm text-[color:var(--muted)]">
              <span>
                <strong className="text-[color:var(--foreground)]">
                  {adv ?? 0}
                </strong>{' '}
                advisors
              </span>
              <span>
                <strong className="text-[color:var(--foreground)]">
                  {categories.length}
                </strong>{' '}
                categories
              </span>
              <span>
                <strong className="text-[color:var(--foreground)]">
                  {reviews?.length ?? 0}
                </strong>{' '}
                reviews
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* CATEGORIES */}
      <section>
        <Container size="lg" className="py-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Browse by category
              </h2>
              <p className="text-[color:var(--muted)] mt-1">
                Find the right fit by what you&apos;re working on.
              </p>
            </div>
          </div>
          <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="group block rounded-2xl border bg-[color:var(--surface)] p-5 hover:border-[color:var(--brand)] hover:shadow-[var(--shadow)] transition-all"
                >
                  <div className="w-10 h-10 rounded-xl grid place-items-center text-2xl bg-[color:var(--surface-2)] group-hover:bg-[color:var(--brand-soft)] transition-colors">
                    {c.icon}
                  </div>
                  <p className="mt-3 font-semibold">{c.name}</p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    Explore →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section>
          <Container size="lg" className="py-6">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Top advisors
                </h2>
                <p className="text-[color:var(--muted)] mt-1">
                  Highly rated across the community.
                </p>
              </div>
              <Link
                href="/mentors"
                className="text-sm font-semibold text-[color:var(--brand)] hover:underline"
              >
                See all →
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((m) => (
                <li key={m.id}>
                  <Link href={`/mentors/${m.id}`}>
                    <Card hover className="h-full">
                      <div className="flex items-start gap-3">
                        <Avatar name={m.full_name} id={m.id} size={48} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {m.full_name}
                          </p>
                          {m.count > 0 ? (
                            <Stars value={m.avg} count={m.count} />
                          ) : (
                            <p className="text-xs text-[color:var(--muted)]">
                              New
                            </p>
                          )}
                        </div>
                      </div>
                      {m.bio && (
                        <p className="text-sm text-[color:var(--muted)] mt-3 line-clamp-3">
                          {m.bio}
                        </p>
                      )}
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="bg-[color:var(--surface-2)] border-t mt-10">
        <Container size="lg" className="py-16">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Three steps to your first session
            </h2>
            <p className="text-[color:var(--muted)] mt-2">
              Simple, free, and private.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { n: '01', t: 'Find your advisor', b: 'Browse by category or search. Read real reviews.', icon: '🔎' },
              { n: '02', t: 'Book or message', b: 'Pick a slot in a service they offer, or chat to vibe-check.', icon: '💬' },
              { n: '03', t: 'Meet on video', b: 'Join a free Jitsi call. No downloads. No cost.', icon: '🎥' },
            ].map((s) => (
              <Card key={s.n} className="h-full">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 grid place-items-center text-lg rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
                    {s.icon}
                  </span>
                  <span className="text-xs font-mono text-[color:var(--muted)]">
                    {s.n}
                  </span>
                </div>
                <p className="mt-4 font-semibold">{s.t}</p>
                <p className="text-sm text-[color:var(--muted)] mt-1">{s.b}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section>
        <Container size="lg" className="py-16">
          <div className="rounded-3xl p-10 sm:p-14 bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Share what you know. Help someone else leap.
              </h2>
              <p className="mt-3 text-indigo-100">
                Become an advisor in minutes. Set your availability. Earn
                trust through reviews.
              </p>
              <div className="mt-6 flex gap-3 flex-wrap">
                <LinkButton
                  href="/login?role=mentor"
                  variant="secondary"
                  size="lg"
                  className="!bg-white !text-indigo-700 !border-transparent"
                >
                  Become an advisor
                </LinkButton>
                <LinkButton
                  href="/mentors"
                  variant="ghost"
                  size="lg"
                  className="!text-white hover:!bg-white/10"
                >
                  Find one first
                </LinkButton>
              </div>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-amber-400/30 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/20 blur-2xl"
            />
          </div>
        </Container>
      </section>
    </div>
  )
}
