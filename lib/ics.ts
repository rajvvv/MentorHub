export function downloadIcs(opts: {
  id: string
  title: string
  description?: string
  startISO: string
  durationMin: number
  url?: string
}) {
  const start = new Date(opts.startISO)
  const end = new Date(start.getTime() + opts.durationMin * 60_000)
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const escape = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MentorHub//EN',
    'BEGIN:VEVENT',
    `UID:${opts.id}@mentorhub`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escape(opts.title)}`,
    opts.description ? `DESCRIPTION:${escape(opts.description)}` : '',
    opts.url ? `URL:${opts.url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${opts.title.replace(/[^a-z0-9]+/gi, '-')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
