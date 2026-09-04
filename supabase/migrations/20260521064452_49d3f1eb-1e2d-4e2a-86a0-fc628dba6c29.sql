create policy "No direct product reads" on public.products for select to authenticated using (false);
create policy "No direct product creates" on public.products for insert to authenticated with check (false);
create policy "No direct product updates" on public.products for update to authenticated using (false) with check (false);
create policy "No direct product deletes" on public.products for delete to authenticated using (false);

create policy "No direct order reads" on public.orders for select to authenticated using (false);
create policy "No direct order creates" on public.orders for insert to authenticated with check (false);
create policy "No direct order updates" on public.orders for update to authenticated using (false) with check (false);
create policy "No direct order deletes" on public.orders for delete to authenticated using (false);

create policy "No direct settings reads" on public.app_settings for select to authenticated using (false);
create policy "No direct settings creates" on public.app_settings for insert to authenticated with check (false);
create policy "No direct settings updates" on public.app_settings for update to authenticated using (false) with check (false);
create policy "No direct settings deletes" on public.app_settings for delete to authenticated using (false);