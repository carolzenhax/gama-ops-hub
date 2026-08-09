-- GAMA Ops Hub — preserva o nome de quem participou/comandou uma ação mesmo depois
-- que o membro é apagado do roster. Guarda um "retrato" do nome (nome_snapshot) no
-- momento do registro; se o membro ainda existir, continua mostrando o nome atual
-- dele (renomeações aparecem normalmente); se foi apagado, cai no nome_snapshot.

-- membro_id fazia parte da chave primária composta, o que impede deixá-lo nulo.
-- Troca por um id próprio (surrogate key) + índice único parcial só pra vínculos ativos.
alter table public.operacoes_participantes add column id uuid not null default gen_random_uuid();
alter table public.operacoes_participantes drop constraint operacoes_participantes_pkey;
alter table public.operacoes_participantes add constraint operacoes_participantes_pkey primary key (id);
create unique index operacoes_participantes_ativo_uniq on public.operacoes_participantes (operacao_id, membro_id) where membro_id is not null;

alter table public.operacoes_comandos add column id uuid not null default gen_random_uuid();
alter table public.operacoes_comandos drop constraint operacoes_comandos_pkey;
alter table public.operacoes_comandos add constraint operacoes_comandos_pkey primary key (id);
create unique index operacoes_comandos_ativo_uniq on public.operacoes_comandos (operacao_id, membro_id) where membro_id is not null;

-- Snapshot do nome, preenchido com o nome atual pros vínculos que já existem.
alter table public.operacoes_participantes add column nome_snapshot text;
update public.operacoes_participantes op set nome_snapshot = m.nome from public.membros m where m.id = op.membro_id;
alter table public.operacoes_participantes alter column nome_snapshot set not null;

alter table public.operacoes_comandos add column nome_snapshot text;
update public.operacoes_comandos oc set nome_snapshot = m.nome from public.membros m where m.id = oc.membro_id;
alter table public.operacoes_comandos alter column nome_snapshot set not null;

-- membro_id agora pode ficar nulo (apagar o membro não apaga mais o vínculo/relatório).
alter table public.operacoes_participantes alter column membro_id drop not null;
alter table public.operacoes_participantes drop constraint operacoes_participantes_membro_id_fkey;
alter table public.operacoes_participantes
  add constraint operacoes_participantes_membro_id_fkey
  foreign key (membro_id) references public.membros(id) on delete set null;

alter table public.operacoes_comandos alter column membro_id drop not null;
alter table public.operacoes_comandos drop constraint operacoes_comandos_membro_id_fkey;
alter table public.operacoes_comandos
  add constraint operacoes_comandos_membro_id_fkey
  foreign key (membro_id) references public.membros(id) on delete set null;
