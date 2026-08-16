-- GAMA Ops Hub — adiciona "Tipo da Ação" em Cursos (Grande/Média/Pequena), pra
-- categorizar e agrupar a página. Fica opcional (nullable) pra não quebrar os
-- cursos já cadastrados sem essa classificação — comando preenche depois editando.

alter table public.cursos add column tipo text;
alter table public.cursos add constraint cursos_tipo_check check (tipo is null or tipo in ('Grande', 'Média', 'Pequena'));
