-- SCC Produção | Migração 03: cores globais, autogestão do nome e avatar privado.
-- Dependência: migração base 20261104_01_base_segura.sql.
-- NÃO executar via frontend, não inserir chaves de serviço no Vite.
-- Aplicar em SQL Editor após backup verificado e checagem das políticas.
-- Executar uma única vez (criação de políticas é protegida contra repetição).

begin;

-- Etapa 3: mesma cor para toda a equipe, persistida no PostgreSQL.
alter table public.secoes add column if not exists cor_hex text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.secoes'::regclass
      and conname = 'secoes_cor_hex_formato'
  ) then
    alter table public.secoes
      add constraint secoes_cor_hex_formato
      check (cor_hex is null or cor_hex ~ '^#[0-9a-fA-F]{6}$');
  end if;
end $$;

-- Apenas administradores poderão modificar a cor, via secoes_editar RLS.
grant update (cor_hex) on public.secoes to authenticated;

-- Etapa 4: permitir ao usuário autenticado e ATIVO alterar o próprio nome.
-- Sem grants de UPDATE para papel/ativo/troca_senha_pendente/id.
grant update (nome) on public.perfis to authenticated;

drop policy if exists perfis_editar_proprio_nome on public.perfis;
create policy perfis_editar_proprio_nome on public.perfis
  for update to authenticated
  using (
    id = (select auth.uid())
    and (select private.papel_atual()) is not null
  )
  with check (
    id = (select auth.uid())
    and (select private.papel_atual()) is not null
  );

-- Avatar exclusivo do titular: sem URL pública.
-- Cada usuário possui apenas o caminho <UUID>/avatar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scc-avatars',
  'scc-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Se o bucket já existir, a migração deve FALHAR caso tenha sido criado
-- público por engano: não aceitamos publicação acidental de fotos.
do $$
begin
  if exists (select 1 from storage.buckets where id = 'scc-avatars' and public = true) then
    raise exception 'Bucket scc-avatars existe como público: revisar antes de prosseguir';
  end if;
end $$;

drop policy if exists scc_avatar_ler_proprio on storage.objects;
create policy scc_avatar_ler_proprio on storage.objects
  for select to authenticated
  using (
    bucket_id = 'scc-avatars'
    and name = (select auth.uid())::text || '/avatar'
    and (select private.papel_atual()) is not null
  );

drop policy if exists scc_avatar_inserir_proprio on storage.objects;
create policy scc_avatar_inserir_proprio on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'scc-avatars'
    and name = (select auth.uid())::text || '/avatar'
    and (select private.papel_atual()) is not null
  );

drop policy if exists scc_avatar_atualizar_proprio on storage.objects;
create policy scc_avatar_atualizar_proprio on storage.objects
  for update to authenticated
  using (
    bucket_id = 'scc-avatars'
    and name = (select auth.uid())::text || '/avatar'
    and (select private.papel_atual()) is not null
  )
  with check (
    bucket_id = 'scc-avatars'
    and name = (select auth.uid())::text || '/avatar'
    and (select private.papel_atual()) is not null
  );

drop policy if exists scc_avatar_remover_proprio on storage.objects;
create policy scc_avatar_remover_proprio on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'scc-avatars'
    and name = (select auth.uid())::text || '/avatar'
    and (select private.papel_atual()) is not null
  );

commit;

-- Verificação pós-aplicação:
-- select policyname, tablename, cmd from pg_policies
-- where schemaname = 'public' and tablename in ('perfis','secoes','materiais')
--    or (schemaname = 'storage' and tablename = 'objects' and policyname like 'scc_avatar%');
-- select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'scc-avatars';
-- test: leitor não altera 'cor_hex' e nenhum usuário altera papel/ativo pelo navegador.
