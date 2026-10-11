import { Suspense } from 'react'
import LiveCallClient from './LiveCallClient'

export default function LiveCallPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <LiveCallClient />
    </Suspense>
  )
}
