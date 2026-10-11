-- Run this in the Supabase SQL editor once per project.

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
  slot_id uuid,
  created_at timestamptz default now()
);

create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references profiles(id) on delete cascade,
  starts_at timestamptz not null,
  duration_min int not null default 30 check (duration_min between 15 and 180),
  booking_id uuid unique references bookings(id) on delete set null,
  created_at timestamptz default now()
);

alter table bookings
  drop constraint if exists bookings_slot_fk,
  add constraint bookings_slot_fk foreign key (slot_id)
    references availability_slots(id) on delete set null;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  seeker_id uuid not null references profiles(id) on delete cascade,
  mentor_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

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
  for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table bookings enable row level security;
alter table availability_slots enable row level security;
alter table reviews enable row level security;

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
