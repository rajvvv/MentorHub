'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Avatar } from './ui'
import { Icon } from './Icon'

const LAST_SEEN_KEY = 'mh:lastMessagesSeenAt'

type Me = { id: string; name: string | null; role: string | null }

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [me, setMe] = useState<Me | null>(null)
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Auth state
  useEffect(() => {
    async function load(uid: string | null) {
      if (!uid) {
        setMe(null)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', uid)
        .single()
      setMe({ id: uid, name: data?.full_name ?? null, role: data?.role ?? null })
    }
    supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      load(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [pathname])

  // Realtime unread
  useEffect(() => {
    if (!me) {
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
        .or(`seeker_id.eq.${me!.id},mentor_id.eq.${me!.id}`)
        .neq('sender_id', me!.id)
        .gt('created_at', since)
      setUnread(count ?? 0)
    }
    refresh()

    channel = supabase
      .channel(`nav-unread-${me.id}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as {
            seeker_id: string
            mentor_id: string
            sender_id: string
          }
          if (m.sender_id === me.id) return
          if (m.seeker_id !== me.id && m.mentor_id !== me.id) return
          setUnread((n) => n + 1)
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [me])

  useEffect(() => {
    if (pathname?.startsWith('/messages')) {
      try {
        localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString())
      } catch {}
      setUnread(0)
    }
    setOpen(false)
    setMenuOpen(false)
  }, [pathname])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (pathname?.startsWith('/call/') || pathname?.startsWith('/live-call/'))
    return null

  const loggedIn = !!me

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const active =
      pathname === href || (href !== '/' && pathname?.startsWith(href))
    return (
      <Link
        href={href}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-[color:var(--brand-soft)] text-[color:var(--brand)]'
            : 'hover:bg-[color:var(--surface-2)]'
        }`}
      >
        {children}
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur-lg bg-[color:var(--background)]/80 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl grid place-items-center text-white font-bold bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 shadow-[0_1px_2px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] group-hover:brightness-110 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-[15px]">MentorHub</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/mentors">Advisors</NavLink>
            {loggedIn && <NavLink href="/favorites">Saved</NavLink>}
            {loggedIn && (
              <Link
                href="/messages"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                  pathname?.startsWith('/messages')
                    ? 'bg-[color:var(--brand-soft)] text-[color:var(--brand)]'
                    : 'hover:bg-[color:var(--surface-2)]'
                }`}
              >
                Messages
                {unread > 0 && (
                  <span className="bg-[color:var(--danger)] text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )}
            {loggedIn && <NavLink href="/dashboard">Dashboard</NavLink>}
          </nav>

          {/* Account */}
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border px-1 py-1 pr-3 hover:bg-[color:var(--surface-2)]"
                  aria-label="Open account menu"
                  aria-expanded={menuOpen}
                >
                  <Avatar name={me?.name ?? 'User'} id={me?.id} size={28} />
                  <span className="hidden sm:block text-sm max-w-[7rem] truncate">
                    {me?.name ?? 'Account'}
                  </span>
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-xl border bg-[color:var(--surface)] shadow-[var(--shadow)] overflow-hidden"
                  >
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-[color:var(--surface-2)]"
                    >
                      Profile & settings
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-[color:var(--surface-2)] md:hidden"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-[color:var(--surface-2)] text-[color:var(--danger)]"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3 py-2 text-sm font-medium rounded-lg hover:bg-[color:var(--surface-2)]"
                >
                  Log in
                </Link>
                <Link
                  href="/login?role=mentor"
                  className="inline-flex px-3 py-2 text-sm font-medium rounded-lg bg-[color:var(--brand)] text-white hover:brightness-110"
                >
                  Get started
                </Link>
              </>
            )}
            {/* Mobile menu */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-[color:var(--surface-2)]"
              aria-label="Open menu"
            >
              <Icon name={open ? 'close' : 'menu'} size={20} />
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-3 flex flex-col gap-1">
            <NavLink href="/mentors">Advisors</NavLink>
            {loggedIn && <NavLink href="/favorites">Saved</NavLink>}
            {loggedIn && (
              <Link
                href="/messages"
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-[color:var(--surface-2)] inline-flex items-center gap-2"
              >
                Messages
                {unread > 0 && (
                  <span className="bg-[color:var(--danger)] text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )}
            {loggedIn && <NavLink href="/dashboard">Dashboard</NavLink>}
          </div>
        )}
      </div>
    </header>
  )
}
