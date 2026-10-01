-- Encrypted receipt inbox shared by the phone and JMY Operations.
-- Supabase receives only AES-256-GCM ciphertext; the password is never uploaded.

create table if not exists public.mobile_receipts (
  id uuid primary key default gen_random_uuid(),
  encrypted_payload text not null check (char_length(encrypted_payload) between 100 and 7000000),
  submitted_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.mobile_receipts enable row level security;

drop policy if exists "Admins create mobile receipts" on public.mobile_receipts;
create policy "Admins create mobile receipts" on public.mobile_receipts for insert to authenticated
  with check (submitted_by = auth.uid() and exists (select 1 from public.admins where user_id = auth.uid()));
drop policy if exists "Admins read mobile receipts" on public.mobile_receipts;
create policy "Admins read mobile receipts" on public.mobile_receipts for select to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()));
drop policy if exists "Admins delete mobile receipts" on public.mobile_receipts;
create policy "Admins delete mobile receipts" on public.mobile_receipts for delete to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()));

revoke all on public.mobile_receipts from public, anon;
grant select, insert, delete on public.mobile_receipts to authenticated;

create index if not exists mobile_receipts_created_idx
  on public.mobile_receipts (created_at desc);
