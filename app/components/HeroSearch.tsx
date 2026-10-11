'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function HeroSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        router.push(
          `/mentors${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`
        )
      }}
      className="flex items-center gap-2 p-1.5 rounded-2xl bg-[color:var(--surface)] border shadow-[var(--shadow-sm)] focus-within:ring-4 focus-within:ring-[color:var(--brand-ring)] transition"
    >
      <span className="pl-3 text-[color:var(--muted)]" aria-hidden>
        🔎
      </span>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Try &ldquo;career coach&rdquo; or &ldquo;React mentor&rdquo;"
        className="flex-1 bg-transparent outline-none px-2 py-3 text-base"
      />
      <button className="bg-[color:var(--brand)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110">
        Search
      </button>
    </form>
  )
}
