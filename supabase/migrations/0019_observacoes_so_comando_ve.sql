-- GAMA Ops Hub — só o comando pode LER os comentários dos relatórios.
-- Quem participou/comandou a ação (ou quem enviou) continua podendo comentar
-- (insert não muda), só não vê os comentários — nem os próprios.

drop policy "operacoes_observacoes_select" on public.operacoes_observacoes;

create policy "operacoes_observacoes_select" on public.operacoes_observacoes
  for select to authenticated
  using (public.current_papel() = 'comando');
