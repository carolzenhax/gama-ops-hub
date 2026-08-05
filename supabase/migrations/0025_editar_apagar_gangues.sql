-- GAMA Ops Hub — comando pode editar e apagar gangues, igual já existe em Comando Externo.

create policy "gangues_update" on public.gangues
  for update to authenticated
  using (public.current_papel() = 'comando')
  with check (public.current_papel() = 'comando');

create policy "gangues_delete" on public.gangues
  for delete to authenticated
  using (public.current_papel() = 'comando');

-- Ao apagar uma gangue, remove ela das ações que a usavam (não apaga a ação).
alter table public.operacoes_gangues drop constraint operacoes_gangues_gangue_id_fkey;
alter table public.operacoes_gangues
  add constraint operacoes_gangues_gangue_id_fkey
  foreign key (gangue_id) references public.gangues(id) on delete cascade;
