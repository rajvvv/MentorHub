'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function MentorFilters({
  topics,
  q,
  topic,
}: {
  topics: string[]
  q: string
  topic: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState(q)

  function navigate(next: { q?: string; topic?: string }) {
    const params = new URLSearchParams()
    const nq = next.q ?? query
    const nt = next.topic ?? topic
    if (nq) params.set('q', nq)
    if (nt) params.set('topic', nt)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          navigate({ q: query })
        }}
        className="flex gap-2"
      >
        <input
          type="search"
          placeholder="Search by name or bio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border p-2 rounded"
        />
        <button type="submit" className="bg-black text-white px-4 rounded">
          Search
        </button>
        {(q || topic) && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              navigate({ q: '', topic: '' })
            }}
            className="border px-3 rounded text-sm"
          >
            Clear
          </button>
        )}
      </form>
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => {
            const active = t === topic
            return (
              <button
                key={t}
                onClick={() => navigate({ topic: active ? '' : t })}
                className={`text-xs px-2 py-1 rounded border ${
                  active ? 'bg-black text-white border-black' : 'bg-gray-50'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
