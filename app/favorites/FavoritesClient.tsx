'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Mentor = {
  id: string
  full_name: string
  bio: string | null
  topics: string[] | null
}

export default function FavoritesClient() {
  const router = useRouter()
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: favs } = await supabase
        .from('favorites')
        .select('mentor_id')
        .eq('seeker_id', user.id)
      const ids = (favs ?? []).map((f) => f.mentor_id as string)
      if (ids.length === 0) {
        setMentors([])
        setLoading(false)
        return
      }
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, bio, topics')
        .in('id', ids)
      setMentors((profs ?? []) as Mentor[])
      setLoading(false)
    })()
  }, [router])

  if (loading) return <div className="p-8">Loading…</div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Saved advisors</h1>
      {mentors.length === 0 ? (
        <p className="text-gray-600">
          No favorites yet. Tap &ldquo;♡ Save&rdquo; on any advisor&apos;s profile.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {mentors.map((m) => (
            <li key={m.id} className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold">{m.full_name}</h2>
              {m.bio && <p className="text-sm text-gray-700 mt-1">{m.bio}</p>}
              <Link
                href={`/mentors/${m.id}`}
                className="inline-block mt-2 text-sm underline"
              >
                View &amp; book →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
