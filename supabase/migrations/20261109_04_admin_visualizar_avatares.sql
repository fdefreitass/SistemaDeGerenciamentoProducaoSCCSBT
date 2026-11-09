-- SCC Produção: administradores podem visualizar os avatares, mas não alterá-los.
-- O bucket continua PRIVADO e cada titular continua com controle exclusivo
-- de INSERT/UPDATE/DELETE no próprio arquivo.
begin;
drop policy if exists scc_avatar_ler_admin on storage.objects;
create policy scc_avatar_ler_admin on storage.objects
for select to authenticated
using (
  bucket_id = 'scc-avatars'
  and (select private.papel_atual()) = 'admin'::public.papel_usuario
);
commit;