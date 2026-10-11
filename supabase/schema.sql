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

drop policy if exists "profiles readable" on profiles;
drop policy if exists "update own profile" on profiles;
drop policy if exists "view own bookings" on bookings;
drop policy if exists "create booking" on bookings;
drop policy if exists "update own booking" on bookings;

create policy "profiles readable" on profiles for select using (true);
create policy "update own profile" on profiles for update using (auth.uid() = id);

create policy "view own bookings" on bookings for select using (
  seeker_id = auth.uid() or mentor_id = auth.uid()
);
create policy "create booking" on bookings for insert with check (seeker_id = auth.uid());
create policy "update own booking" on bookings for update using (
  seeker_id = auth.uid() or mentor_id = auth.uid()
);
