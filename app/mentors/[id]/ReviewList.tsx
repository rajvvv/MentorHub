import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Avatar, Card } from '../../components/ui'

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  seeker: { full_name: string } | null
  seeker_id: string
}

export default async function ReviewList({ mentorId }: { mentorId: string }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('reviews')
    .select(
      'id, rating, comment, created_at, seeker_id, seeker:seeker_id(full_name)'
    )
    .eq('mentor_id', mentorId)
    .order('created_at', { ascending: false })

  const reviews = (data ?? []) as unknown as Review[]
  if (reviews.length === 0) return null

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Reviews</h2>
        <span className="text-sm text-[color:var(--muted)]">
          <span className="text-[color:var(--accent)]">★</span>{' '}
          <span className="font-semibold text-[color:var(--foreground)]">
            {avg.toFixed(1)}
          </span>{' '}
          · {reviews.length} review{reviews.length === 1 ? '' : 's'}
        </span>
      </div>
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id}>
            <Card>
              <div className="flex items-start gap-3">
                <Avatar
                  name={r.seeker?.full_name ?? 'Anonymous'}
                  id={r.seeker_id}
                  size={36}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">
                      {r.seeker?.full_name ?? 'Anonymous'}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-[color:var(--accent)]">
                    {'★'.repeat(r.rating)}
                    <span className="text-[color:var(--muted)]">
                      {'★'.repeat(5 - r.rating)}
                    </span>
                  </p>
                  {r.comment && (
                    <p className="text-sm mt-1 text-[color:var(--foreground)]">
                      {r.comment}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
