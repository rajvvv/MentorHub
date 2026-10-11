-- Run this in the Supabase SQL editor. Idempotent — safe to re-run.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text not null default 'seeker' check (role in ('seeker','mentor')),
  bio text,
  topics text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references profiles(id) on delete cascade,
  mentor_id uuid not null references profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  jitsi_room text unique not null,
  status text not null default 'confirmed' check (status in ('confirmed','completed','cancelled')),
  notes text,
  created_at timestamptz default now()
);

-- Older bookings tables were created without slot_id; add it defensively
-- BEFORE any FK constraint references it.
alter table bookings add column if not exists slot_id uuid;

create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references profiles(id) on delete cascade,
  starts_at timestamptz not null,
  duration_min int not null default 30 check (duration_min between 15 and 180),
  booking_id uuid unique references bookings(id) on delete set null,
  created_at timestamptz default now()
);

-- Now that both the column and the referenced table exist, add the FK.
alter table bookings drop constraint if exists bookings_slot_fk;
alter table bookings add constraint bookings_slot_fk
  foreign key (slot_id) references availability_slots(id) on delete set null;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  seeker_id uuid not null references profiles(id) on delete cascade,
  mentor_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create table if not exists categories (
  slug text primary key,
  name text not null,
  icon text,
  sort_order int default 0
);

insert into categories (slug, name, icon, sort_order) values
  ('career',        'Career & Jobs',       '💼', 10),
  ('coding',        'Programming',         '💻', 20),
  ('design',        'Design & Creative',   '🎨', 30),
  ('business',      'Business & Startup',  '📈', 40),
  ('marketing',     'Marketing & Sales',   '📣', 50),
  ('finance',       'Finance & Investing', '💰', 60),
  ('education',     'Education & Tutoring','📚', 70),
  ('health',        'Health & Wellness',   '🧘', 80),
  ('relationships', 'Life & Relationships','❤️', 90),
  ('language',      'Languages',           '🌍', 100),
  ('other',         'Other',               '✨', 999)
on conflict (slug) do nothing;

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references profiles(id) on delete cascade,
  category_slug text not null references categories(slug),
  title text not null check (length(title) between 3 and 120),
  description text,
  duration_min int not null default 30 check (duration_min between 15 and 240),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists services_mentor_idx on services (mentor_id);
create index if not exists services_active_cat_idx
  on services (category_slug) where is_active;

alter table bookings add column if not exists service_id uuid;
alter table bookings drop constraint if exists bookings_service_fk;
alter table bookings add constraint bookings_service_fk
  foreign key (service_id) references services(id) on delete set null;

create table if not exists favorites (
  seeker_id uuid not null references profiles(id) on delete cascade,
  mentor_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (seeker_id, mentor_id)
);

create table if not exists call_requests (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references profiles(id) on delete cascade,
  mentor_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled','expired')),
  jitsi_room text,
  message text,
  created_at timestamptz default now(),
  responded_at timestamptz
);

create index if not exists call_requests_mentor_pending_idx
  on call_requests (mentor_id, created_at desc) where status = 'pending';
create index if not exists call_requests_seeker_pending_idx
  on call_requests (seeker_id, created_at desc) where status = 'pending';

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references profiles(id) on delete cascade,
  mentor_id uuid not null references profiles(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz default now()
);

create index if not exists messages_pair_time_idx
  on messages (seeker_id, mentor_id, created_at desc);

-- ============================================================
-- Auto-create a profile row when a new auth.users row appears.
-- security definer + empty search_path requires fully-qualified tables.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'seeker')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row-level security
-- ============================================================

alter table profiles enable row level security;
alter table bookings enable row level security;
alter table availability_slots enable row level security;
alter table reviews enable row level security;
alter table messages enable row level security;
alter table categories enable row level security;
alter table services enable row level security;
alter table favorites enable row level security;
alter table call_requests enable row level security;

drop policy if exists "profiles readable" on profiles;
drop policy if exists "update own profile" on profiles;
drop policy if exists "view own bookings" on bookings;
drop policy if exists "create booking" on bookings;
drop policy if exists "update own booking" on bookings;
drop policy if exists "slots readable" on availability_slots;
drop policy if exists "mentor manages own slots" on availability_slots;
drop policy if exists "mentor updates own slot" on availability_slots;
drop policy if exists "mentor deletes own slot" on availability_slots;
drop policy if exists "slot booked by seeker" on availability_slots;
drop policy if exists "reviews readable" on reviews;
drop policy if exists "seeker writes own review" on reviews;
drop policy if exists "view own messages" on messages;
drop policy if exists "send own messages" on messages;
drop policy if exists "categories readable" on categories;
drop policy if exists "services readable" on services;
drop policy if exists "mentor manages own services" on services;
drop policy if exists "mentor updates own service" on services;
drop policy if exists "mentor deletes own service" on services;
drop policy if exists "favorites readable to owner" on favorites;
drop policy if exists "insert own favorite" on favorites;
drop policy if exists "delete own favorite" on favorites;
drop policy if exists "view own call requests" on call_requests;
drop policy if exists "seeker creates call request" on call_requests;
drop policy if exists "parties update call request" on call_requests;

create policy "profiles readable" on profiles for select using (true);
create policy "update own profile" on profiles for update using (auth.uid() = id);

create policy "view own bookings" on bookings for select using (
  seeker_id = auth.uid() or mentor_id = auth.uid()
);
create policy "create booking" on bookings for insert with check (seeker_id = auth.uid());
create policy "update own booking" on bookings for update using (
  seeker_id = auth.uid() or mentor_id = auth.uid()
);

create policy "slots readable" on availability_slots for select using (true);
create policy "mentor manages own slots" on availability_slots for insert
  with check (mentor_id = auth.uid());
create policy "mentor updates own slot" on availability_slots for update
  using (mentor_id = auth.uid() or booking_id is not null);
create policy "mentor deletes own slot" on availability_slots for delete
  using (mentor_id = auth.uid() and booking_id is null);

create policy "reviews readable" on reviews for select using (true);
create policy "seeker writes own review" on reviews for insert
  with check (seeker_id = auth.uid());

create policy "view own messages" on messages for select using (
  seeker_id = auth.uid() or mentor_id = auth.uid()
);
create policy "send own messages" on messages for insert with check (
  sender_id = auth.uid()
  and (seeker_id = auth.uid() or mentor_id = auth.uid())
);

create policy "categories readable" on categories for select using (true);

create policy "services readable" on services for select using (true);
create policy "mentor manages own services" on services for insert
  with check (mentor_id = auth.uid());
create policy "mentor updates own service" on services for update
  using (mentor_id = auth.uid());
create policy "mentor deletes own service" on services for delete
  using (mentor_id = auth.uid());

create policy "favorites readable to owner" on favorites for select
  using (seeker_id = auth.uid());
create policy "insert own favorite" on favorites for insert
  with check (seeker_id = auth.uid());
create policy "delete own favorite" on favorites for delete
  using (seeker_id = auth.uid());

create policy "view own call requests" on call_requests for select using (
  seeker_id = auth.uid() or mentor_id = auth.uid()
);
create policy "seeker creates call request" on call_requests for insert
  with check (seeker_id = auth.uid());
create policy "parties update call request" on call_requests for update using (
  seeker_id = auth.uid() or mentor_id = auth.uid()
);

-- ============================================================
-- Enable realtime on messages (idempotent).
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'call_requests'
  ) then
    execute 'alter publication supabase_realtime add table public.call_requests';
  end if;
end $$;
