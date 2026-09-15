-- Minimal, administrator-only schedule shared between JMY Operations and the phone calendar.
-- No invoice totals, customer contact information, files, payment data, or vault data belong here.

create table if not exists public.mobile_schedule_items (
  sync_key text primary key check (char_length(sync_key) between 8 and 180),
  item_type text not null check (item_type in ('job','task','appointment')),
  title text not null check (char_length(title) between 1 and 160),
  scheduled_date date not null,
  start_time time not null,
  duration_minutes integer not null default 30 check (duration_minutes between 10 and 480),
  assignee text not null default '' check (char_length(assignee) <= 100),
  completed boolean not null default false,
  origin text not null check (origin in ('office','mobile')),
  updated_at timestamptz not null default now()
);

alter table public.mobile_schedule_items enable row level security;

drop policy if exists "Admins manage mobile schedule" on public.mobile_schedule_items;
create policy "Admins manage mobile schedule" on public.mobile_schedule_items
  for all to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

revoke all on public.mobile_schedule_items from public, anon;
grant select, insert, update, delete on public.mobile_schedule_items to authenticated;

create or replace function public.touch_mobile_schedule_item()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_mobile_schedule_item on public.mobile_schedule_items;
create trigger touch_mobile_schedule_item before update on public.mobile_schedule_items
for each row execute function public.touch_mobile_schedule_item();

create index if not exists mobile_schedule_items_date_idx
  on public.mobile_schedule_items (scheduled_date, start_time);
