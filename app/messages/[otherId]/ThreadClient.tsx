'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import RequestCallButton from '../../components/RequestCallButton'

type Msg = {
  id: string
  seeker_id: string
  mentor_id: string
  sender_id: string
  body: string
  created_at: string
}

export default function ThreadClient() {
  const router = useRouter()
  const { otherId } = useParams<{ otherId: string }>()
  const [me, setMe] = useState<{ id: string; role: 'seeker' | 'mentor' } | null>(null)
  const [otherName, setOtherName] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [{ data: myProfile }, { data: otherProfile }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).single(),
        supabase.from('profiles').select('full_name, role').eq('id', otherId).single(),
      ])

      if (!otherProfile) {
        setError('User not found')
        setLoading(false)
        return
      }

      const myRole = (myProfile?.role ?? 'seeker') as 'seeker' | 'mentor'
      const otherRole = otherProfile.role as 'seeker' | 'mentor'
      if (myRole === otherRole) {
        setError("You can't message someone with the same role.")
        setLoading(false)
        return
      }

      setMe({ id: user.id, role: myRole })
      setOtherName(otherProfile.full_name ?? 'User')

      const seekerId = myRole === 'seeker' ? user.id : otherId
      const mentorId = myRole === 'mentor' ? user.id : otherId

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('seeker_id', seekerId)
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: true })

      setMessages((msgs ?? []) as Msg[])
      setLoading(false)

      channel = supabase
        .channel(`msgs-${seekerId}-${mentorId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `seeker_id=eq.${seekerId}`,
          },
          (payload) => {
            const m = payload.new as Msg
            if (m.mentor_id !== mentorId) return
            setMessages((prev) =>
              prev.find((x) => x.id === m.id) ? prev : [...prev, m]
            )
          }
        )
        .subscribe()
    })()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [otherId, router])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!me || !body.trim()) return
    const seekerId = me.role === 'seeker' ? me.id : otherId
    const mentorId = me.role === 'mentor' ? me.id : otherId
    const text = body.trim()
    setBody('')
    const { error } = await supabase.from('messages').insert({
      seeker_id: seekerId,
      mentor_id: mentorId,
      sender_id: me.id,
      body: text,
    })
    if (error) {
      setError(error.message)
      setBody(text)
    }
  }

  if (loading) return <div className="p-8">Loading…</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-[calc(100vh-56px)]">
      <div className="flex items-center justify-between pb-3 border-b gap-3">
        <div>
          <Link href="/messages" className="text-sm underline">
            ← All messages
          </Link>
          <h1 className="text-xl font-bold">{otherName}</h1>
        </div>
        {me?.role === 'seeker' && (
          <RequestCallButton
            mentorId={otherId}
            label="📞 Call now"
            className="bg-green-600 text-white px-3 py-1.5 rounded text-sm"
          />
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 space-y-2"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">
            Say hi 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = me && m.sender_id === me.id
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    mine
                      ? 'bg-black text-white rounded-br-sm'
                      : 'bg-gray-100 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      mine ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 pt-3 border-t">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border p-2 rounded"
          maxLength={4000}
        />
        <button
          type="submit"
          disabled={!body.trim()}
          className="bg-black text-white px-4 rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
