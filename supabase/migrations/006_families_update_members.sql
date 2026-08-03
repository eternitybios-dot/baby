-- 006: 家族名の更新を家族メンバー全員に許可
-- 作成者以外でも設定の「家族の名前」を消せる／変えられるようにする

drop policy if exists families_update on public.families;
create policy families_update on public.families
for update to authenticated
using (public.is_family_member(id))
with check (public.is_family_member(id));
