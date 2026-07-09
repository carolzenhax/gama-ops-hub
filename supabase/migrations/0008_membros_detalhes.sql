-- GAMA Ops Hub — detalhes de membro (Passaporte, Patente, Data de Ingresso)
-- e checklist de promoção personalizável por membro.

alter table public.membros add column passaporte text;
alter table public.membros add column patente text;
alter table public.membros add column data_ingresso date;

create table public.membros_checklist (
  id uuid primary key default gen_random_uuid(),
  membro_id uuid not null references public.membros(id) on delete cascade,
  item text not null,
  concluido boolean not null default false,
  created_at timestamptz not null default clock_timestamp()
);

alter table public.membros_checklist enable row level security;

-- Leitura: quem já vê a página de Membros (comando e membro) também vê o checklist.
create policy "membros_checklist_select" on public.membros_checklist
  for select to authenticated
  using (public.current_papel() in ('comando', 'membro'));

-- Escrita (criar item, marcar/desmarcar, apagar item): só comando.
create policy "membros_checklist_insert" on public.membros_checklist
  for insert to authenticated
  with check (public.current_papel() = 'comando');

create policy "membros_checklist_update" on public.membros_checklist
  for update to authenticated
  using (public.current_papel() = 'comando')
  with check (public.current_papel() = 'comando');

create policy "membros_checklist_delete" on public.membros_checklist
  for delete to authenticated
  using (public.current_papel() = 'comando');
