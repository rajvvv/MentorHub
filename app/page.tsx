import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import HeroSearch from './components/HeroSearch'

export const instant = false

type Category = {
  slug: string
  name: string
  icon: string | null
  sort_order: number
}

type Featured = {
  id: string
  full_name: string
  bio: string | null
}

type ReviewRow = { mentor_id: string; rating: number }

export default async function Home() {
  const supabase = await createSupabaseServerClient()

  const [{ data: cats }, { data: mentors }, { data: reviews }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('slug, name, icon, sort_order')
        .order('sort_order'),
      supabase
        .from('profiles')
        .select('id, full_name, bio')
        .eq('role', 'mentor')
        .limit(6),
      supabase.from('reviews').select('mentor_id, rating'),
    ])

  const categories = (cats ?? []) as Category[]
  const mentorList = (mentors ?? []) as Featured[]
  const stats = new Map<string, { avg: number; count: number }>()
  for (const r of (reviews ?? []) as ReviewRow[]) {
    const s = stats.get(r.mentor_id) ?? { avg: 0, count: 0 }
    const total = s.avg * s.count + r.rating
    s.count += 1
    s.avg = total / s.count
    stats.set(r.mentor_id, s)
  }
  const featured = mentorList
    .map((m) => ({ ...m, ...(stats.get(m.id) ?? { avg: 0, count: 0 }) }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Advice from people who&apos;ve been there
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Book free 1-on-1 video sessions with mentors across careers, coding,
            design, business, wellbeing and more.
          </p>
          <div className="mt-8 max-w-xl mx-auto">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">Browse by category</h2>
        <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/categories/${c.slug}`}
                className="block border rounded-xl p-4 hover:shadow-sm hover:border-gray-400 transition"
              >
                <div className="text-3xl">{c.icon}</div>
                <p className="mt-2 font-semibold text-sm">{c.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-6">
          <h2 className="text-2xl font-bold mb-6">Top advisors</h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {featured.map((m) => (
              <li key={m.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{m.full_name}</h3>
                {m.count > 0 && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    ★ {m.avg.toFixed(1)} ({m.count})
                  </p>
                )}
                {m.bio && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                    {m.bio}
                  </p>
                )}
                <Link
                  href={`/mentors/${m.id}`}
                  className="inline-block mt-3 text-sm underline"
                >
                  View profile →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How it works */}
      <section className="bg-gray-50 border-t">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold mb-8 text-center">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: '1',
                t: 'Find your advisor',
                b: 'Browse by category or search by name. See ratings and real reviews.',
              },
              {
                n: '2',
                t: 'Book or message',
                b: 'Pick an open slot in a service they offer, or chat first to find your fit.',
              },
              {
                n: '3',
                t: 'Meet on video',
                b: 'Join a free Jitsi call. No downloads. No cost.',
              },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-black text-white grid place-items-center font-bold">
                  {s.n}
                </div>
                <p className="mt-3 font-semibold">{s.t}</p>
                <p className="text-sm text-gray-600 mt-1">{s.b}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex gap-3 justify-center flex-wrap">
            <Link
              href="/mentors"
              className="bg-black text-white px-6 py-3 rounded-lg"
            >
              Find an advisor
            </Link>
            <Link
              href="/login?role=mentor"
              className="border px-6 py-3 rounded-lg"
            >
              Become an advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
