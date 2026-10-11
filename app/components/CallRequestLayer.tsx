'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Request = {
  id: string
  seeker_id: string
  mentor_id: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'
  jitsi_room: string | null
  message: string | null
  created_at: string
  responded_at: string | null
}

const REQUEST_TIMEOUT_MS = 90_000

export default function CallRequestLayer() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [incoming, setIncoming] = useState<Request | null>(null)
  const [incomingName, setIncomingName] = useState<string>('')
  const [outgoing, setOutgoing] = useState<Request | null>(null)
  const [outgoingName, setOutgoingName] = useState<string>('')
  const ring = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserId(session?.user?.id ?? null)
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  // Subscribe to call_requests involving the user
  useEffect(() => {
    if (!userId) return
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function catchUp() {
      // Any pending request for me that I haven't yet responded to?
      const since = new Date(Date.now() - REQUEST_TIMEOUT_MS).toISOString()
      const { data } = await supabase
        .from('call_requests')
        .select('*')
        .eq('status', 'pending')
        .gte('created_at', since)
        .or(`seeker_id.eq.${userId},mentor_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(1)
      const r = (data?.[0] as Request | undefined) ?? null
      if (!r) return
      if (r.mentor_id === userId) await showIncoming(r)
      else setOutgoing(r)
    }
    catchUp()

    async function showIncoming(r: Request) {
      setIncoming(r)
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', r.seeker_id)
        .single()
      setIncomingName(data?.full_name ?? 'Someone')
      try {
        ring.current?.play().catch(() => {})
      } catch {}
    }

    async function showOutgoingName(r: Request) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', r.mentor_id)
        .single()
      setOutgoingName(data?.full_name ?? 'advisor')
    }

    channel = supabase
      .channel(`cr-${userId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_requests' },
        async (payload) => {
          const r = payload.new as Request
          if (r.mentor_id === userId && r.status === 'pending') {
            await showIncoming(r)
          } else if (r.seeker_id === userId && r.status === 'pending') {
            setOutgoing(r)
            await showOutgoingName(r)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'call_requests' },
        (payload) => {
          const r = payload.new as Request
          const forMe = r.mentor_id === userId || r.seeker_id === userId
          if (!forMe) return

          if (incoming?.id === r.id || (r.mentor_id === userId && r.status !== 'pending')) {
            setIncoming(null)
          }

          if (r.seeker_id === userId) {
            if (r.status === 'accepted' && r.jitsi_room) {
              setOutgoing(null)
              router.push(`/live-call/${r.id}`)
            } else if (r.status !== 'pending') {
              setOutgoing(null)
            }
          }
          if (r.mentor_id === userId && r.status === 'accepted' && r.jitsi_room) {
            router.push(`/live-call/${r.id}`)
          }
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Auto-expire outgoing after timeout
  useEffect(() => {
    if (!outgoing) return
    const age = Date.now() - new Date(outgoing.created_at).getTime()
    const remain = REQUEST_TIMEOUT_MS - age
    if (remain <= 0) {
      void cancelOutgoing(outgoing, 'expired')
      return
    }
    const id = setTimeout(() => void cancelOutgoing(outgoing, 'expired'), remain)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoing?.id])

  async function cancelOutgoing(r: Request, status: 'cancelled' | 'expired') {
    setOutgoing(null)
    await supabase
      .from('call_requests')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', r.id)
      .eq('status', 'pending')
  }

  async function respond(r: Request, status: 'accepted' | 'declined') {
    setIncoming(null)
    const update: {
      status: 'accepted' | 'declined'
      responded_at: string
      jitsi_room?: string
    } = {
      status,
      responded_at: new Date().toISOString(),
    }
    if (status === 'accepted') {
      update.jitsi_room = `mentorhub-live-${crypto.randomUUID()}`
    }
    const { data, error } = await supabase
      .from('call_requests')
      .update(update)
      .eq('id', r.id)
      .eq('status', 'pending')
      .select('*')
      .single()
    if (error || !data) return
    if (status === 'accepted') router.push(`/live-call/${r.id}`)
  }

  return (
    <>
      <audio
        ref={ring}
        preload="auto"
        src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
      />

      {incoming && (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-3 pointer-events-none">
          <div className="pointer-events-auto bg-white border shadow-xl rounded-xl p-4 max-w-md w-full flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 grid place-items-center animate-pulse">
              📞
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                Incoming call from {incomingName}
              </p>
              {incoming.message && (
                <p className="text-xs text-gray-600 truncate">
                  &ldquo;{incoming.message}&rdquo;
                </p>
              )}
            </div>
            <button
              onClick={() => respond(incoming, 'declined')}
              className="border px-3 py-1.5 rounded text-sm"
            >
              Decline
            </button>
            <button
              onClick={() => respond(incoming, 'accepted')}
              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {outgoing && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pointer-events-none">
          <div className="pointer-events-auto bg-black text-white rounded-xl px-4 py-3 flex items-center gap-4 shadow-xl max-w-md w-full">
            <div className="w-8 h-8 rounded-full bg-white/10 grid place-items-center animate-pulse">
              📞
            </div>
            <p className="flex-1 text-sm">
              Calling {outgoingName || 'advisor'}…
            </p>
            <button
              onClick={() => cancelOutgoing(outgoing, 'cancelled')}
              className="bg-red-600 px-3 py-1 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
