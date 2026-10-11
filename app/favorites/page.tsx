import { Suspense } from 'react'
import FavoritesClient from './FavoritesClient'

export default function FavoritesPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <FavoritesClient />
    </Suspense>
  )
}
