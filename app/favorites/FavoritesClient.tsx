'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Avatar, Card, Container, Empty } from '../components/ui'

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

  if (loading) return <Container className="py-10">Loading…</Container>

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight">Saved advisors</h1>
      <p className="text-[color:var(--muted)] mt-1 mb-6">
        Your shortlist. Nothing shared.
      </p>
      {mentors.length === 0 ? (
        <Empty
          icon="♡"
          title="No favorites yet"
          body='Tap "♡ Save" on any advisor&apos;s profile.'
          action={
            <Link
              href="/mentors"
              className="inline-flex items-center bg-[color:var(--brand)] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:brightness-110"
            >
              Browse advisors
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <li key={m.id}>
              <Link href={`/mentors/${m.id}`}>
                <Card hover className="h-full">
                  <div className="flex items-start gap-3">
                    <Avatar name={m.full_name} id={m.id} size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{m.full_name}</p>
                      {m.bio && (
                        <p className="text-sm text-[color:var(--muted)] mt-1 line-clamp-2">
                          {m.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
