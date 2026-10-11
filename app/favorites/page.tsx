import { Suspense } from 'react'
import FavoritesClient from './FavoritesClient'

export const instant = false

export default function FavoritesPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <FavoritesClient />
    </Suspense>
  )
}
