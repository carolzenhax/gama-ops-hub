-- GAMA Ops Hub — membro pode ver os relatórios de Operações que ele mesmo enviou
-- (antes, a leitura de operações era só pra comando; membro só registrava, sem ver depois)

create policy "operacoes_select_own" on public.operacoes
  for select to authenticated
  using (public.current_papel() = 'membro' and criado_por = auth.uid());

create policy "operacoes_gangues_select_own" on public.operacoes_gangues
  for select to authenticated
  using (
    public.current_papel() = 'membro'
    and exists (select 1 from public.operacoes o where o.id = operacao_id and o.criado_por = auth.uid())
  );

create policy "operacoes_participantes_select_own" on public.operacoes_participantes
  for select to authenticated
  using (
    public.current_papel() = 'membro'
    and exists (select 1 from public.operacoes o where o.id = operacao_id and o.criado_por = auth.uid())
  );

create policy "operacoes_comandos_select_own" on public.operacoes_comandos
  for select to authenticated
  using (
    public.current_papel() = 'membro'
    and exists (select 1 from public.operacoes o where o.id = operacao_id and o.criado_por = auth.uid())
  );
