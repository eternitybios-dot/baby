-- 008: 家族メンバー（作成者を含む）を外せるようにする
-- 作成者を外した場合は、操作した人（または残った最古のメンバー）が作成者になる。
-- SQL Editor で実行してください。

create or replace function public.promote_family_successor(
  p_family_id uuid,
  p_leaving_user_id uuid,
  p_preferred_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_successor uuid;
begin
  if exists (
    select 1
    from public.family_members
    where family_id = p_family_id
      and user_id = p_leaving_user_id
      and left_at is null
      and role = 'owner'
  ) then
    if p_preferred_user_id is not null
       and p_preferred_user_id <> p_leaving_user_id
       and exists (
         select 1
         from public.family_members
         where family_id = p_family_id
           and user_id = p_preferred_user_id
           and left_at is null
       ) then
      v_successor := p_preferred_user_id;
    else
      select user_id into v_successor
      from public.family_members
      where family_id = p_family_id
        and left_at is null
        and user_id <> p_leaving_user_id
      order by joined_at asc
      limit 1;
    end if;

    if v_successor is not null then
      update public.family_members
        set role = 'owner'
      where family_id = p_family_id
        and user_id = v_successor
        and left_at is null;
    end if;
  end if;
end;
$$;

create or replace function public.remove_family_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_family_id uuid;
  v_target_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_user_id is null then
    raise exception 'user required';
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

  select user_id into v_target_id
  from public.family_members
  where family_id = v_family_id
    and user_id = p_user_id
    and left_at is null;

  if v_target_id is null then
    raise exception 'member not found';
  end if;

  perform public.promote_family_successor(v_family_id, p_user_id, v_uid);

  update public.family_members
    set left_at = now(),
        role = 'member'
  where family_id = v_family_id
    and user_id = p_user_id
    and left_at is null;
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
  v_family_id uuid;
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
    return;
  end if;

  perform public.promote_family_successor(v_family_id, v_uid, null);

  update public.family_members
    set left_at = now(),
        role = 'member'
  where user_id = v_uid
    and family_id = v_family_id
    and left_at is null;
end;
$$;

grant execute on function public.remove_family_member(uuid) to authenticated;
grant execute on function public.leave_current_family() to authenticated;
