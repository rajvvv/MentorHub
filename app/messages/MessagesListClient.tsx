'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Avatar, Container, Empty } from '../components/ui'

type Row = {
  id: string
  seeker_id: string
  mentor_id: string
  sender_id: string
  body: string
  created_at: string
}

type Conv = {
  otherId: string
  otherName: string
  lastBody: string
  lastAt: string
  mine: boolean
}

export default function MessagesListClient() {
  const router = useRouter()
  const [convs, setConvs] = useState<Conv[]>([])
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
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, seeker_id, mentor_id, sender_id, body, created_at')
        .or(`seeker_id.eq.${user.id},mentor_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      const rows = (msgs ?? []) as Row[]
      const byOther = new Map<string, Row>()
      for (const r of rows) {
        const otherId = r.seeker_id === user.id ? r.mentor_id : r.seeker_id
        if (!byOther.has(otherId)) byOther.set(otherId, r)
      }

      const otherIds = Array.from(byOther.keys())
      let names = new Map<string, string>()
      if (otherIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', otherIds)
        names = new Map(
          (profs ?? []).map((p) => [
            p.id as string,
            (p.full_name as string) ?? 'User',
          ])
        )
      }

      setConvs(
        Array.from(byOther.entries()).map(([otherId, r]) => ({
          otherId,
          otherName: names.get(otherId) ?? 'User',
          lastBody: r.body,
          lastAt: r.created_at,
          mine: r.sender_id === user.id,
        }))
      )
      setLoading(false)
    })()
  }, [router])

  if (loading) return <Container className="py-10">Loading…</Container>

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
      <p className="text-[color:var(--muted)] mt-1 mb-6">
        Your private 1-on-1 conversations.
      </p>
      {convs.length === 0 ? (
        <Empty
          icon="💬"
          title="No conversations yet"
          body='Open an advisor&apos;s profile and tap "Message".'
        />
      ) : (
        <ul className="divide-y border rounded-2xl overflow-hidden bg-[color:var(--surface)]">
          {convs.map((c) => (
            <li key={c.otherId}>
              <Link
                href={`/messages/${c.otherId}`}
                className="flex items-center gap-3 p-4 hover:bg-[color:var(--surface-2)] transition"
              >
                <Avatar name={c.otherName} id={c.otherId} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{c.otherName}</p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {new Date(c.lastAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-[color:var(--muted)] truncate">
                    {c.mine && 'You: '}
                    {c.lastBody}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
