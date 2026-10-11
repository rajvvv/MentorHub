'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from './Toast'

export default function RequestCallButton({
  mentorId,
  label = '📞 Request video call now',
  className = 'bg-green-600 text-white px-4 py-2 rounded text-sm',
}: {
  mentorId: string
  label?: string
  className?: string
}) {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  async function send() {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      if (user.id === mentorId) throw new Error("You can't call yourself.")

      const { error } = await supabase.from('call_requests').insert({
        seeker_id: user.id,
        mentor_id: mentorId,
        status: 'pending',
      })
      if (error) throw error
      toast.show('Ringing… waiting for them to accept.', 'info')
    } catch (err: unknown) {
      toast.show(err instanceof Error ? err.message : 'Could not send request', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={send} disabled={loading} className={className}>
      {loading ? 'Calling…' : label}
    </button>
  )
}
