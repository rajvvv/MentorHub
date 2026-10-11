'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
        }))
      )
      setLoading(false)
    })()
  }, [router])

  if (loading) return <div className="p-8">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Messages</h1>
      {convs.length === 0 ? (
        <p className="text-gray-600">
          No messages yet. Open an advisor&apos;s profile and tap &ldquo;Message&rdquo;.
        </p>
      ) : (
        <ul className="divide-y border rounded-lg">
          {convs.map((c) => (
            <li key={c.otherId}>
              <Link
                href={`/messages/${c.otherId}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between gap-4">
                  <p className="font-semibold">{c.otherName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(c.lastAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-gray-700 truncate">{c.lastBody}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
