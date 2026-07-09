-- GAMA Ops Hub — comando pode editar e apagar nomes de "Comando Externo".
-- Diferente das outras listas (Ação, Loja, Gangue), que são só-criação por
-- design, essa aqui faz sentido poder corrigir/limpar (nomes digitados na hora,
-- mais chance de erro de digitação ou entrada duplicada).

create policy "comandos_externos_update" on public.comandos_externos
  for update to authenticated
  using (public.current_papel() = 'comando')
  with check (public.current_papel() = 'comando');

create policy "comandos_externos_delete" on public.comandos_externos
  for delete to authenticated
  using (public.current_papel() = 'comando');

-- Ao apagar um nome, remove ele das operações que o usavam (não apaga a operação).
alter table public.operacoes_comandos_externos drop constraint operacoes_comandos_externos_comando_externo_id_fkey;
alter table public.operacoes_comandos_externos
  add constraint operacoes_comandos_externos_comando_externo_id_fkey
  foreign key (comando_externo_id) references public.comandos_externos(id) on delete cascade;
