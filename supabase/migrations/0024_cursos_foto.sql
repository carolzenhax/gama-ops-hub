-- GAMA Ops Hub — adiciona foto opcional em Cursos, igual já existe em Honraria.

alter table public.cursos add column foto_url text;
