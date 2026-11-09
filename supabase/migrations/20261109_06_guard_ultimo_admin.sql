-- SCC Produção: preserva o último administrador mesmo sob ações concorrentes.
-- Esta proteção é no banco e não substitui autorização da Edge Function.
begin;
create or replace function private.proteger_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  perdeu_admin boolean;
  admin_count integer;
begin
  if tg_op = 'DELETE' then
    perdeu_admin := old.papel = 'admin'::public.papel_usuario
      and old.ativo is true and old.troca_senha_pendente is false;
  else
    perdeu_admin := old.papel = 'admin'::public.papel_usuario
      and old.ativo is true and old.troca_senha_pendente is false
      and not (
        new.papel = 'admin'::public.papel_usuario
        and new.ativo is true and new.troca_senha_pendente is false
      );
  end if;

  if perdeu_admin then
    -- Serializa alterações administrativas concorrentes.
    perform pg_catalog.pg_advisory_xact_lock(825391);
    select count(*) into admin_count from public.perfis
    where papel = 'admin'::public.papel_usuario
      and ativo is true
      and troca_senha_pendente is false;
    if admin_count <= 1 then
      raise exception 'Nao e permitido remover o ultimo administrador ativo'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.proteger_ultimo_admin() from public, anon, authenticated;
drop trigger if exists proteger_ultimo_admin on public.perfis;
create trigger proteger_ultimo_admin
before update of papel, ativo, troca_senha_pendente or delete on public.perfis
for each row execute function private.proteger_ultimo_admin();
commit;