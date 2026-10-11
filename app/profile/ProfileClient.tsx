'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AvailabilityManager from './AvailabilityManager'
import ServicesManager from './ServicesManager'
import { useToast } from '../components/Toast'
import { Avatar, Card, Container, Input, Label, Select, Textarea } from '../components/ui'

export default function ProfileClient() {
  const router = useRouter()
  const toast = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [topics, setTopics] = useState('')
  const [role, setRole] = useState<'seeker' | 'mentor'>('seeker')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      setEmail(user.email ?? '')
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setFullName(data.full_name ?? '')
        setBio(data.bio ?? '')
        setTopics((data.topics ?? []).join(', '))
        setRole(data.role ?? 'seeker')
      }
      setLoading(false)
    })()
  }, [router])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const topicsArr = topics.split(',').map((t) => t.trim()).filter(Boolean)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, bio, topics: topicsArr, role })
      .eq('id', user.id)
    setSaving(false)
    toast.show(error ? error.message : 'Profile saved', error ? 'error' : 'success')
  }

  if (loading)
    return (
      <Container className="py-10">
        <p className="text-[color:var(--muted)]">Loading…</p>
      </Container>
    )

  return (
    <Container size="lg" className="py-10">
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={fullName || 'U'} id={userId ?? undefined} size={64} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {fullName || 'Your profile'}
          </h1>
          <p className="text-[color:var(--muted)]">
            {role === 'mentor' ? 'Advisor' : 'Seeker'} · {email}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold">Basic info</h2>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              This is what seekers see when they visit your profile.
            </p>
            <form onSubmit={save} className="mt-5 space-y-4">
              <div>
                <Label>Full name</Label>
                <Input
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as 'seeker' | 'mentor')
                  }
                >
                  <option value="seeker">Seeker — I&apos;m looking for advice</option>
                  <option value="mentor">Advisor — I give advice</option>
                </Select>
              </div>
              <div>
                <Label>Short bio</Label>
                <Textarea
                  rows={4}
                  placeholder="Who are you? What do you help with?"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div>
                <Label>Topics</Label>
                <Input
                  placeholder="career, resumes, react, startup fundraising"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                />
                <p className="text-xs text-[color:var(--muted)] mt-1">
                  Comma-separated. Shown as tags on your profile.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[color:var(--brand)] text-white rounded-xl px-5 py-2.5 font-semibold hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </Card>

          {role === 'mentor' && userId && (
            <>
              <ServicesManager mentorId={userId} />
              <AvailabilityManager mentorId={userId} />
            </>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <h3 className="font-semibold">Tips for a great profile</h3>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
              <li>• Use a short, specific bio (1–2 sentences).</li>
              <li>• Pick 3–5 relevant topics.</li>
              <li>• List services with clear outcomes.</li>
              <li>• Add weekly slots so seekers can book.</li>
            </ul>
          </Card>
          <Card>
            <h3 className="font-semibold">Account</h3>
            <p className="text-sm text-[color:var(--muted)] mt-2">
              Signed in as <span className="font-medium">{email}</span>.
            </p>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/')
                router.refresh()
              }}
              className="mt-3 w-full border rounded-xl px-4 py-2 text-sm text-[color:var(--danger)] hover:bg-red-50"
            >
              Log out
            </button>
          </Card>
        </aside>
      </div>
    </Container>
  )
}
