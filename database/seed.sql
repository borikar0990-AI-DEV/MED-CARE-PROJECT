-- =============================================================================
-- MediCare — reference demo data
-- =============================================================================
-- This is a plain-SQL mirror of backend/app/services/seed_service.py, provided
-- for anyone inspecting/setting up the database directly with psql. The
-- running app seeds the same data automatically via Python (which is also
-- how it correctly bcrypt-hashes the password) — you don't need to run this
-- file for the app to work.
--
-- Demo login:  demo@medicare.app / Demo@1234
--
-- NOTE: the password hash below is a real bcrypt hash of "Demo@1234"
-- (cost factor 12), generated and verified to round-trip correctly, so
-- this file is fully usable standalone (not just illustrative).
-- =============================================================================

INSERT INTO users (name, email, password_hash, phone, notif_browser_enabled, notif_email_enabled)
VALUES (
    'Demo User',
    'demo@medicare.app',
    '$2b$12$gJJUE7wOIsTXmFV6R3dyieQiSfWE4spXGCCg2hdls8MzamxA5AeSy',
    '+91 90000 00000',
    TRUE,
    FALSE
)
ON CONFLICT (email) DO NOTHING;

-- Vitamin Tablet — once daily, 08:00
INSERT INTO medications (user_id, name, type, dosage, quantity, frequency, instructions, notes, start_date, is_demo)
SELECT id, 'Vitamin Tablet', 'tablet', '1 tablet', 28, 'once_daily', 'after_food',
       'General daily multivitamin.', CURRENT_DATE, TRUE
FROM users WHERE email = 'demo@medicare.app';

INSERT INTO medication_schedules (medication_id, time, days_of_week)
SELECT id, '08:00', 'ALL' FROM medications WHERE name = 'Vitamin Tablet' AND is_demo = TRUE;

-- Paracetamol — three times daily
INSERT INTO medications (user_id, name, type, dosage, quantity, frequency, instructions, notes, start_date, is_demo)
SELECT id, 'Paracetamol', 'tablet', '500 mg', 15, 'thrice_daily', 'after_food',
       'For fever/mild pain.', CURRENT_DATE, TRUE
FROM users WHERE email = 'demo@medicare.app';

INSERT INTO medication_schedules (medication_id, time, days_of_week)
SELECT id, t.time, 'ALL'
FROM medications, (VALUES ('08:00'::time), ('14:00'::time), ('20:00'::time)) AS t(time)
WHERE medications.name = 'Paracetamol' AND medications.is_demo = TRUE;

-- Cough Syrup — twice daily, low stock on purpose (demonstrates the low-stock signal)
INSERT INTO medications (user_id, name, type, dosage, quantity, frequency, instructions, notes, start_date, is_demo)
SELECT id, 'Cough Syrup', 'syrup', '10 ml', 1, 'twice_daily', 'with_food',
       'Shake well before use.', CURRENT_DATE, TRUE
FROM users WHERE email = 'demo@medicare.app';

INSERT INTO medication_schedules (medication_id, time, days_of_week)
SELECT id, t.time, 'ALL'
FROM medications, (VALUES ('09:00'::time), ('21:00'::time)) AS t(time)
WHERE medications.name = 'Cough Syrup' AND medications.is_demo = TRUE;

-- Today's pending dose occurrences (medication_logs) are intentionally left
-- for the app's background scheduler to generate on first startup — see
-- services/medication_service.ensure_logs_for_date(). This keeps this file
-- simple and avoids hand-computing timestamps that would be stale the
-- moment this file is read.
