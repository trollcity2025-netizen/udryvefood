-- Update user_status enum
-- We add values one by one.
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'rejected';
