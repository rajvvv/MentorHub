import { createSupabaseServerClient } from '@/lib/supabase-server'

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  seeker: { full_name: string } | null
}

export default async function ReviewList({ mentorId }: { mentorId: string }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, seeker:seeker_id(full_name)')
    .eq('mentor_id', mentorId)
    .order('created_at', { ascending: false })

  const reviews = (data ?? []) as unknown as Review[]
  if (reviews.length === 0) return null

  const avg =
    reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  return (
    <div className="mt-10 border-t pt-6">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-xl font-semibold">Reviews</h2>
        <span className="text-sm text-gray-600">
          {avg.toFixed(1)} ★ · {reviews.length}
        </span>
      </div>
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="border rounded p-3">
            <p className="text-sm font-semibold">
              {'★'.repeat(r.rating)}
              {'☆'.repeat(5 - r.rating)}{' '}
              <span className="font-normal text-gray-600">
                — {r.seeker?.full_name ?? 'Anonymous'}
              </span>
            </p>
            {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
