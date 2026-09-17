-- Portal do Professor: colunas de acesso e confirmação de aulas

-- Acesso dos professores ao portal
alter table professors
  add column if not exists portal_email         text,
  add column if not exists portal_password_hash text;

create unique index if not exists professors_portal_email_idx on professors(portal_email)
  where portal_email is not null;

-- Confirmação de aulas pelos professores
alter table classes
  add column if not exists confirmation_status text
    check (confirmation_status is null or confirmation_status in ('realizada', 'nao_houve')),
  add column if not exists confirmed_at        timestamptz,
  add column if not exists no_show_reason      text
    check (no_show_reason is null or no_show_reason in ('aluno_faltou','professor_faltou','nao_devia_existir','outros')),
  add column if not exists no_show_notes       text;

-- Status "remarcada" para aulas remarcadas
alter table classes
  drop constraint if exists classes_status_check;

alter table classes
  add constraint classes_status_check
    check (status in ('agendada','realizada','cancelada','remarcada'));
