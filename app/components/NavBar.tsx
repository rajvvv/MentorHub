'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const LAST_SEEN_KEY = 'mh:lastMessagesSeenAt'

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [pathname])

  useEffect(() => {
    if (!userId) {
      setUnread(0)
      return
    }
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function refresh() {
      let since = '1970-01-01'
      try {
        since = localStorage.getItem(LAST_SEEN_KEY) ?? since
      } catch {}
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .or(`seeker_id.eq.${userId},mentor_id.eq.${userId}`)
        .neq('sender_id', userId)
        .gt('created_at', since)
      setUnread(count ?? 0)
    }

    refresh()

    channel = supabase
      .channel(`nav-unread-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as {
            seeker_id: string
            mentor_id: string
            sender_id: string
          }
          if (m.sender_id === userId) return
          if (m.seeker_id !== userId && m.mentor_id !== userId) return
          setUnread((n) => n + 1)
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    if (pathname?.startsWith('/messages')) {
      try {
        localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString())
      } catch {}
      setUnread(0)
    }
  }, [pathname])

  const loggedIn = !!userId

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (pathname?.startsWith('/call/')) return null

  return (
    <nav className="border-b">
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-between flex-wrap gap-2">
        <Link href="/" className="font-bold text-lg">
          MentorHub
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/mentors" className="hover:underline">
            Mentors
          </Link>
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <Link
                href="/messages"
                className="hover:underline relative inline-flex items-center gap-1"
              >
                Messages
                {unread > 0 && (
                  <span className="bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="hover:underline">
                Profile
              </Link>
              <button onClick={logout} className="hover:underline">
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:underline">
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
