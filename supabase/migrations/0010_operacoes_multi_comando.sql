-- GAMA Ops Hub — Comando da Ação vira multi-select, e registra quem enviou o relatório.

-- ── Comando da ação: de campo único pra tabela de junção (igual participantes/gangues) ──
create table public.operacoes_comandos (
  operacao_id uuid not null references public.operacoes(id) on delete cascade,
  membro_id uuid not null references public.membros(id),
  primary key (operacao_id, membro_id)
);

alter table public.operacoes_comandos enable row level security;

create policy "operacoes_comandos_insert" on public.operacoes_comandos
  for insert to authenticated
  with check (public.current_papel() in ('comando', 'membro'));

create policy "operacoes_comandos_select" on public.operacoes_comandos
  for select to authenticated
  using (public.current_papel() = 'comando');

create policy "operacoes_comandos_delete" on public.operacoes_comandos
  for delete to authenticated
  using (public.current_papel() = 'comando');

-- Migra os dados existentes (comando_id único) pra tabela nova antes de remover a coluna.
insert into public.operacoes_comandos (operacao_id, membro_id)
select id, comando_id from public.operacoes where comando_id is not null;

alter table public.operacoes drop column comando_id;

-- ── Quem enviou o relatório ────────────────────────────────────────────────
alter table public.operacoes
  add column criado_por uuid references public.profiles(id) on delete set null default auth.uid();
