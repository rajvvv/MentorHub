'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  if (
    pathname?.startsWith('/call/') ||
    pathname?.startsWith('/live-call/') ||
    pathname?.startsWith('/messages/')
  ) {
    return null
  }
  return (
    <footer className="mt-16 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg grid place-items-center text-white font-bold bg-gradient-to-br from-indigo-600 to-indigo-400">
              M
            </div>
            <span className="font-bold tracking-tight">MentorHub</span>
          </div>
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            Free 1-on-1 advice over chat and video.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold tracking-wide uppercase text-[color:var(--muted)]">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/mentors" className="hover:underline">Browse advisors</Link></li>
            <li><Link href="/categories/career" className="hover:underline">Career & Jobs</Link></li>
            <li><Link href="/categories/coding" className="hover:underline">Programming</Link></li>
            <li><Link href="/categories/business" className="hover:underline">Business</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold tracking-wide uppercase text-[color:var(--muted)]">For advisors</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/login?role=mentor" className="hover:underline">Become an advisor</Link></li>
            <li><Link href="/profile" className="hover:underline">Manage profile</Link></li>
            <li><Link href="/dashboard" className="hover:underline">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold tracking-wide uppercase text-[color:var(--muted)]">Support</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/login" className="hover:underline">Sign in</Link></li>
            <li><Link href="/forgot-password" className="hover:underline">Reset password</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-xs text-[color:var(--muted)] flex items-center justify-between flex-wrap gap-2">
          <p>© 2026 MentorHub. Free to use.</p>
          <p>Built with Next.js · Supabase · Jitsi</p>
        </div>
      </div>
    </footer>
  )
}
