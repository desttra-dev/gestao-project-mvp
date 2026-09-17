-- Controle de lembretes de aula enviados
alter table classes
  add column if not exists reminder_sent_at timestamptz;
