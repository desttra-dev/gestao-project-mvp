-- Token de recuperação de senha do portal do professor
alter table professors
  add column if not exists reset_token_hash text,
  add column if not exists reset_token_exp  timestamptz;
