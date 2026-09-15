-- Follow-up replies on support tickets (user comments + future admin thread replies).
-- (Applied to production via MCP on 2026-09-15; kept here for the migration record.)
create table if not exists public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null default 'user' check (sender in ('user', 'admin')),
  message text not null check (char_length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists ticket_replies_ticket_idx on public.ticket_replies (ticket_id, created_at asc);

alter table public.ticket_replies enable row level security;

drop policy if exists "Users can view replies on own tickets" on public.ticket_replies;
create policy "Users can view replies on own tickets"
  on public.ticket_replies for select
  using (auth.uid() = user_id);

drop policy if exists "Users can reply to own tickets" on public.ticket_replies;
create policy "Users can reply to own tickets"
  on public.ticket_replies for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = auth.uid() and t.status <> 'closed'
    )
  );