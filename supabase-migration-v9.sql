alter table students
  add column if not exists responsible_cpf text,
  add column if not exists cep             text,
  add column if not exists address         text;
