import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight">MentorHub</h1>
      <p className="mt-4 text-lg text-gray-600">
        Free 1-on-1 mentorship over video. Browse mentors, book a time, hop on a call.
      </p>
      <div className="mt-10 flex gap-3 justify-center flex-wrap">
        <Link
          href="/mentors"
          className="bg-black text-white px-6 py-3 rounded-lg"
        >
          Find a mentor
        </Link>
        <Link
          href="/login?role=mentor"
          className="border px-6 py-3 rounded-lg"
        >
          Become a mentor
        </Link>
      </div>
    </div>
  )
}
