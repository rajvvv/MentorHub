'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function MentorFilters({
  topics,
  q,
  topic,
  sort,
}: {
  topics: string[]
  q: string
  topic: string
  sort: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState(q)

  function navigate(next: { q?: string; topic?: string; sort?: string }) {
    const params = new URLSearchParams()
    const nq = next.q ?? query
    const nt = next.topic ?? topic
    const ns = next.sort ?? sort
    if (nq) params.set('q', nq)
    if (nt) params.set('topic', nt)
    if (ns && ns !== 'rated') params.set('sort', ns)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          navigate({ q: query })
        }}
        className="flex gap-2 items-center p-1.5 rounded-2xl border bg-[color:var(--surface)] shadow-[var(--shadow-sm)]"
      >
        <span className="pl-3 text-[color:var(--muted)]" aria-hidden>🔎</span>
        <input
          type="search"
          placeholder="Search by name or bio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none px-2 py-2.5"
        />
        <select
          value={sort}
          onChange={(e) => navigate({ sort: e.target.value })}
          className="hidden sm:block bg-transparent px-2 py-2 text-sm outline-none"
          aria-label="Sort advisors"
        >
          <option value="rated">Top rated</option>
          <option value="reviewed">Most reviewed</option>
          <option value="name">Name A–Z</option>
        </select>
        <button className="bg-[color:var(--brand)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110">
          Search
        </button>
        {(q || topic || (sort && sort !== 'rated')) && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              navigate({ q: '', topic: '', sort: 'rated' })
            }}
            className="hidden sm:inline-flex text-xs text-[color:var(--muted)] hover:underline px-2"
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
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? 'bg-[color:var(--brand)] text-white border-[color:var(--brand)]'
                    : 'bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)]'
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
