-- GAMA Ops Hub — adiciona título a cada aviso (opcional, avisos antigos ficam sem)
alter table public.avisos add column titulo text;
