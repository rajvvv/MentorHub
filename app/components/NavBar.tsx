'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => sub.subscription.unsubscribe()
  }, [pathname])

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
