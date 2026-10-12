import Link from 'next/link'
import { Container } from './components/ui'

export default function NotFound() {
  return (
    <Container size="sm" className="py-24 text-center">
      <div className="brand-gradient inline-block rounded-3xl p-6 border mb-6">
        <p className="text-6xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent">
          404
        </p>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">We can&apos;t find that page</h1>
      <p className="text-[color:var(--muted)] mt-2">
        It might have been moved, or never existed. Let&apos;s get you back.
      </p>
      <div className="mt-6 flex gap-2 justify-center flex-wrap">
        <Link
          href="/"
          className="bg-[color:var(--brand)] text-white rounded-xl px-5 py-2.5 font-semibold hover:brightness-110"
        >
          Go home
        </Link>
        <Link
          href="/mentors"
          className="border rounded-xl px-5 py-2.5 font-medium hover:bg-[color:var(--surface-2)]"
        >
          Browse advisors
        </Link>
      </div>
    </Container>
  )
}
