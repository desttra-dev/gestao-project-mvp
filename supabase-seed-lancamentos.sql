-- =============================================
-- LANÇAMENTOS ABRIL / MAIO / JUNHO 2026
-- Usa NOT EXISTS para evitar duplicatas
-- Abril sem data → 2026-04-01 (aproximado)
-- =============================================

INSERT INTO financial_transactions (type, amount, currency, transaction_date, description, category)
SELECT 'entrada', v.amount, v.currency, v.dt, v.description, 'mensalidade'
FROM (VALUES
  -- ── ABRIL ─────────────────────────────────────────────────────────────
  -- (sem data → data aproximada 2026-04-01)
  ('2026-04-01'::date,   62.00::numeric, 'EUR'::text, 'Aula Julia'),
  ('2026-04-01'::date,   36.00::numeric, 'EUR'::text, 'Aulas Rillary'),
  ('2026-04-01'::date,   17.00::numeric, 'EUR'::text, 'Aula Juliane'),
  ('2026-04-01'::date,   90.00::numeric, 'EUR'::text, 'Aula Pedro Luxemburgo'),
  ('2026-04-01'::date,   18.00::numeric, 'EUR'::text, 'Aula Murilo'),
  ('2026-04-01'::date,   80.00::numeric, 'EUR'::text, 'Aulas Thiago - Marideni'),
  ('2026-04-01'::date,   80.00::numeric, 'EUR'::text, 'Aulas'),
  ('2026-04-01'::date,   18.00::numeric, 'EUR'::text, 'Aulas Simone'),
  ('2026-04-01'::date,  360.00::numeric, 'BRL'::text, 'Aula Isadora - Simone'),
  ('2026-04-01'::date,  106.00::numeric, 'BRL'::text, 'Sinapse'),
  ('2026-04-01'::date,   70.00::numeric, 'BRL'::text, 'Exercicios Heloisa'),
  ('2026-04-01'::date,  602.00::numeric, 'BRL'::text, 'Aula Ana - Norma'),
  ('2026-04-01'::date,  400.00::numeric, 'BRL'::text, 'Aulas Mariane'),
  ('2026-04-01'::date, 1815.00::numeric, 'BRL'::text, 'Aulas Gabriela'),
  ('2026-04-01'::date,   81.00::numeric, 'BRL'::text, 'Sinapse'),
  ('2026-04-01'::date,  200.00::numeric, 'BRL'::text, 'Aulas Camila'),
  ('2026-04-01'::date,  720.00::numeric, 'BRL'::text, 'Aula Irmãs'),
  ('2026-04-01'::date,  180.00::numeric, 'BRL'::text, 'Aulas Manu'),
  ('2026-04-01'::date,   90.00::numeric, 'BRL'::text, 'Aula Isadora - Simone'),
  ('2026-04-01'::date,   90.00::numeric, 'BRL'::text, 'Aula Sophia - Josi'),
  -- (com data)
  ('2026-04-28'::date,   17.00::numeric, 'EUR'::text, 'Aula Juliane'),
  ('2026-04-30'::date,  720.00::numeric, 'BRL'::text, 'Aula Irmãs'),
  ('2026-04-30'::date,   18.00::numeric, 'EUR'::text, 'Aula Leila'),

  -- ── MAIO ──────────────────────────────────────────────────────────────
  ('2026-05-02'::date,   80.00::numeric, 'EUR'::text, 'Aulas Catherine'),
  ('2026-05-05'::date,   18.00::numeric, 'EUR'::text, 'Aula Denise - Ana Lia'),
  ('2026-05-05'::date,   18.00::numeric, 'EUR'::text, 'Aula Pedro'),
  ('2026-05-05'::date,   80.00::numeric, 'EUR'::text, 'Aula Rillary - Ana Paula'),
  ('2026-05-06'::date,   18.00::numeric, 'EUR'::text, 'Aula Denise - Ana Lia'),
  ('2026-05-06'::date,   80.00::numeric, 'EUR'::text, 'Aulas Pedro - mensal'),
  ('2026-05-06'::date,  250.00::numeric, 'BRL'::text, 'Aulas Sophia - Pacote mensal'),
  ('2026-05-06'::date,   17.00::numeric, 'EUR'::text, 'Aula Laura - Juliane'),
  ('2026-05-07'::date,   90.00::numeric, 'EUR'::text, 'Aulas Pedro Luxemburgo'),
  ('2026-05-08'::date,  450.00::numeric, 'BRL'::text, 'Aulas Manu'),
  ('2026-05-08'::date,   90.00::numeric, 'BRL'::text, 'Aula Dora - Simone'),
  ('2026-05-08'::date,  400.00::numeric, 'BRL'::text, 'Aulas Mariene'),
  ('2026-05-11'::date,   80.00::numeric, 'EUR'::text, 'Aulas Alice - Marcia Avelar'),
  ('2026-05-11'::date,   18.00::numeric, 'EUR'::text, 'Aula Murilo'),
  ('2026-05-12'::date, 1430.00::numeric, 'BRL'::text, 'Aulas Gabriela'),
  ('2026-05-12'::date,  132.00::numeric, 'EUR'::text, 'Aulas Lucas - Leila'),
  ('2026-05-13'::date,   36.00::numeric, 'EUR'::text, 'Aulas Ana Lia - Denise'),
  ('2026-05-13'::date,   17.00::numeric, 'EUR'::text, 'Aula Laura - Juliane'),
  ('2026-05-13'::date,   17.00::numeric, 'EUR'::text, 'Aula Ana'),
  ('2026-05-14'::date,  602.00::numeric, 'BRL'::text, 'Aulas Ana Norma'),
  ('2026-05-17'::date,  360.00::numeric, 'BRL'::text, 'Aulas Dora - Simone'),
  ('2026-05-17'::date,   90.00::numeric, 'BRL'::text, 'Aula Dora Avulsa'),
  ('2026-05-18'::date,   17.00::numeric, 'EUR'::text, 'Aula Gabriele'),
  ('2026-05-18'::date,   18.00::numeric, 'EUR'::text, 'Aula Lara - Marcia'),
  ('2026-05-18'::date,   40.00::numeric, 'EUR'::text, 'Aula Ana Beatriz'),
  ('2026-05-19'::date,   18.00::numeric, 'EUR'::text, 'Aula Ana Lia - Denise'),
  ('2026-05-20'::date,   17.00::numeric, 'EUR'::text, 'Aula Laura - Juliane'),
  ('2026-05-20'::date,  146.00::numeric, 'BRL'::text, 'Aulas Sinapse'),
  ('2026-05-20'::date,   36.00::numeric, 'EUR'::text, 'Aulas Leticia - Leila'),
  ('2026-05-20'::date,   54.00::numeric, 'EUR'::text, 'Aulas Lara - Marcia'),
  ('2026-05-21'::date,   36.00::numeric, 'EUR'::text, 'Aulas Judah'),
  ('2026-05-26'::date,   18.00::numeric, 'EUR'::text, 'Aula Gabriele'),
  ('2026-05-28'::date,   80.00::numeric, 'EUR'::text, 'Aulas Thiago'),
  -- (data de junho encontrada no arquivo de maio — mantida)
  ('2026-06-25'::date,   18.00::numeric, 'EUR'::text, 'Aula Ana Lia - Denise'),

  -- ── JUNHO ─────────────────────────────────────────────────────────────
  ('2026-06-01'::date,  180.00::numeric, 'BRL'::text, 'Aulas Irmãs'),
  ('2026-06-01'::date,  100.00::numeric, 'BRL'::text, 'Aula Neves'),
  ('2026-06-01'::date,   36.00::numeric, 'EUR'::text, 'Aula Ana Lia'),
  ('2026-06-03'::date,  258.00::numeric, 'BRL'::text, 'Aula Sinapse'),
  ('2026-06-03'::date,  602.00::numeric, 'BRL'::text, 'Aula Norma'),
  ('2026-06-03'::date,  400.00::numeric, 'BRL'::text, 'Aula Mariane'),
  ('2026-06-03'::date,  300.00::numeric, 'EUR'::text, 'Aula Lucas e Leticia - Leila'),
  ('2026-06-05'::date,   17.00::numeric, 'EUR'::text, 'Aula Gabriele - Thais'),
  ('2026-06-08'::date, 1700.00::numeric, 'BRL'::text, 'Aulas Gabriela'),
  ('2026-06-09'::date,   18.00::numeric, 'EUR'::text, 'Aula Ana Lia'),
  ('2026-06-09'::date,   17.00::numeric, 'EUR'::text, 'Aula Gabriele - Thais'),
  ('2026-06-09'::date,  140.00::numeric, 'BRL'::text, 'Exercicios Heloisa'),
  ('2026-06-11'::date,   36.00::numeric, 'EUR'::text, 'Aula Janaina'),
  ('2026-06-11'::date,   54.00::numeric, 'EUR'::text, 'Aulas Graziele'),
  ('2026-06-14'::date,   80.00::numeric, 'EUR'::text, 'Aula Catherine'),
  ('2026-06-15'::date,   90.00::numeric, 'EUR'::text, 'Aula Sophia - Ivone'),
  ('2026-06-15'::date,  360.00::numeric, 'BRL'::text, 'Aulas Isadora'),
  ('2026-06-16'::date,   17.00::numeric, 'EUR'::text, 'Aula Gabriele - Thais'),
  ('2026-06-17'::date,   90.00::numeric, 'BRL'::text, 'Aula Isadora'),
  ('2026-06-18'::date,   18.00::numeric, 'EUR'::text, 'Aula Ana Lia'),
  ('2026-06-22'::date,   18.00::numeric, 'EUR'::text, 'Aula Gabriele - Thais'),
  ('2026-06-22'::date,   90.00::numeric, 'BRL'::text, 'Aula Isadora'),
  ('2026-06-22'::date,   18.00::numeric, 'EUR'::text, 'Aula Ana Lia'),
  ('2026-06-22'::date,   72.00::numeric, 'EUR'::text, 'Aula João Pedro'),
  ('2026-06-22'::date,  180.00::numeric, 'BRL'::text, 'Aula Rosangela')

) AS v(dt, amount, currency, description)
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft
  WHERE ft.transaction_date = v.dt
    AND ft.description      = v.description
    AND ft.amount           = v.amount
    AND ft.currency         = v.currency
);
