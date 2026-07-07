-- Adiciona coluna price na tabela classes
alter table classes
  add column if not exists price numeric(10,2);
