import Link from 'next/link'
import { Avatar, Stars } from './ui'
import { OnlineDot } from './Presence'
import { Icon } from './Icon'

export type MentorCardData = {
  id: string
  full_name: string
  bio: string | null
  topics: string[] | null
  avg?: number
  count?: number
  services?: number
}

export default function MentorCard({ m }: { m: MentorCardData }) {
  return (
    <Link
      href={`/mentors/${m.id}`}
      className="group block rounded-2xl bg-[color:var(--surface)] border p-5 card-hover"
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar name={m.full_name} id={m.id} size={56} />
          <span className="absolute -bottom-0.5 -right-0.5 bg-[color:var(--surface)] rounded-full p-0.5">
            <OnlineDot userId={m.id} size={12} />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-[15px] truncate">{m.full_name}</p>
            {m.count && m.count >= 5 && (
              <span
                className="inline-flex items-center text-[color:var(--brand)]"
                title="Verified advisor"
              >
                <Icon name="check-circle" size={14} strokeWidth={2.5} />
              </span>
            )}
          </div>
          {m.count !== undefined && m.count > 0 ? (
            <div className="mt-0.5">
              <Stars value={m.avg ?? 0} count={m.count} />
            </div>
          ) : (
            <p className="text-xs text-[color:var(--muted)] mt-0.5">
              New advisor
            </p>
          )}
        </div>
      </div>

      {m.bio && (
        <p className="text-sm text-[color:var(--muted)] mt-3 line-clamp-2 leading-relaxed">
          {m.bio}
        </p>
      )}

      {m.topics && m.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {m.topics.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-xs bg-[color:var(--surface-2)] text-[color:var(--muted-strong)] px-2 py-0.5 rounded-full border"
            >
              {t}
            </span>
          ))}
          {m.topics.length > 3 && (
            <span className="text-xs text-[color:var(--muted)] self-center">
              +{m.topics.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <span className="text-xs text-[color:var(--muted)]">
          {m.services ? `${m.services} service${m.services === 1 ? '' : 's'}` : 'Free'}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--brand)] group-hover:gap-2 transition-all">
          View profile
          <Icon name="arrow-right" size={14} />
        </span>
      </div>
    </Link>
  )
}
