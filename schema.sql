-- Supabase table schema for AccountInfo
-- Generated from Google Sheet

CREATE TABLE IF NOT EXISTS account_info (
  id BIGSERIAL PRIMARY KEY,
  active TEXT,
  bp TEXT,
  primary_holder TEXT,
  account JSONB,
  due INTEGER,
  last_download DATE,
  account_number TEXT,
  code TEXT,
  expiration TEXT,
  updated DATE,
  activated TEXT,
  closed TEXT,
  annual_fee TEXT,
  phone TEXT,
  points TEXT,
  revisit TEXT,
  comments TEXT
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_account_info_id ON account_info(id);

-- Add GIN index for JSONB column for faster queries
CREATE INDEX IF NOT EXISTS idx_account_info_account ON account_info USING GIN (account);

-- Column mappings:
-- "Active" -> active
-- "BP" -> bp
-- "Primary" -> primary_holder
-- "Account" -> account (JSONB: stores {text, url} from Google Sheets hyperlink)
-- "Due" -> due
-- "Last Download" -> last_download
-- "Account Number" -> account_number
-- "Code" -> code
-- "Expiration" -> expiration
-- "Updated" -> updated
-- "Activated" -> activated
-- "Closed" -> closed
-- "Annual Fee" -> annual_fee
-- "Phone" -> phone
-- "Points" -> points
-- "Revisit" -> revisit
-- "Comments" -> comments
