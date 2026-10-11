'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function FavoriteButton({ mentorId }: { mentorId: string }) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [fav, setFav] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      if (user) {
        const { data } = await supabase
          .from('favorites')
          .select('mentor_id')
          .eq('seeker_id', user.id)
          .eq('mentor_id', mentorId)
          .maybeSingle()
        setFav(!!data)
      }
      setLoading(false)
    })()
  }, [mentorId])

  async function toggle() {
    if (!userId) {
      router.push('/login')
      return
    }
    if (fav) {
      setFav(false)
      await supabase
        .from('favorites')
        .delete()
        .eq('seeker_id', userId)
        .eq('mentor_id', mentorId)
    } else {
      setFav(true)
      await supabase.from('favorites').insert({
        seeker_id: userId,
        mentor_id: mentorId,
      })
    }
  }

  if (loading) return null

  return (
    <button
      onClick={toggle}
      aria-label={fav ? 'Remove favorite' : 'Save as favorite'}
      className={`border rounded-xl px-4 py-2 text-sm font-medium transition inline-flex items-center gap-1.5 ${
        fav
          ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200'
          : 'bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)]'
      }`}
    >
      <span className={fav ? 'text-red-600' : ''}>{fav ? '♥' : '♡'}</span>
      {fav ? 'Saved' : 'Save'}
    </button>
  )
}
