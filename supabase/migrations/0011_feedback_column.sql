-- Add changes_requested to user_status enum
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'changes_requested';

-- Add admin_notes column to application tables
ALTER TABLE public.driver_applications 
ADD COLUMN IF NOT EXISTS admin_notes text;

ALTER TABLE public.restaurant_applications 
ADD COLUMN IF NOT EXISTS admin_notes text;
