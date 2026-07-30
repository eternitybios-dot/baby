-- すくすくログ: 初期スキーマ + RLS
-- Supabase SQL Editor でこのファイルを実行してください。
-- Authentication > Providers > Anonymous を ON にしてください。

create extension if not exists pgcrypto;

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'メンバー',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- families
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists families_invite_code_idx on public.families (invite_code);

-- family_members
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (family_id, user_id)
);

create index if not exists family_members_user_active_idx
  on public.family_members (user_id)
  where left_at is null;

-- babies
create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  nickname text,
  birth_date date not null,
  sex text not null default 'unspecified'
    check (sex in ('female', 'male', 'other', 'unspecified')),
  birth_weight_g int,
  birth_height_cm numeric(5,1),
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists babies_family_idx on public.babies (family_id)
  where deleted_at is null;

-- care_records
create table if not exists public.care_records (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  baby_id uuid not null references public.babies (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  record_type text not null,
  recorded_at timestamptz not null,
  started_at timestamptz,
  ended_at timestamptz,
  note text,
  detail_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists care_records_family_recorded_idx
  on public.care_records (family_id, baby_id, recorded_at desc)
  where deleted_at is null;

-- growth_records
create table if not exists public.growth_records (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  baby_id uuid not null references public.babies (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  measured_at date not null,
  weight_g int,
  height_cm numeric(5,1),
  head_circumference_cm numeric(5,1),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- concerns
create table if not exists public.concerns (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  baby_id uuid not null references public.babies (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  title text not null,
  category text not null default 'その他',
  body text not null default '',
  severity int not null default 3 check (severity between 1 and 5),
  action_taken text,
  result text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'watching', 'resolved')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  baby_id uuid not null references public.babies (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  name text not null,
  category text not null default 'その他',
  body text not null default '',
  likely_time_of_day text not null default '',
  frequency text not null default '',
  effective_response text,
  last_confirmed_at date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- helpers
create or replace function public.is_family_member(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members m
    where m.family_id = p_family_id
      and m.user_id = auth.uid()
      and m.left_at is null
  );
$$;

create or replace function public.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.family_id
  from public.family_members m
  where m.user_id = auth.uid()
    and m.left_at is null
  order by m.joined_at desc
  limit 1;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'メンバー')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

-- RPC: create family
create or replace function public.create_family_with_baby(
  p_family_name text,
  p_display_name text,
  p_baby_name text,
  p_birth_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_family_id uuid;
  v_baby_id uuid;
  v_code text;
  v_tries int := 0;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
    set display_name = coalesce(nullif(trim(p_display_name), ''), display_name),
        updated_at = now()
  where id = v_uid;

  -- 既存の家族からは抜ける（1端末=1家族）
  update public.family_members
    set left_at = now()
  where user_id = v_uid
    and left_at is null;

  loop
    v_code := public.generate_invite_code();
    begin
      insert into public.families (name, invite_code)
      values (coalesce(nullif(trim(p_family_name), ''), 'わが家'), v_code)
      returning id into v_family_id;
      exit;
    exception when unique_violation then
      v_tries := v_tries + 1;
      if v_tries > 10 then
        raise exception 'failed to generate invite code';
      end if;
    end;
  end loop;

  insert into public.family_members (family_id, user_id, role)
  values (v_family_id, v_uid, 'owner');

  insert into public.babies (family_id, name, birth_date, sex)
  values (
    v_family_id,
    coalesce(nullif(trim(p_baby_name), ''), '赤ちゃん'),
    coalesce(p_birth_date, current_date),
    'unspecified'
  )
  returning id into v_baby_id;

  return jsonb_build_object(
    'family_id', v_family_id,
    'baby_id', v_baby_id,
    'invite_code', v_code
  );
end;
$$;

-- RPC: join family
create or replace function public.join_family_with_code(
  p_invite_code text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_family public.families%rowtype;
  v_baby_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_family
  from public.families
  where invite_code = upper(trim(p_invite_code));

  if not found then
    raise exception 'invalid invite code';
  end if;

  update public.profiles
    set display_name = coalesce(nullif(trim(p_display_name), ''), display_name),
        updated_at = now()
  where id = v_uid;

  update public.family_members
    set left_at = now()
  where user_id = v_uid
    and left_at is null
    and family_id <> v_family.id;

  insert into public.family_members (family_id, user_id, role)
  values (v_family.id, v_uid, 'member')
  on conflict (family_id, user_id) do update
    set left_at = null,
        role = excluded.role;

  select id into v_baby_id
  from public.babies
  where family_id = v_family.id
    and deleted_at is null
  order by created_at
  limit 1;

  return jsonb_build_object(
    'family_id', v_family.id,
    'baby_id', v_baby_id,
    'invite_code', v_family.invite_code
  );
end;
$$;

grant execute on function public.create_family_with_baby(text, text, text, date) to authenticated;
grant execute on function public.join_family_with_code(text, text) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.babies enable row level security;
alter table public.care_records enable row level security;
alter table public.growth_records enable row level security;
alter table public.concerns enable row level security;
alter table public.habits enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.family_members me
    join public.family_members other
      on other.family_id = me.family_id
     and other.left_at is null
    where me.user_id = auth.uid()
      and me.left_at is null
      and other.user_id = profiles.id
  )
);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

-- families
drop policy if exists families_select on public.families;
create policy families_select on public.families for select to authenticated
using (public.is_family_member(id));

drop policy if exists families_update on public.families;
create policy families_update on public.families for update to authenticated
using (
  exists (
    select 1 from public.family_members m
    where m.family_id = families.id
      and m.user_id = auth.uid()
      and m.role = 'owner'
      and m.left_at is null
  )
);

-- family_members
drop policy if exists family_members_select on public.family_members;
create policy family_members_select on public.family_members for select to authenticated
using (public.is_family_member(family_id));

-- babies / records policies
drop policy if exists babies_all on public.babies;
create policy babies_all on public.babies for all to authenticated
using (public.is_family_member(family_id) and deleted_at is null)
with check (public.is_family_member(family_id));

drop policy if exists care_records_all on public.care_records;
create policy care_records_all on public.care_records for all to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id) and user_id = auth.uid());

drop policy if exists care_records_update_family on public.care_records;
-- allow family members to update/delete any family record (shared editing)
drop policy if exists care_records_all on public.care_records;
create policy care_records_select on public.care_records for select to authenticated
using (public.is_family_member(family_id) and deleted_at is null);
create policy care_records_insert on public.care_records for insert to authenticated
with check (public.is_family_member(family_id) and user_id = auth.uid());
create policy care_records_update on public.care_records for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));
create policy care_records_delete on public.care_records for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists growth_records_select on public.growth_records;
create policy growth_records_select on public.growth_records for select to authenticated
using (public.is_family_member(family_id) and deleted_at is null);
create policy growth_records_insert on public.growth_records for insert to authenticated
with check (public.is_family_member(family_id) and user_id = auth.uid());
create policy growth_records_update on public.growth_records for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));
create policy growth_records_delete on public.growth_records for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists concerns_select on public.concerns;
create policy concerns_select on public.concerns for select to authenticated
using (public.is_family_member(family_id) and deleted_at is null);
create policy concerns_insert on public.concerns for insert to authenticated
with check (public.is_family_member(family_id) and user_id = auth.uid());
create policy concerns_update on public.concerns for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));
create policy concerns_delete on public.concerns for delete to authenticated
using (public.is_family_member(family_id));

drop policy if exists habits_select on public.habits;
create policy habits_select on public.habits for select to authenticated
using (public.is_family_member(family_id) and deleted_at is null);
create policy habits_insert on public.habits for insert to authenticated
with check (public.is_family_member(family_id) and user_id = auth.uid());
create policy habits_update on public.habits for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));
create policy habits_delete on public.habits for delete to authenticated
using (public.is_family_member(family_id));

-- Realtime（既に追加済みならスキップ）
do $$
declare
  t text;
begin
  foreach t in array array[
    'care_records',
    'growth_records',
    'concerns',
    'habits',
    'babies',
    'family_members',
    'profiles'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
