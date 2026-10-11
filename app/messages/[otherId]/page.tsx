import { Suspense } from 'react'
import ThreadClient from './ThreadClient'

export const instant = false

export default function ThreadPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <ThreadClient />
    </Suspense>
  )
}
