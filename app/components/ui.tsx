import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

// -----------------------------------------------------------------------------
// Container
// -----------------------------------------------------------------------------
export function Container({
  children,
  size = 'md',
  className = '',
}: {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sz =
    size === 'sm'
      ? 'max-w-2xl'
      : size === 'lg'
        ? 'max-w-6xl'
        : size === 'xl'
          ? 'max-w-7xl'
          : 'max-w-4xl'
  return (
    <div className={`${sz} mx-auto px-4 sm:px-6 ${className}`}>{children}</div>
  )
}

// -----------------------------------------------------------------------------
// Avatar
// -----------------------------------------------------------------------------
function initials(name: string | null | undefined) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

function hashColor(seed: string) {
  // Deterministic hue [0, 360) from seed string
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const hue = h % 360
  return `hsl(${hue} 55% 55%)`
}

export function Avatar({
  name,
  id,
  size = 40,
  className = '',
  ring = false,
}: {
  name: string | null | undefined
  id?: string
  size?: number
  className?: string
  ring?: boolean
}) {
  const seed = id || name || 'u'
  // Deterministic 2-hue gradient for a polished look
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const hue1 = h % 360
  const hue2 = (hue1 + 40) % 360
  const bg = `linear-gradient(135deg, hsl(${hue1} 65% 52%), hsl(${hue2} 70% 46%))`
  return (
    <div
      aria-hidden
      className={`inline-grid place-items-center rounded-full text-white font-semibold select-none ${
        ring
          ? 'ring-2 ring-[color:var(--surface)] ring-offset-2 ring-offset-[color:var(--brand-soft)]'
          : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: Math.max(10, size * 0.38),
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
    >
      {initials(name)}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Button
// -----------------------------------------------------------------------------
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type BtnSize = 'sm' | 'md' | 'lg'

const btnBase =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl ' +
  'transition-colors focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand)] ' +
  'disabled:opacity-50 disabled:pointer-events-none'

function btnClasses(variant: BtnVariant, size: BtnSize) {
  const v =
    variant === 'primary'
      ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(79,70,229,0.4)] hover:from-indigo-500 hover:to-indigo-600 active:translate-y-px'
      : variant === 'danger'
        ? 'bg-[color:var(--danger)] text-white hover:brightness-110'
        : variant === 'success'
          ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(16,163,74,0.3)] hover:brightness-105 active:translate-y-px'
          : variant === 'ghost'
            ? 'bg-transparent hover:bg-[color:var(--surface-2)]'
            : 'bg-[color:var(--surface)] text-[color:var(--foreground)] border border-[color:var(--border)] hover:bg-[color:var(--surface-2)] hover:border-[color:var(--muted)]/30'
  const s =
    size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-6 py-3.5 text-base' : 'px-4 py-2.5 text-sm'
  return `${btnBase} ${v} ${s}`
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...rest
}: ComponentProps<'button'> & { variant?: BtnVariant; size?: BtnSize }) {
  return <button className={`${btnClasses(variant, size)} ${className}`} {...rest} />
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...rest
}: ComponentProps<typeof Link> & { variant?: BtnVariant; size?: BtnSize }) {
  return <Link className={`${btnClasses(variant, size)} ${className}`} {...rest} />
}

// -----------------------------------------------------------------------------
// Card
// -----------------------------------------------------------------------------
export function Card({
  children,
  className = '',
  hover = false,
  padded = true,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
  padded?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border bg-[color:var(--surface)] ${
        padded ? 'p-5' : ''
      } ${hover ? 'transition-shadow hover:shadow-[var(--shadow)]' : ''} ${className}`}
      style={{ borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Badge
// -----------------------------------------------------------------------------
type BadgeTone = 'neutral' | 'brand' | 'success' | 'danger' | 'warn' | 'info'

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-[color:var(--surface-2)] text-[color:var(--muted-strong)]',
    brand: 'bg-[color:var(--brand-soft)] text-[color:var(--brand)]',
    success: 'bg-[color:var(--success-soft)] text-[color:var(--success)]',
    danger: 'bg-[color:var(--danger-soft)] text-[color:var(--danger)]',
    warn: 'bg-[color:var(--warn-soft)] text-[color:var(--warn)]',
    info: 'bg-[color:var(--info-soft)] text-[color:var(--info)]',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

// -----------------------------------------------------------------------------
// Stars
// -----------------------------------------------------------------------------
export function Stars({
  value,
  count,
  size = 'sm',
}: {
  value: number
  count?: number
  size?: 'sm' | 'md'
}) {
  const px = size === 'md' ? 'text-base' : 'text-sm'
  return (
    <span className={`inline-flex items-center gap-1 ${px}`}>
      <span className="text-[color:var(--accent)]">★</span>
      <span className="font-semibold">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-[color:var(--muted)] text-xs">({count})</span>
      )}
    </span>
  )
}

// -----------------------------------------------------------------------------
// Section header
// -----------------------------------------------------------------------------
export function SectionTitle({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-[color:var(--muted)] mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Empty state
// -----------------------------------------------------------------------------
export function Empty({
  icon = '✨',
  title,
  body,
  action,
}: {
  icon?: string
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="text-center py-12 px-6 rounded-2xl border border-dashed">
      <div className="text-4xl">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      {body && <p className="text-[color:var(--muted)] mt-1 text-sm">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Input / Label (semantic styling)
// -----------------------------------------------------------------------------
export function Input(props: ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className={`w-full border rounded-xl px-3 py-2 ${props.className ?? ''}`}
    />
  )
}

export function Textarea(props: ComponentProps<'textarea'>) {
  return (
    <textarea
      {...props}
      className={`w-full border rounded-xl px-3 py-2 ${props.className ?? ''}`}
    />
  )
}

export function Select(props: ComponentProps<'select'>) {
  return (
    <select
      {...props}
      className={`w-full border rounded-xl px-3 py-2 bg-[color:var(--surface)] ${props.className ?? ''}`}
    />
  )
}

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold tracking-wide text-[color:var(--muted)] uppercase mb-1.5"
    >
      {children}
    </label>
  )
}
