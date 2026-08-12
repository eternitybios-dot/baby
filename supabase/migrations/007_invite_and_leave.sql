-- 007: 招待コード強化・再発行・家族退出・参加レート制限
-- SQL Editor で実行してください。

alter table public.families
  add column if not exists invite_code_expires_at timestamptz;

-- 既存コードは 30 日後まで有効にする
update public.families
set invite_code_expires_at = now() + interval '30 days'
where invite_code_expires_at is null;

create table if not exists public.invite_join_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists invite_join_attempts_user_idx
  on public.invite_join_attempts (user_id, attempted_at desc);

alter table public.invite_join_attempts enable row level security;

-- 本人以外は読めない（RPC は security definer）
drop policy if exists invite_join_attempts_select on public.invite_join_attempts;
create policy invite_join_attempts_select on public.invite_join_attempts
for select to authenticated
using (user_id = auth.uid());

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..10 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

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
  v_recent int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.invite_join_attempts (user_id) values (v_uid);
  select count(*) into v_recent
  from public.invite_join_attempts
  where user_id = v_uid
    and attempted_at > now() - interval '15 minutes';
  if v_recent > 8 then
    raise exception 'too many join attempts';
  end if;

  select * into v_family
  from public.families
  where invite_code = upper(trim(p_invite_code));

  if not found then
    raise exception 'invalid invite code';
  end if;

  if v_family.invite_code_expires_at is not null
     and v_family.invite_code_expires_at < now() then
    raise exception 'invite code expired';
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

create or replace function public.rotate_invite_code()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_family_id uuid;
  v_code text;
  v_tries int := 0;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select family_id into v_family_id
  from public.family_members
  where user_id = v_uid
    and left_at is null
  order by joined_at desc
  limit 1;

  if v_family_id is null then
    raise exception 'not a family member';
  end if;

  loop
    v_code := public.generate_invite_code();
    begin
      update public.families
        set invite_code = v_code,
            invite_code_expires_at = now() + interval '30 days',
            updated_at = now()
      where id = v_family_id;
      exit;
    exception when unique_violation then
      v_tries := v_tries + 1;
      if v_tries > 10 then
        raise exception 'failed to generate invite code';
      end if;
    end;
  end loop;

  return jsonb_build_object(
    'invite_code', v_code,
    'expires_at', (now() + interval '30 days')
  );
end;
$$;

create or replace function public.leave_current_family()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update public.family_members
    set left_at = now()
  where user_id = v_uid
    and left_at is null;
end;
$$;

grant execute on function public.join_family_with_code(text, text) to authenticated;
grant execute on function public.rotate_invite_code() to authenticated;
grant execute on function public.leave_current_family() to authenticated;
