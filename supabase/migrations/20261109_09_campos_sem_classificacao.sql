-- SCC Produção: importação fiel de OPEC X MKT, sem classificações presumidas.
-- Registros anteriores permanecem intactos. Nullable para itens sem cadastro completo.
begin;
alter table public.materiais
  alter column codigo drop not null,
  alter column duracao_segundos drop not null,
  alter column status_grade drop not null,
  alter column status_grade drop default,
  alter column status_producao drop not null,
  alter column status_producao drop default;
alter table public.materiais
  add column if not exists dados_origem jsonb;
comment on column public.materiais.dados_origem is
  'Metadados fiéis da planilha fonte (linhas de origem, campos de datas, e-mail, OPEC).';
-- Os constraints existentes continuam válidos para valores presentes:
-- formato de código, duração positiva e chave única (seção, código).
commit;