-- GAMA Ops Hub — permite "comando" editar e apagar operações já registradas
-- (antes só era possível criar e visualizar).

create policy "operacoes_update" on public.operacoes
  for update to authenticated
  using (public.current_papel() = 'comando')
  with check (public.current_papel() = 'comando');

create policy "operacoes_delete" on public.operacoes
  for delete to authenticated
  using (public.current_papel() = 'comando');

-- Necessário pra reescrever participantes/gangues de uma operação ao editar
-- (a edição apaga os vínculos antigos e insere os novos).
create policy "operacoes_gangues_delete" on public.operacoes_gangues
  for delete to authenticated
  using (public.current_papel() = 'comando');

create policy "operacoes_participantes_delete" on public.operacoes_participantes
  for delete to authenticated
  using (public.current_papel() = 'comando');
