-- GAMA Ops Hub — troca as opções de "classe" em Membros
-- De: Oficial / Graduado / Praça
-- Para: Comando / Sub-comando / Operador / Estágio

alter table public.membros drop constraint membros_classe_check;

-- Remapeia os 10 membros semeados na Fase 2, com base no cargo de cada um.
-- Ajuste manualmente pela tela depois se algum mapeamento não fizer sentido.
update public.membros set classe = 'Comando' where nome = 'Cpt. Rodrigo Almeida';
update public.membros set classe = 'Sub-comando' where nome in ('Ten. Marcos Vieira', 'Sgt. Lucas Ferreira');
update public.membros set classe = 'Operador' where nome in (
  'Sgt. Ana Torres', 'Cb. Pedro Santos', 'Cb. Rafael Mendes',
  'Sd. João Silva', 'Sd. Maria Oliveira', 'Sd. Felipe Costa'
);
update public.membros set classe = 'Estágio' where nome = 'Sd. Bruno Lima';

alter table public.membros
  add constraint membros_classe_check check (classe in ('Comando', 'Sub-comando', 'Operador', 'Estágio'));
