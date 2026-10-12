'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'

type Ctx = {
  online: Set<string>
  isOnline: (id?: string | null) => boolean
}

const PresenceCtx = createContext<Ctx>({
  online: new Set(),
  isOnline: () => false,
})

export function usePresence() {
  return useContext(PresenceCtx)
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState<Set<string>>(new Set())
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const subscribe = useCallback(async (userId: string) => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    const ch = supabase.channel('mh:presence', {
      config: { presence: { key: userId } },
    })
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, unknown[]>
      setOnline(new Set(Object.keys(state)))
    })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnline((s) => new Set(s).add(key))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnline((s) => {
          const n = new Set(s)
          n.delete(key)
          return n
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({ at: Date.now() })
        }
      })
    channelRef.current = ch
  }, [])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      if (data.user?.id) void subscribe(data.user.id)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user?.id) {
        void subscribe(session.user.id)
      } else {
        if (channelRef.current) {
          void supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }
        setOnline(new Set())
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [subscribe])

  return (
    <PresenceCtx.Provider
      value={{ online, isOnline: (id) => (id ? online.has(id) : false) }}
    >
      {children}
    </PresenceCtx.Provider>
  )
}

export function OnlineDot({
  userId,
  size = 10,
  label,
}: {
  userId: string
  size?: number
  label?: boolean
}) {
  const { isOnline } = usePresence()
  const on = isOnline(userId)
  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={on ? 'Online now' : 'Offline'}
    >
      <span
        aria-hidden
        className={on ? 'ring-pulse rounded-full' : 'rounded-full'}
        style={{
          width: size,
          height: size,
          background: on ? 'var(--success)' : '#cbd5e1',
          display: 'inline-block',
        }}
      />
      {label && (
        <span className="text-xs text-[color:var(--muted)]">
          {on ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  )
}
