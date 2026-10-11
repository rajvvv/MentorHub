import { Suspense } from 'react'
import MessagesListClient from './MessagesListClient'

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <MessagesListClient />
    </Suspense>
  )
}
