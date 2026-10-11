# MentorHub

Minimal 1-on-1 mentorship platform. Next.js 14 + Supabase + Jitsi.

## Setup

1. Create a Supabase project at https://supabase.com.
2. In the SQL editor, run `supabase/schema.sql`.
3. Copy your project URL + anon key into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Install + run:
   ```bash
   npm install
   npm run dev
   ```

## Deploy

1. Push to GitHub.
2. Import on vercel.com.
3. Add the two `NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel dashboard.
4. Deploy.

## Pages

- `/` landing
- `/login` signup / login (role = seeker or mentor)
- `/mentors` list of mentors
- `/mentors/[id]` mentor profile + book
- `/dashboard` your bookings
- `/profile` edit profile
- `/call/[bookingId]` Jitsi video call
