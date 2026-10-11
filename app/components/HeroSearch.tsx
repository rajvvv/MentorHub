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
        router.push(`/mentors${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
      }}
      className="flex gap-2"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Try &ldquo;career coach&rdquo; or &ldquo;React mentor&rdquo;"
        className="flex-1 border rounded-lg p-3"
      />
      <button className="bg-black text-white px-5 rounded-lg">Search</button>
    </form>
  )
}
