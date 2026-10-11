'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import RequestCallButton from '../../components/RequestCallButton'
import { Avatar } from '../../components/ui'

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
        supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', otherId)
          .single(),
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
        .channel(`msgs-${seekerId}-${mentorId}-${crypto.randomUUID()}`)
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
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b bg-[color:var(--surface)]">
        <Link
          href="/messages"
          aria-label="Back"
          className="w-9 h-9 rounded-full grid place-items-center hover:bg-[color:var(--surface-2)]"
        >
          ←
        </Link>
        <Avatar name={otherName} id={otherId} size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{otherName}</p>
          <p className="text-xs text-[color:var(--muted)]">
            {me?.role === 'seeker' ? 'Advisor' : 'Seeker'}
          </p>
        </div>
        {me?.role === 'seeker' && (
          <RequestCallButton
            mentorId={otherId}
            label="📞 Call"
            className="bg-[color:var(--success)] text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:brightness-110"
          />
        )}
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-2 bg-[color:var(--surface-2)]"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)] text-center mt-10">
            Say hi 👋
          </p>
        ) : (
          messages.map((m, i) => {
            const mine = me && m.sender_id === me.id
            const prev = messages[i - 1]
            const sameSender = prev && prev.sender_id === m.sender_id
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2 text-sm shadow-sm ${
                    mine
                      ? 'bg-[color:var(--brand)] text-white rounded-2xl rounded-br-sm'
                      : 'bg-[color:var(--surface)] rounded-2xl rounded-bl-sm'
                  } ${sameSender ? 'mt-0.5' : 'mt-2'}`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      mine ? 'text-indigo-100' : 'text-[color:var(--muted)]'
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

      {/* Composer */}
      <form
        onSubmit={send}
        className="flex items-center gap-2 px-4 sm:px-6 py-3 border-t bg-[color:var(--surface)]"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border rounded-full px-4 py-2.5"
          maxLength={4000}
        />
        <button
          type="submit"
          disabled={!body.trim()}
          className="bg-[color:var(--brand)] text-white px-5 py-2.5 rounded-full font-semibold disabled:opacity-50 hover:brightness-110"
        >
          Send
        </button>
      </form>
    </div>
  )
}
