'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReviewForm({
  bookingId,
  mentorId,
  seekerId,
  onDone,
}: {
  bookingId: string
  mentorId: string
  seekerId: string
  onDone: () => void
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      mentor_id: mentorId,
      seeker_id: seekerId,
      rating,
      comment: comment || null,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    onDone()
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t pt-4">
      <div className="flex gap-1 items-center">
        <span className="text-xs font-semibold tracking-wide uppercase text-[color:var(--muted)] mr-2">
          Rating
        </span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            className="text-2xl leading-none hover:scale-110 transition-transform"
            aria-label={`${n} stars`}
          >
            <span
              className={
                n <= rating
                  ? 'text-[color:var(--accent)]'
                  : 'text-[color:var(--border)]'
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="How was the session? (optional)"
        className="w-full border rounded-xl px-3 py-2 text-sm"
      />
      {error && (
        <p className="text-xs bg-[color:var(--danger-soft)] text-[color:var(--danger)] rounded-xl p-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="bg-[color:var(--brand)] text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:brightness-110 disabled:opacity-50"
      >
        {loading ? 'Posting…' : 'Submit review'}
      </button>
    </form>
  )
}
