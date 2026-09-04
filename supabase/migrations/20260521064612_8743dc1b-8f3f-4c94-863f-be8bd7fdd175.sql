alter table public.orders
  add column if not exists product_name text not null default '',
  add column if not exists upsell_names text[] not null default '{}';

create sequence if not exists public.orders_id_seq start with 1001;
select setval('public.orders_id_seq', greatest(1000, coalesce((select max(id) from public.orders), 1000)), true);
alter table public.orders alter column id set default nextval('public.orders_id_seq');