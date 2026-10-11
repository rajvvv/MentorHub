'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const JitsiMeeting = dynamic(
  () => import('@jitsi/react-sdk').then((m) => m.JitsiMeeting),
  { ssr: false }
)

export default function CallClient() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [room, setRoom] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()
      if (error || !data) {
        setError('Booking not found')
        return
      }
      if (data.seeker_id !== user.id && data.mentor_id !== user.id) {
        setError('Not authorized')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setDisplayName(profile?.full_name ?? user.email ?? 'Guest')
      setRoom(data.jitsi_room)
    })()
  }, [bookingId, router])

  if (error) return <div className="p-8">{error}</div>
  if (!room) return <div className="p-8">Loading…</div>

  return (
    <div style={{ height: '100vh' }}>
      <JitsiMeeting
        roomName={room}
        userInfo={{ displayName, email: '' }}
        configOverwrite={{
          startWithAudioMuted: true,
          prejoinPageEnabled: true,
        }}
        interfaceConfigOverwrite={{ DISABLE_JOIN_LEAVE_NOTIFICATIONS: true }}
        getIFrameRef={(node) => {
          node.style.height = '100vh'
        }}
        onApiReady={(api) =>
          api.addListener('videoConferenceLeft', () =>
            router.push('/dashboard')
          )
        }
      />
    </div>
  )
}
