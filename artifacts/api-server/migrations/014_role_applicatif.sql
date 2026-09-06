ALTER TABLE user_ ADD COLUMN IF NOT EXISTS role_applicatif VARCHAR(20);

UPDATE user_ u
SET role_applicatif = CASE
  WHEN c.role = 'ADMIN' THEN 'ADMIN'
  WHEN c.role IN ('REC', 'CHZ') THEN 'RECRUTEUR'
  WHEN c.role IN ('CM1', 'CM2') THEN 'CM'
  WHEN c.role = 'CAN' THEN 'CANDIDAT'
END
FROM contact c
WHERE c.id_contact = u.id_contact
  AND u.role_applicatif IS NULL;

ALTER TABLE user_ ALTER COLUMN role_applicatif SET NOT NULL;
ALTER TABLE user_ DROP CONSTRAINT IF EXISTS chk_role_applicatif;
ALTER TABLE user_ ADD CONSTRAINT chk_role_applicatif
  CHECK (role_applicatif IN ('ADMIN', 'RECRUTEUR', 'CM', 'CANDIDAT'));