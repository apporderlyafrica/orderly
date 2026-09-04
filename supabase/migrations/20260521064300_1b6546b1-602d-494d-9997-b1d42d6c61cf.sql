create table if not exists public.products (
  id text primary key,
  name text not null,
  price integer not null default 0,
  cost integer not null default 0,
  stock integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigint primary key,
  date timestamptz not null default now(),
  customer text not null,
  phone text not null,
  product_id text not null,
  upsell_ids text[] not null default '{}',
  city text not null default '',
  status text not null default 'new' check (status in ('new', 'callback', 'confirmed', 'delivered', 'cancelled')),
  source_key text unique,
  source_spreadsheet_id text,
  source_row_index integer,
  sale_total integer not null default 0,
  goods_cost_total integer not null default 0,
  closing_fee integer not null default 0,
  delivery_fee integer not null default 0,
  net_after_fees integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('financial', '{"closingFee":1000,"deliveryFeeBanlieue":2000,"deliveryFeeHorsBanlieue":3000,"deliveryFeeRegion":3000}'::jsonb)
on conflict (key) do nothing;

create index if not exists idx_orders_status_deleted on public.orders(status, deleted_at);
create index if not exists idx_orders_source_key on public.orders(source_key);
create index if not exists idx_products_deleted on public.products(deleted_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "App can read products" on public.products;
drop policy if exists "App can create products" on public.products;
drop policy if exists "App can update products" on public.products;
drop policy if exists "App can delete products" on public.products;
create policy "App can read products" on public.products for select using (true);
create policy "App can create products" on public.products for insert with check (true);
create policy "App can update products" on public.products for update using (true) with check (true);
create policy "App can delete products" on public.products for delete using (true);

drop policy if exists "App can read orders" on public.orders;
drop policy if exists "App can create orders" on public.orders;
drop policy if exists "App can update orders" on public.orders;
drop policy if exists "App can delete orders" on public.orders;
create policy "App can read orders" on public.orders for select using (true);
create policy "App can create orders" on public.orders for insert with check (true);
create policy "App can update orders" on public.orders for update using (true) with check (true);
create policy "App can delete orders" on public.orders for delete using (true);

drop policy if exists "App can read settings" on public.app_settings;
drop policy if exists "App can create settings" on public.app_settings;
drop policy if exists "App can update settings" on public.app_settings;
drop policy if exists "App can delete settings" on public.app_settings;
create policy "App can read settings" on public.app_settings for select using (true);
create policy "App can create settings" on public.app_settings for insert with check (true);
create policy "App can update settings" on public.app_settings for update using (true) with check (true);
create policy "App can delete settings" on public.app_settings for delete using (true);