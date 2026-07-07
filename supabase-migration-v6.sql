-- Adiciona coluna ends_at na tabela classes
alter table classes
  add column if not exists ends_at timestamptz;
