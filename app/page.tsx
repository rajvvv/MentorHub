import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import HeroSearch from './components/HeroSearch'
import MentorCard from './components/MentorCard'
import { Avatar, Container, Stars } from './components/ui'
import { Icon } from './components/Icon'

type Category = {
  slug: string
  name: string
  icon: string | null
  sort_order: number
}

type Mentor = { id: string; full_name: string; bio: string | null }
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
  const mentorList = (mentors ?? []) as Mentor[]
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
  const spotlight = featured[0]

  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden brand-gradient border-b">
        <Container size="xl" className="relative py-16 sm:py-24 lg:py-28">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-[color:var(--surface)] border rounded-full px-3 py-1 text-xs font-medium text-[color:var(--muted-strong)] shadow-[var(--shadow-sm)]">
                <span className="w-1.5 h-1.5 bg-[color:var(--success)] rounded-full ring-pulse" />
                Free forever · no credit card
              </div>
              <h1 className="text-display mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                Advice from people who&apos;ve{' '}
                <span className="text-gradient">been there.</span>
              </h1>
              <p className="mt-6 text-lg text-[color:var(--muted-strong)] max-w-xl leading-relaxed">
                Book 1-on-1 video sessions with advisors across careers,
                coding, design, business, wellbeing — and more. Chat anytime.
                Call when you need to.
              </p>
              <div className="mt-8 max-w-xl">
                <HeroSearch />
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm">
                <div className="flex -space-x-2">
                  {mentorList.slice(0, 4).map((m) => (
                    <Avatar
                      key={m.id}
                      name={m.full_name}
                      id={m.id}
                      size={32}
                      className="ring-2 ring-[color:var(--surface)]"
                    />
                  ))}
                  {(adv ?? 0) > 4 && (
                    <div className="w-8 h-8 rounded-full border-2 border-[color:var(--surface)] bg-[color:var(--surface-2)] text-[11px] grid place-items-center font-semibold">
                      +{(adv ?? 0) - 4}
                    </div>
                  )}
                </div>
                <p className="text-[color:var(--muted-strong)]">
                  <strong className="text-[color:var(--foreground)]">
                    {adv ?? 0} advisors
                  </strong>{' '}
                  ready to help
                </p>
              </div>
            </div>

            {/* Floating preview card */}
            <div className="relative hidden lg:block">
              <div
                aria-hidden
                className="absolute -top-10 -right-10 w-72 h-72 rounded-full blob-float opacity-80"
                style={{
                  background:
                    'radial-gradient(closest-side, rgba(99,102,241,0.4), transparent 70%)',
                }}
              />
              <div
                aria-hidden
                className="absolute bottom-10 -left-10 w-64 h-64 rounded-full blob-float opacity-80"
                style={{
                  background:
                    'radial-gradient(closest-side, rgba(217,119,6,0.3), transparent 70%)',
                  animationDelay: '2s',
                }}
              />
              {spotlight && (
                <div className="relative rise-in">
                  {/* Primary card */}
                  <div className="relative z-20 rounded-3xl border bg-[color:var(--surface)] shadow-[var(--shadow-lg)] p-6">
                    <div className="flex items-start gap-4">
                      <Avatar
                        name={spotlight.full_name}
                        id={spotlight.id}
                        size={72}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-lg truncate">
                            {spotlight.full_name}
                          </p>
                          <Icon
                            name="check-circle"
                            size={16}
                            className="text-[color:var(--brand)]"
                          />
                        </div>
                        {spotlight.count > 0 ? (
                          <Stars
                            value={spotlight.avg}
                            count={spotlight.count}
                          />
                        ) : (
                          <p className="text-xs text-[color:var(--muted)]">
                            Top advisor
                          </p>
                        )}
                        <p className="text-sm text-[color:var(--muted)] mt-2 line-clamp-2">
                          {spotlight.bio ?? 'Available for calls today.'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand)] p-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Icon name="video" size={16} />
                          Call now
                        </div>
                      </div>
                      <div className="rounded-xl bg-[color:var(--surface-2)] p-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Icon name="message" size={16} />
                          Message
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative overlapping card */}
                  <div className="absolute -bottom-6 -right-6 z-10 rounded-2xl border bg-[color:var(--surface)] shadow-[var(--shadow)] p-4 w-56">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 grid place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Icon name="calendar" size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-[color:var(--muted)]">
                          Today
                        </p>
                        <p className="text-sm font-semibold">
                          Session at 4:00 PM
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-6 -left-6 z-10 rounded-2xl border bg-[color:var(--surface)] shadow-[var(--shadow)] p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 grid place-items-center rounded-lg bg-amber-50 text-amber-600">
                        <Icon name="star" size={14} />
                      </span>
                      <p className="text-xs font-semibold">
                        &ldquo;Life-changing session.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ================= VALUE PROPS ================= */}
      <section className="border-b">
        <Container size="xl" className="py-14">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: 'video' as const,
                title: 'Free video calls',
                body: 'Unlimited 1-on-1 video sessions powered by Jitsi. No download, no account, no cost.',
              },
              {
                icon: 'message' as const,
                title: 'Real-time chat',
                body: 'Keep the conversation going between calls. Delivered instantly, private between you two.',
              },
              {
                icon: 'shield' as const,
                title: 'Private by design',
                body: 'Row-level security on every table. Your messages and bookings stay between you.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-[color:var(--surface)] p-6"
              >
                <span className="w-11 h-11 grid place-items-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
                  <Icon name={f.icon} size={22} />
                </span>
                <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
                <p className="mt-1.5 text-sm text-[color:var(--muted)] leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section>
        <Container size="xl" className="py-16">
          <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-[color:var(--brand)]">
                Explore
              </p>
              <h2 className="text-display mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
                Browse by category
              </h2>
              <p className="text-[color:var(--muted)] mt-2 max-w-lg">
                Find the right fit by what you&apos;re working on.
              </p>
            </div>
            <Link
              href="/mentors"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--brand)] hover:gap-2 transition-all"
            >
              All advisors
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c, i) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="group block rounded-2xl border bg-[color:var(--surface)] p-5 card-hover relative overflow-hidden"
                >
                  <div
                    className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-30 transition-opacity"
                    style={{
                      background: `conic-gradient(from ${i * 45}deg, var(--brand), transparent)`,
                    }}
                  />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl bg-[color:var(--surface-2)] group-hover:bg-[color:var(--brand-soft)] transition-colors">
                      {c.icon}
                    </div>
                    <p className="mt-3 font-semibold">{c.name}</p>
                    <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                      Explore
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ================= FEATURED ADVISORS ================= */}
      {featured.length > 0 && (
        <section className="bg-[color:var(--surface-2)] border-y">
          <Container size="xl" className="py-16">
            <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-[color:var(--brand)]">
                  Spotlight
                </p>
                <h2 className="text-display mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
                  Top advisors this week
                </h2>
              </div>
              <Link
                href="/mentors"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--brand)] hover:gap-2 transition-all"
              >
                See all
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((m) => (
                <li key={m.id}>
                  <MentorCard
                    m={{
                      id: m.id,
                      full_name: m.full_name,
                      bio: m.bio,
                      topics: null,
                      avg: m.avg,
                      count: m.count,
                    }}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* ================= HOW IT WORKS ================= */}
      <section>
        <Container size="xl" className="py-16">
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs font-semibold tracking-wide uppercase text-[color:var(--brand)]">
              How it works
            </p>
            <h2 className="text-display mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
              Three steps to your first session
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3 relative">
            <div
              aria-hidden
              className="hidden md:block absolute left-[16.6%] right-[16.6%] top-[26px] h-px bg-gradient-to-r from-transparent via-[color:var(--border)] to-transparent"
            />
            {[
              {
                icon: 'search' as const,
                t: 'Find your advisor',
                b: 'Browse by category or search. See ratings and real reviews.',
              },
              {
                icon: 'calendar' as const,
                t: 'Book or message',
                b: 'Pick a slot in a service they offer, or chat first to vibe-check.',
              },
              {
                icon: 'video' as const,
                t: 'Meet on video',
                b: 'Join a free Jitsi call. No downloads. No cost.',
              },
            ].map((s, i) => (
              <div key={i} className="text-center relative">
                <div className="mx-auto w-14 h-14 relative">
                  <div className="w-14 h-14 rounded-2xl grid place-items-center bg-[color:var(--surface)] border-2 border-[color:var(--brand)] text-[color:var(--brand)] shadow-[var(--shadow-sm)]">
                    <Icon name={s.icon} size={22} strokeWidth={2.2} />
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[color:var(--brand)] text-white text-xs font-bold grid place-items-center shadow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-semibold text-lg">{s.t}</h3>
                <p className="text-sm text-[color:var(--muted)] mt-1.5 max-w-xs mx-auto leading-relaxed">
                  {s.b}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ================= CTA ================= */}
      <section>
        <Container size="xl" className="py-16">
          <div className="relative overflow-hidden rounded-3xl brand-mesh text-white p-10 sm:p-16">
            <div className="noise" />
            <div className="relative max-w-2xl">
              <h2 className="text-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
                Share what you know.<br />
                Help someone else leap.
              </h2>
              <p className="mt-5 text-indigo-100 text-lg leading-relaxed">
                Become an advisor in minutes. Set your availability.
                Earn trust through reviews. All free, forever.
              </p>
              <div className="mt-8 flex gap-3 flex-wrap">
                <Link
                  href="/login?role=mentor"
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 px-6 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
                >
                  Become an advisor
                  <Icon name="arrow-right" size={16} />
                </Link>
                <Link
                  href="/mentors"
                  className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  Find one first
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}
