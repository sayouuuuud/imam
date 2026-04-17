-- ============================================================================
-- IndexNow key — row seed for site_settings
-- ----------------------------------------------------------------------------
-- Stores a stable random key in site_settings so that:
--   GET /api/indexnow/key
-- always returns the SAME string between deployments. IndexNow (Bing /
-- Yandex / Seznam / Yep / Naver) fetches that URL to verify ownership —
-- rotating the key would break verification permanently.
--
-- The script is idempotent: it will NOT overwrite a key that already exists.
-- Safe to run multiple times.
-- ============================================================================

DO $$
DECLARE
  v_key_col   text;
  v_val_col   text;
  v_generated text := replace(gen_random_uuid()::text, '-', '');
  v_exists    boolean;
BEGIN
  -- Detect whether the table uses (key, value) or (setting_key, setting_value)
  SELECT CASE
           WHEN EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'site_settings' AND column_name = 'key')
           THEN 'key' ELSE 'setting_key'
         END,
         CASE
           WHEN EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'site_settings' AND column_name = 'value')
           THEN 'value' ELSE 'setting_value'
         END
    INTO v_key_col, v_val_col;

  -- Does a usable indexnow_key row already exist?
  EXECUTE format(
    'SELECT EXISTS (SELECT 1 FROM site_settings
                    WHERE %I = $1
                      AND %I IS NOT NULL
                      AND length(trim(%I)) >= 8)',
    v_key_col, v_val_col, v_val_col
  ) INTO v_exists USING 'indexnow_key';

  IF NOT v_exists THEN
    -- Delete any broken/empty rows first, then insert a fresh one.
    EXECUTE format(
      'DELETE FROM site_settings WHERE %I = $1',
      v_key_col
    ) USING 'indexnow_key';

    EXECUTE format(
      'INSERT INTO site_settings (%I, %I) VALUES ($1, $2)',
      v_key_col, v_val_col
    ) USING 'indexnow_key', v_generated;

    RAISE NOTICE 'Inserted new indexnow_key: %', v_generated;
  ELSE
    RAISE NOTICE 'indexnow_key already exists — not modified.';
  END IF;
END $$;

-- Verify (uncomment one of these depending on your schema):
-- SELECT key, value        FROM site_settings WHERE key         = 'indexnow_key';
-- SELECT setting_key, setting_value FROM site_settings WHERE setting_key = 'indexnow_key';
