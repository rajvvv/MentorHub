import { Suspense } from 'react'
import CallClient from './CallClient'

export const instant = false

export default function CallPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <CallClient />
    </Suspense>
  )
}
