import { Suspense } from 'react'
import ProfileClient from './ProfileClient'

export const instant = false

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <ProfileClient />
    </Suspense>
  )
}
