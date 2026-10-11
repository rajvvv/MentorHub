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
    <form onSubmit={submit} className="mt-3 space-y-2 border-t pt-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            className="text-xl leading-none"
            aria-label={`${n} stars`}
          >
            {n <= rating ? '★' : '☆'}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="How was the session? (optional)"
        className="w-full border p-2 rounded text-sm"
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-3 py-1 rounded text-sm disabled:opacity-50"
      >
        {loading ? 'Posting…' : 'Submit review'}
      </button>
    </form>
  )
}
