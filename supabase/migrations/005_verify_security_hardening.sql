-- 005: 004 適用確認用（読み取り専用の検査クエリ）
-- SQL Editor で実行し、結果を目視確認してください。データは変更しません。

-- 1) push_subscriptions SELECT が本人限定か
--    using_expr に「user_id = auth.uid()」相当があれば OK
--    「is_family_member」だけなら 004 未適用（家族が他人の購読鍵を読める）
select
  pol.polname as policy_name,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expr
from pg_policy pol
join pg_class cls on cls.oid = pol.polrelid
join pg_namespace nsp on nsp.oid = cls.relnamespace
where nsp.nspname = 'public'
  and cls.relname = 'push_subscriptions'
  and pol.polname = 'push_subscriptions_select';

-- 2) ownership 改変防止トリガーが付いているか（4テーブルぶん出れば OK）
select
  c.relname as table_name,
  t.tgname as trigger_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not t.tgisinternal
  and t.tgname like '%prevent_ownership_reassignment%'
order by c.relname;

-- 3) baby_belongs_to_family が存在するか（1行出れば OK）
select
  p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'baby_belongs_to_family';
