-- 004: セキュリティ強化（冪等）
-- - push_subscriptions の SELECT を本人のみに制限
-- - care/growth/concerns/habits の所属家族・赤ちゃん・作成者の改変を禁止
-- - baby_id が family_id に所属することを検証

-- ---------------------------------------------------------------------------
-- 1. push_subscriptions: 他人の endpoint / 鍵を読めないようにする
-- ---------------------------------------------------------------------------
drop policy if exists push_subscriptions_select on public.push_subscriptions;
create policy push_subscriptions_select on public.push_subscriptions
for select to authenticated
using (user_id = auth.uid());

-- insert / update / delete は 003 の本人限定を維持（再定義で冪等）
drop policy if exists push_subscriptions_insert on public.push_subscriptions;
create policy push_subscriptions_insert on public.push_subscriptions
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_family_member(family_id)
);

drop policy if exists push_subscriptions_update on public.push_subscriptions;
create policy push_subscriptions_update on public.push_subscriptions
for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and public.is_family_member(family_id)
);

drop policy if exists push_subscriptions_delete on public.push_subscriptions;
create policy push_subscriptions_delete on public.push_subscriptions
for delete to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. baby が family に所属しているかの検証
-- ---------------------------------------------------------------------------
create or replace function public.baby_belongs_to_family(
  p_baby_id uuid,
  p_family_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.babies b
    where b.id = p_baby_id
      and b.family_id = p_family_id
      and b.deleted_at is null
  );
$$;

revoke all on function public.baby_belongs_to_family(uuid, uuid) from public;
grant execute on function public.baby_belongs_to_family(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. 所属キー改変を防ぐトリガー（夫婦の本文編集・削除は許可）
-- ---------------------------------------------------------------------------
create or replace function public.prevent_ownership_reassignment()
returns trigger
language plpgsql
as $$
begin
  if new.family_id is distinct from old.family_id then
    raise exception 'family_id は変更できません';
  end if;
  if new.baby_id is distinct from old.baby_id then
    raise exception 'baby_id は変更できません';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id は変更できません';
  end if;
  return new;
end;
$$;

drop trigger if exists care_records_prevent_ownership_reassignment on public.care_records;
create trigger care_records_prevent_ownership_reassignment
before update on public.care_records
for each row execute function public.prevent_ownership_reassignment();

drop trigger if exists growth_records_prevent_ownership_reassignment on public.growth_records;
create trigger growth_records_prevent_ownership_reassignment
before update on public.growth_records
for each row execute function public.prevent_ownership_reassignment();

drop trigger if exists concerns_prevent_ownership_reassignment on public.concerns;
create trigger concerns_prevent_ownership_reassignment
before update on public.concerns
for each row execute function public.prevent_ownership_reassignment();

drop trigger if exists habits_prevent_ownership_reassignment on public.habits;
create trigger habits_prevent_ownership_reassignment
before update on public.habits
for each row execute function public.prevent_ownership_reassignment();

-- ---------------------------------------------------------------------------
-- 4. INSERT 時に baby_id と family_id の整合を検証
-- ---------------------------------------------------------------------------
create or replace function public.validate_record_family_baby()
returns trigger
language plpgsql
as $$
begin
  if not public.baby_belongs_to_family(new.baby_id, new.family_id) then
    raise exception 'baby_id が family_id に所属していません';
  end if;
  if new.user_id is distinct from auth.uid() then
    raise exception 'user_id は自分自身である必要があります';
  end if;
  return new;
end;
$$;

drop trigger if exists care_records_validate_family_baby on public.care_records;
create trigger care_records_validate_family_baby
before insert on public.care_records
for each row execute function public.validate_record_family_baby();

drop trigger if exists growth_records_validate_family_baby on public.growth_records;
create trigger growth_records_validate_family_baby
before insert on public.growth_records
for each row execute function public.validate_record_family_baby();

drop trigger if exists concerns_validate_family_baby on public.concerns;
create trigger concerns_validate_family_baby
before insert on public.concerns
for each row execute function public.validate_record_family_baby();

drop trigger if exists habits_validate_family_baby on public.habits;
create trigger habits_validate_family_baby
before insert on public.habits
for each row execute function public.validate_record_family_baby();

-- ---------------------------------------------------------------------------
-- 5. UPDATE の WITH CHECK を強化（family 所属は維持、キー改変はトリガーで拒否）
--    夫婦による本文編集・削除は従来どおり許可
-- ---------------------------------------------------------------------------
drop policy if exists care_records_update on public.care_records;
create policy care_records_update on public.care_records
for update to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and public.baby_belongs_to_family(baby_id, family_id)
);

drop policy if exists growth_records_update on public.growth_records;
create policy growth_records_update on public.growth_records
for update to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and public.baby_belongs_to_family(baby_id, family_id)
);

drop policy if exists concerns_update on public.concerns;
create policy concerns_update on public.concerns
for update to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and public.baby_belongs_to_family(baby_id, family_id)
);

drop policy if exists habits_update on public.habits;
create policy habits_update on public.habits
for update to authenticated
using (public.is_family_member(family_id))
with check (
  public.is_family_member(family_id)
  and public.baby_belongs_to_family(baby_id, family_id)
);

drop policy if exists care_records_insert on public.care_records;
create policy care_records_insert on public.care_records
for insert to authenticated
with check (
  public.is_family_member(family_id)
  and user_id = auth.uid()
  and public.baby_belongs_to_family(baby_id, family_id)
);

drop policy if exists growth_records_insert on public.growth_records;
create policy growth_records_insert on public.growth_records
for insert to authenticated
with check (
  public.is_family_member(family_id)
  and user_id = auth.uid()
  and public.baby_belongs_to_family(baby_id, family_id)
);

drop policy if exists concerns_insert on public.concerns;
create policy concerns_insert on public.concerns
for insert to authenticated
with check (
  public.is_family_member(family_id)
  and user_id = auth.uid()
  and public.baby_belongs_to_family(baby_id, family_id)
);

drop policy if exists habits_insert on public.habits;
create policy habits_insert on public.habits
for insert to authenticated
with check (
  public.is_family_member(family_id)
  and user_id = auth.uid()
  and public.baby_belongs_to_family(baby_id, family_id)
);
