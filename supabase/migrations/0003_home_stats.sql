-- GAMA Ops Hub — estatística agregada para os cards do Home
-- Permite que qualquer autenticado veja a CONTAGEM de operações do mês,
-- sem expor os detalhes das operações (que continuam restritos a "comando").

create or replace function public.operacoes_count_mes()
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer
  from public.operacoes
  where date_trunc('month', data) = date_trunc('month', current_date);
$$;

grant execute on function public.operacoes_count_mes() to authenticated;

-- Mesma lógica para o card "Efetivo Ativo": membros também é restrito
-- (visitante não pode ler a tabela), mas todo mundo pode ver a contagem.
create or replace function public.membros_count()
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer from public.membros;
$$;

grant execute on function public.membros_count() to authenticated;
