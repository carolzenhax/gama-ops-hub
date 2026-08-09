-- GAMA Ops Hub — comando pode editar (renomear) e apagar membros direto nos campos
-- "Comando da Ação" e "Participantes" de Operações, igual já existe em Gangue e
-- Comando Externo. Isso mexe na tabela membros (o mesmo roster da aba Membros),
-- então edita/apaga o membro de verdade, não só o vínculo com a ação.

-- Sem isso, apagar um membro que já participou de alguma ação falhava (violação de
-- chave estrangeira). Agora, ao apagar, ele só é removido das ações que participou.
alter table public.operacoes_participantes drop constraint operacoes_participantes_membro_id_fkey;
alter table public.operacoes_participantes
  add constraint operacoes_participantes_membro_id_fkey
  foreign key (membro_id) references public.membros(id) on delete cascade;

alter table public.operacoes_comandos drop constraint operacoes_comandos_membro_id_fkey;
alter table public.operacoes_comandos
  add constraint operacoes_comandos_membro_id_fkey
  foreign key (membro_id) references public.membros(id) on delete cascade;
