-- GAMA Ops Hub — suporte a login anônimo (botão "Visitante" na tela de login)
-- Atualiza o trigger que cria o profile: contas anônimas não têm e-mail nem
-- metadados, então precisa de valores padrão específicos pra elas.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, papel, login_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', case when new.is_anonymous then 'Visitante' else '' end),
    coalesce((new.raw_user_meta_data->>'papel')::public.app_role, 'visitante'),
    coalesce(new.raw_user_meta_data->>'login_id', new.email, new.id::text)
  );
  return new;
end;
$$;
