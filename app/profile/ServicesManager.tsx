'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '../components/Toast'
import { Card } from '../components/ui'

type Category = { slug: string; name: string; icon: string | null }
type Service = {
  id: string
  category_slug: string
  title: string
  description: string | null
  duration_min: number
  is_active: boolean
}

export default function ServicesManager({ mentorId }: { mentorId: string }) {
  const toast = useToast()
  const [cats, setCats] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Service | null>(null)
  const [draft, setDraft] = useState<Omit<Service, 'id' | 'is_active'>>({
    category_slug: 'career',
    title: '',
    description: '',
    duration_min: 30,
  })

  const load = useCallback(async () => {
    const [{ data: cs }, { data: sv }] = await Promise.all([
      supabase.from('categories').select('slug, name, icon').order('sort_order'),
      supabase
        .from('services')
        .select('id, category_slug, title, description, duration_min, is_active')
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false }),
    ])
    setCats((cs ?? []) as Category[])
    setServices((sv ?? []) as Service[])
    setLoading(false)
  }, [mentorId])

  useEffect(() => {
    load()
  }, [load])

  function startEdit(s: Service) {
    setEditing(s)
    setDraft({
      category_slug: s.category_slug,
      title: s.title,
      description: s.description ?? '',
      duration_min: s.duration_min,
    })
  }

  function cancel() {
    setEditing(null)
    setDraft({
      category_slug: cats[0]?.slug ?? 'career',
      title: '',
      description: '',
      duration_min: 30,
    })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      const { error } = await supabase
        .from('services')
        .update(draft)
        .eq('id', editing.id)
      toast.show(error ? error.message : 'Service updated', error ? 'error' : 'success')
    } else {
      const { error } = await supabase
        .from('services')
        .insert({ ...draft, mentor_id: mentorId })
      toast.show(error ? error.message : 'Service added', error ? 'error' : 'success')
    }
    cancel()
    load()
  }

  async function toggle(s: Service) {
    const { error } = await supabase
      .from('services')
      .update({ is_active: !s.is_active })
      .eq('id', s.id)
    if (error) toast.show(error.message, 'error')
    load()
  }

  async function remove(s: Service) {
    if (!confirm(`Delete "${s.title}"?`)) return
    const { error } = await supabase.from('services').delete().eq('id', s.id)
    toast.show(error ? error.message : 'Service deleted', error ? 'error' : 'success')
    load()
  }

  if (loading)
    return (
      <Card>
        <p className="text-sm text-[color:var(--muted)]">Loading services…</p>
      </Card>
    )

  return (
    <Card>
      <h2 className="text-lg font-bold">My services</h2>
      <p className="text-sm text-[color:var(--muted)] mt-1 mb-4">
        Package what you offer: a title, duration, and short pitch. Seekers book these directly.
      </p>

      <form onSubmit={save} className="border rounded-lg p-4 space-y-3 bg-gray-50">
        <h3 className="font-semibold text-sm">
          {editing ? 'Edit service' : 'New service'}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="e.g. Resume review & feedback"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="border p-2 rounded"
            maxLength={120}
          />
          <select
            value={draft.category_slug}
            onChange={(e) => setDraft({ ...draft, category_slug: e.target.value })}
            className="border p-2 rounded"
          >
            {cats.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <textarea
          rows={3}
          placeholder="What's included, who it's for, what the outcome is."
          value={draft.description ?? ''}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <div className="flex items-end gap-3">
          <label className="text-sm">
            Duration (minutes)
            <select
              value={draft.duration_min}
              onChange={(e) =>
                setDraft({ ...draft, duration_min: Number(e.target.value) })
              }
              className="block border p-2 rounded mt-1"
            >
              {[15, 30, 45, 60, 90, 120].map((n) => (
                <option key={n} value={n}>
                  {n} min
                </option>
              ))}
            </select>
          </label>
          <button className="bg-black text-white px-4 py-2 rounded">
            {editing ? 'Save changes' : 'Add service'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancel}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {services.length === 0 ? (
        <p className="text-sm text-gray-500 mt-4">No services yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {services.map((s) => {
            const cat = cats.find((c) => c.slug === s.category_slug)
            return (
              <li
                key={s.id}
                className="border rounded p-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <p className="font-semibold">
                    {s.title}{' '}
                    {!s.is_active && (
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded ml-1">
                        hidden
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600">
                    {cat?.icon} {cat?.name} · {s.duration_min} min
                  </p>
                  {s.description && (
                    <p className="text-sm text-gray-700 mt-1">{s.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-sm underline text-left"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggle(s)}
                    className="text-sm underline text-left"
                  >
                    {s.is_active ? 'Hide' : 'Unhide'}
                  </button>
                  <button
                    onClick={() => remove(s)}
                    className="text-sm underline text-left text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
