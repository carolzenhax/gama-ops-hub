-- GAMA Ops Hub — adiciona "Chaveirinho" como classe em Membros, abaixo de Estágio.

alter table public.membros drop constraint membros_classe_check;
alter table public.membros
  add constraint membros_classe_check check (classe in ('Comando', 'Sub-comando', 'Operador', 'Estágio', 'Chaveirinho'));
