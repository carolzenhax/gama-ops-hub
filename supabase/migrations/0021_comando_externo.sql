-- GAMA Ops Hub — novo campo "Comando Externo" em Operações: texto livre (não
-- linkado a Membros/login), pra gente que comandou a ação mas não é da GAMA.
-- "Comando da Ação" continua como está (linkado a Membros, mantém a visibilidade
-- automática do relatório pra quem tá marcado lá).

create table public.comandos_externos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

alter table public.comandos_externos enable row level security;

create policy "comandos_externos_select" on public.comandos_externos
  for select to authenticated using (public.current_papel() in ('comando', 'membro'));
create policy "comandos_externos_insert" on public.comandos_externos
  for insert to authenticated with check (public.current_papel() in ('comando', 'membro'));

create table public.operacoes_comandos_externos (
  operacao_id uuid not null references public.operacoes(id) on delete cascade,
  comando_externo_id uuid not null references public.comandos_externos(id),
  primary key (operacao_id, comando_externo_id)
);

alter table public.operacoes_comandos_externos enable row level security;

create policy "operacoes_comandos_externos_insert" on public.operacoes_comandos_externos
  for insert to authenticated with check (public.current_papel() in ('comando', 'membro'));
create policy "operacoes_comandos_externos_select" on public.operacoes_comandos_externos
  for select to authenticated using (public.pode_ver_operacao(operacao_id));
create policy "operacoes_comandos_externos_delete" on public.operacoes_comandos_externos
  for delete to authenticated using (public.current_papel() = 'comando');
