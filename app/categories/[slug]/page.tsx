import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const instant = false

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
        .in('id', mentorIds),
      supabase.from('reviews').select('mentor_id, rating').in('mentor_id', mentorIds),
    ])
    mentorMap = new Map(((ms ?? []) as Mentor[]).map((m) => [m.id, m]))
    for (const r of (revs ?? []) as ReviewRow[]) {
      const s = stats.get(r.mentor_id) ?? { avg: 0, count: 0 }
      const total = s.avg * s.count + r.rating
      s.count += 1
      s.avg = total / s.count
      stats.set(r.mentor_id, s)
    }
  }

  // group services by mentor
  const byMentor = new Map<string, Service[]>()
  for (const s of svList) {
    const list = byMentor.get(s.mentor_id) ?? []
    list.push(s)
    byMentor.set(s.mentor_id, list)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <nav className="text-sm">
        <Link href="/" className="underline text-gray-600">
          Home
        </Link>{' '}
        &rsaquo;{' '}
        <Link href="/mentors" className="underline text-gray-600">
          Advisors
        </Link>
      </nav>
      <h1 className="text-3xl font-bold mt-2">
        {category.icon} {category.name}
      </h1>
      <p className="text-gray-600 mt-1">
        {byMentor.size} advisor{byMentor.size === 1 ? '' : 's'} ·{' '}
        {svList.length} service{svList.length === 1 ? '' : 's'}
      </p>

      {byMentor.size === 0 ? (
        <p className="mt-8 text-gray-600">
          No one offers {category.name.toLowerCase()} services yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {Array.from(byMentor.entries()).map(([mid, servicesForMentor]) => {
            const m = mentorMap.get(mid)
            if (!m) return null
            const s = stats.get(mid)
            return (
              <li key={mid} className="border rounded-lg p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <Link
                      href={`/mentors/${mid}`}
                      className="text-lg font-semibold hover:underline"
                    >
                      {m.full_name}
                    </Link>
                    {m.bio && (
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                        {m.bio}
                      </p>
                    )}
                  </div>
                  {s && (
                    <span className="text-sm text-gray-600">
                      ★ {s.avg.toFixed(1)}{' '}
                      <span className="text-xs text-gray-500">({s.count})</span>
                    </span>
                  )}
                </div>
                <ul className="mt-3 divide-y border-t">
                  {servicesForMentor.map((sv) => (
                    <li key={sv.id} className="py-2 text-sm">
                      <p className="font-medium">{sv.title}</p>
                      <p className="text-xs text-gray-600">
                        {sv.duration_min} min · Free
                      </p>
                      {sv.description && (
                        <p className="text-gray-700 mt-1 line-clamp-2">
                          {sv.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/mentors/${mid}`}
                  className="inline-block mt-3 text-sm underline"
                >
                  View profile &amp; book →
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
