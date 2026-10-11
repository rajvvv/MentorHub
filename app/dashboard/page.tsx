import { Suspense } from 'react'
import DashboardClient from './DashboardClient'

export const instant = false

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <DashboardClient />
    </Suspense>
  )
}
