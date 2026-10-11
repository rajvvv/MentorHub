# MentorHub

Free 1-on-1 advisory / counselling platform. Browse advisors, chat in real time, book a session, join a free video call.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth + Realtime) · Jitsi (`@jitsi/react-sdk`). **100% free hosting** on Vercel + Supabase free tier + Jitsi public meet.jit.si.

## Features

- Email/password auth, role picker (seeker / advisor) at signup
- Advisor directory with search and topic filters
- Advisor profiles with bio, topics, ratings and reviews
- Advisor-defined availability slots (prevents double-booking)
- Real-time 1-on-1 chat between seeker and advisor
- Free Jitsi video call per booking
- Dashboard: separate Seeker / Advisor tabs, cancel, mark completed, leave review
- Row-level security on every table

## Local setup

```bash
npm install
cp .env.example .env.local        # paste your Supabase URL + anon key
```

1. Create a Supabase project at https://supabase.com (free tier is enough).
2. SQL editor → paste all of [`supabase/schema.sql`](supabase/schema.sql) → run. (Idempotent — safe to re-run on updates.)
3. Authentication → Providers → Email → turn **"Confirm email"** off for fast local testing (keep on in prod).
4. `npm run dev` → http://localhost:3000.

## Deploy (free)

### Supabase (free, 500 MB, 50k monthly auth users)

Already covered by the local setup — the same project serves prod.

### Vercel (free hobby plan)

```bash
git push                        # push the mentorhub/ folder to GitHub
```

1. vercel.com → **Add New → Project** → import your GitHub repo.
2. Framework preset: Next.js (auto-detected).
3. Add env vars (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

### Supabase auth URL config

Once deployed, Supabase → Authentication → URL Configuration:
- **Site URL:** your Vercel URL (e.g. `https://mentorhub.vercel.app`)
- **Redirect URLs:** add that same URL + `/**`.

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing |
| `/login` | Signup / login (role: seeker or advisor) |
| `/mentors` | Advisor directory with search + topic filters |
| `/mentors/[id]` | Advisor profile, booking form, reviews, "Message" link |
| `/profile` | Edit profile; advisors manage availability slots here |
| `/messages` | Conversation list |
| `/messages/[otherId]` | Realtime 1-on-1 chat |
| `/dashboard` | Bookings (Seeker + Advisor tabs), cancel, mark complete, review |
| `/call/[bookingId]` | Jitsi video call |

## Monetization path (planned v2)

Everything stays free until there's traction. Then stack Stripe on top of Supabase Auth:
- Add `subscriptions` table keyed by `user_id`
- Server-side webhook from Stripe → upsert row
- Gate "unlimited bookings" / "priority search placement" / "custom branding" behind an active plan

The current data model (profiles, bookings, slots, reviews, messages) already supports this without a schema change.
