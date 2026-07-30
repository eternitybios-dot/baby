-- 削除・更新の RLS を明確化（既に 001 を実行済みのプロジェクト向け）
-- SQL Editor でこのファイルを実行してください。

-- concerns
drop policy if exists concerns_select on public.concerns;
drop policy if exists concerns_insert on public.concerns;
drop policy if exists concerns_update on public.concerns;
drop policy if exists concerns_delete on public.concerns;

create policy concerns_select on public.concerns for select to authenticated
using (public.is_family_member(family_id) and deleted_at is null);

create policy concerns_insert on public.concerns for insert to authenticated
with check (
  public.is_family_member(family_id)
  and user_id = auth.uid()
);

create policy concerns_update on public.concerns for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy concerns_delete on public.concerns for delete to authenticated
using (public.is_family_member(family_id));

-- habits
drop policy if exists habits_select on public.habits;
drop policy if exists habits_insert on public.habits;
drop policy if exists habits_update on public.habits;
drop policy if exists habits_delete on public.habits;

create policy habits_select on public.habits for select to authenticated
using (public.is_family_member(family_id) and deleted_at is null);

create policy habits_insert on public.habits for insert to authenticated
with check (
  public.is_family_member(family_id)
  and user_id = auth.uid()
);

create policy habits_update on public.habits for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy habits_delete on public.habits for delete to authenticated
using (public.is_family_member(family_id));

-- care_records
drop policy if exists care_records_select on public.care_records;
drop policy if exists care_records_insert on public.care_records;
drop policy if exists care_records_update on public.care_records;
drop policy if exists care_records_delete on public.care_records;
drop policy if exists care_records_all on public.care_records;

create policy care_records_select on public.care_records for select to authenticated
using (public.is_family_member(family_id) and deleted_at is null);

create policy care_records_insert on public.care_records for insert to authenticated
with check (
  public.is_family_member(family_id)
  and user_id = auth.uid()
);

create policy care_records_update on public.care_records for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy care_records_delete on public.care_records for delete to authenticated
using (public.is_family_member(family_id));

-- growth_records
drop policy if exists growth_records_select on public.growth_records;
drop policy if exists growth_records_insert on public.growth_records;
drop policy if exists growth_records_update on public.growth_records;
drop policy if exists growth_records_delete on public.growth_records;

create policy growth_records_select on public.growth_records for select to authenticated
using (public.is_family_member(family_id) and deleted_at is null);

create policy growth_records_insert on public.growth_records for insert to authenticated
with check (
  public.is_family_member(family_id)
  and user_id = auth.uid()
);

create policy growth_records_update on public.growth_records for update to authenticated
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy growth_records_delete on public.growth_records for delete to authenticated
using (public.is_family_member(family_id));
