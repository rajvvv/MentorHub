import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight">MentorHub</h1>
      <p className="mt-4 text-lg text-gray-600">
        Free 1-on-1 advisory and counselling. Browse advisors, message them,
        book a time, and hop on a free video call.
      </p>
      <div className="mt-10 flex gap-3 justify-center flex-wrap">
        <Link href="/mentors" className="bg-black text-white px-6 py-3 rounded-lg">
          Find an advisor
        </Link>
        <Link href="/login?role=mentor" className="border px-6 py-3 rounded-lg">
          Become an advisor
        </Link>
      </div>
      <div className="mt-16 grid sm:grid-cols-3 gap-6 text-left">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold">💬 Chat</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time messaging with your advisor between sessions.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold">📅 Book</h2>
          <p className="text-sm text-gray-600 mt-1">
            Pick an open time slot that fits your schedule.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold">🎥 Call</h2>
          <p className="text-sm text-gray-600 mt-1">
            Free video calls powered by Jitsi — no accounts, no limits.
          </p>
        </div>
      </div>
    </div>
  )
}
