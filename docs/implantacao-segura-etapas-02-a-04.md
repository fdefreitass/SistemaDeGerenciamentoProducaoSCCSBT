# SCC Produção — Implantação controlada das etapas 2, 3 e 4

**Status:** código preparado em `feat/primeiro-acesso`. **NÃO aplicado automaticamente** ao Supabase ou à Cloudflare.
**Não** usar `supabase db reset` ou `supabase db push` cegamente neste projeto: o banco contém mudanças manuais acumuladas.
**Não** publicar a branch para o endereço online antes de validar os testes abaixo.

## Ordem e backup (obrigatórios)

1. Identificar o projeto Supabase correto no Dashboard (Project Ref e ambiente).
2. Fazer cópia recuperável e verificar o conteúdo de `materiais`, `secoes`, `perfis`, `historico_materiais` e `auth.users` com ferramenta apropriada. CSV isolado não equivale a um backup completo. Verificar se o plano oferece backup gerenciado; não supor recuperação automática no plano gratuito.
3. Confirmar quais migrações anteriores já foram realmente aplicadas. O arquivo `20261104_01_base_segura.sql` foi referência inicial e **não deve ser reaplicado** em banco com dados.
4. Em sessão administrativa do **SQL Editor**, revisar e aplicar **uma por vez**:
   - `supabase/migrations/20261109_02_edicao_exclusao_materiais.sql`
   - `supabase/migrations/20261109_03_perfil_cores_avatar.sql`
5. Conferir os resultados das consultas abaixo antes de permitir testes de exclusão.

> Migração 02 altera a relação de histórico com materiais para que registros excluídos mantenham seu UUID. A exclusão física é irreversível pela interface; o histórico é uma trilha de auditoria, não um recurso de restauração.

## Verificações de estrutura (consulta apenas)

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in ('materiais', 'historico_materiais', 'perfis', 'secoes'))
   or (schemaname = 'storage' and tablename = 'objects' and policyname like 'scc_avatar%')
order by schemaname, tablename, policyname;

select table_name, column_name, privilege_type, grantee
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('perfis','secoes','materiais')
  and grantee = 'authenticated'
  and privilege_type = 'UPDATE'
order by table_name, column_name;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'scc-avatars';

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.historico_materiais'::regclass;

select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='secoes' and column_name='cor_hex';
```

Critérios: bucket `scc-avatars` deve ser privado; perfil só tem UPDATE de nome para usuário comum; cores e nomes de seções só podem ser alterados por administrador segundo RLS; exclusão de materiais só por administrador; não há FK de histórico exigindo existência de material apagado.

## Testes funcionais com contas existentes

- **Administrador:** editar código e seção de um material de teste; duplicar; salvar cor de seção; abrir em outro computador e conferir cor depois de recarregar. Confirmar que a exclusão exige duas etapas e o código digitado; excluir **somente um registro de teste descartável**, depois conferir o histórico com `acao='excluido'`, `material_id` original, `usuario_id`, `antes` preenchido e `depois` nulo.
- **Editor:** pode editar e duplicar, não pode excluir nem alterar nome/cor das seções, nem funções de conta/roles.
- **Leitor:** pode consultar; **não** pode criar, editar, duplicar, excluir ou mudar cor de seção. Pode editar **somente o próprio nome**, foto e senha na área Meu Perfil.
- **Conta inativa:** não deve ver dados ou carregar foto, mesmo com sessão antiga.
- **Anônimo:** não deve consultar tabelas nem arquivos de fotos.
- **Todos os usuários ativos:** nome (2 a 100 caracteres) atualizado; JPG/PNG/WebP de até 2 MB; imagem só acessível ao titular; remover foto volta às iniciais; troca de senha exige senha atual, validação de 12 caracteres, encerra a sessão e permite novo login.

Testes de privilégios devem ser feitos por sessões reais de cada perfil, não por uma sessão de proprietário do SQL Editor, que pode contornar RLS.

## Reforço de Supabase Auth e publicação

- No Supabase Dashboard, **desativar cadastro público**. O `supabase/config.toml` foi reforçado para ambientes locais, mas isso **não configura sozinho o projeto hospedado**.
- Configurar senhas com mínimo de 12 caracteres, política forte e proteção contra senhas vazadas quando disponível.
- As alterações comuns de senha validam a senha atual via `signInWithPassword`. Para proteção também contra chamadas diretas à API, habilitar no Supabase Auth a exigência de senha atual na troca. A opção de reautenticação por e-mail/OTP depende da entrega de e-mail confiável.
- Validar políticas RLS para leitura de perfis, material, histórico e storage; manter `service_role` **somente no backend**.
- Verificar os limites de envio por e-mail das Edge Functions e a exigência de `troca_senha_pendente=false` para o convite administrativo.
- Publicar a branch na Cloudflare **somente após** todos os testes.
- Antes da publicação, conferir que `VITE_DATA_SOURCE=supabase` e que somente a chave **publishable** é usada no Vite.

## Rollback

Se uma migração falhar, o bloco `BEGIN/COMMIT` permite que o PostgreSQL reverta a transação falha. Depois de aplicada, **não existe rollback automático de exclusões físicas**: restaurar a partir de backup validado ou reconstruir um registro com cuidado a partir dos snapshots de auditoria. Não executar comandos de remoção em massa sem outro plano de recuperação.
