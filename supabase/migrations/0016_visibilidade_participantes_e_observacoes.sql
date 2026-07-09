-- GAMA Ops Hub — participante/comando da ação também vê o relatório (não só quem enviou),
-- e todo mundo que vê o relatório pode deixar observações nele.

-- ── Vínculo login ↔ membro do roster ────────────────────────────────────────
-- Precisa disso pra RLS saber "esse login é esse participante". Opcional: nem todo
-- login tem um membro do roster vinculado. Só comando edita (mesma policy de profiles,
-- que só a Edge Function mexe).
alter table public.profiles add column membro_id uuid references public.membros(id) on delete set null;

-- ── Função auxiliar: quem pode ver uma operação? ────────────────────────────
-- comando vê tudo; quem enviou vê a própria; quem está vinculado como participante
-- ou comando-da-ação também vê. security definer pra não precisar abrir RLS extra
-- nas tabelas de junção só pra essa checagem.
create or replace function public.pode_ver_operacao(op_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.operacoes o
    where o.id = op_id
    and (
      public.current_papel() = 'comando'
      or o.criado_por = auth.uid()
      or exists (
        select 1 from public.operacoes_participantes p
        join public.profiles pr on pr.membro_id = p.membro_id
        where p.operacao_id = o.id and pr.id = auth.uid()
      )
      or exists (
        select 1 from public.operacoes_comandos c
        join public.profiles pr on pr.membro_id = c.membro_id
        where c.operacao_id = o.id and pr.id = auth.uid()
      )
    )
  );
$$;

grant execute on function public.pode_ver_operacao(uuid) to authenticated;

-- ── Substitui as policies de select por uma versão unificada ───────────────
drop policy "operacoes_select" on public.operacoes;
drop policy "operacoes_select_own" on public.operacoes;
create policy "operacoes_select" on public.operacoes
  for select to authenticated
  using (public.pode_ver_operacao(id));

drop policy "operacoes_gangues_select" on public.operacoes_gangues;
drop policy "operacoes_gangues_select_own" on public.operacoes_gangues;
create policy "operacoes_gangues_select" on public.operacoes_gangues
  for select to authenticated
  using (public.pode_ver_operacao(operacao_id));

drop policy "operacoes_participantes_select" on public.operacoes_participantes;
drop policy "operacoes_participantes_select_own" on public.operacoes_participantes;
create policy "operacoes_participantes_select" on public.operacoes_participantes
  for select to authenticated
  using (public.pode_ver_operacao(operacao_id));

drop policy "operacoes_comandos_select" on public.operacoes_comandos;
drop policy "operacoes_comandos_select_own" on public.operacoes_comandos;
create policy "operacoes_comandos_select" on public.operacoes_comandos
  for select to authenticated
  using (public.pode_ver_operacao(operacao_id));

-- ── Observações nos relatórios ───────────────────────────────────────────
create table public.operacoes_observacoes (
  id uuid primary key default gen_random_uuid(),
  operacao_id uuid not null references public.operacoes(id) on delete cascade,
  autor_id uuid references public.profiles(id) on delete set null default auth.uid(),
  texto text not null,
  created_at timestamptz not null default now()
);

alter table public.operacoes_observacoes enable row level security;

create policy "operacoes_observacoes_select" on public.operacoes_observacoes
  for select to authenticated
  using (public.pode_ver_operacao(operacao_id));

create policy "operacoes_observacoes_insert" on public.operacoes_observacoes
  for insert to authenticated
  with check (public.pode_ver_operacao(operacao_id));
