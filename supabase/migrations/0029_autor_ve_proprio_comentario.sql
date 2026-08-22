-- GAMA Ops Hub — quem escreveu um comentário passa a ver o próprio comentário
-- (antes só o comando via qualquer comentário). Não muda o resto: continua sem
-- ver os comentários de outras pessoas no mesmo relatório.

create policy "operacoes_observacoes_select_own" on public.operacoes_observacoes
  for select to authenticated
  using (autor_id = auth.uid());
