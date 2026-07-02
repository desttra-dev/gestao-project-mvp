-- =============================================
-- MIGRAÇÃO V3 — Execute no Supabase SQL Editor
-- =============================================
-- Atualiza o campo country em students para aceitar todos os países suportados
-- e expande as moedas aceitas em financial_transactions

-- 1. Remove constraint antiga de country em students (se existir)
alter table students
  drop constraint if exists students_country_check;

-- 2. Adiciona nova constraint com todos os países suportados
alter table students
  add constraint students_country_check
    check (country in (
      'BR','PT','DE','FR','ES','IT','NL','BE','AT','IE','FI','LU','GR',
      'GB','CH','SE','NO','DK','US','CA'
    ));

-- 3. Expande moedas aceitas em financial_transactions
alter table financial_transactions
  drop constraint if exists financial_transactions_currency_check;

alter table financial_transactions
  add constraint financial_transactions_currency_check
    check (currency in ('BRL','EUR','GBP','CHF','USD','CAD','SEK','NOK','DKK'));
