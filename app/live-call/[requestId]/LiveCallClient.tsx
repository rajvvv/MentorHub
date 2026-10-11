'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const JitsiMeeting = dynamic(
  () => import('@jitsi/react-sdk').then((m) => m.JitsiMeeting),
  { ssr: false }
)

export default function LiveCallClient() {
  const { requestId } = useParams<{ requestId: string }>()
  const router = useRouter()
  const [room, setRoom] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')

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
        .from('call_requests')
        .select('*')
        .eq('id', requestId)
        .single()
      if (error || !data) return setError('Call not found')
      if (data.seeker_id !== user.id && data.mentor_id !== user.id)
        return setError('Not authorized')
      if (data.status !== 'accepted' || !data.jitsi_room)
        return setError(`This call is ${data.status}.`)

      const { data: p } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setDisplayName(p?.full_name ?? user.email ?? 'Guest')
      setRoom(data.jitsi_room)
    })()
  }, [requestId, router])

  if (error) return <div className="p-8">{error}</div>
  if (!room) return <div className="p-8">Connecting…</div>

  return (
    <div style={{ height: '100vh' }}>
      <JitsiMeeting
        roomName={room}
        userInfo={{ displayName, email: '' }}
        configOverwrite={{
          startWithAudioMuted: false,
          prejoinPageEnabled: false,
        }}
        interfaceConfigOverwrite={{ DISABLE_JOIN_LEAVE_NOTIFICATIONS: true }}
        getIFrameRef={(node) => {
          node.style.height = '100vh'
        }}
        onApiReady={(api) =>
          api.addListener('videoConferenceLeft', () => router.push('/dashboard'))
        }
      />
    </div>
  )
}
