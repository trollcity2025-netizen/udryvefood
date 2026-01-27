-- Add document columns to driver_profiles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'license_front_url') THEN
        ALTER TABLE driver_profiles ADD COLUMN license_front_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'license_back_url') THEN
        ALTER TABLE driver_profiles ADD COLUMN license_back_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'insurance_url') THEN
        ALTER TABLE driver_profiles ADD COLUMN insurance_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'insurance_expiry') THEN
        ALTER TABLE driver_profiles ADD COLUMN insurance_expiry DATE;
    END IF;
END $$;

-- Create driver_document_updates table
CREATE TABLE IF NOT EXISTS driver_document_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES driver_profiles(user_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'license_front', 'license_back', 'insurance'
  document_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Store extra info like expiry date for insurance
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE driver_document_updates ENABLE ROW LEVEL SECURITY;

-- Policies for driver_document_updates
DROP POLICY IF EXISTS "Drivers can view own updates" ON driver_document_updates;
CREATE POLICY "Drivers can view own updates" ON driver_document_updates
  FOR SELECT USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Drivers can insert own updates" ON driver_document_updates;
CREATE POLICY "Drivers can insert own updates" ON driver_document_updates
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Admins can view all updates" ON driver_document_updates;
CREATE POLICY "Admins can view all updates" ON driver_document_updates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update status" ON driver_document_updates;
CREATE POLICY "Admins can update status" ON driver_document_updates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to approve document
CREATE OR REPLACE FUNCTION admin_approve_driver_document(p_update_id UUID)
RETURNS VOID AS $$
DECLARE
  v_update RECORD;
BEGIN
  -- Get the update record
  SELECT * INTO v_update FROM driver_document_updates WHERE id = p_update_id;
  
  IF v_update IS NULL THEN
    RAISE EXCEPTION 'Update not found';
  END IF;

  -- Update driver_profiles
  IF v_update.document_type = 'license_front' THEN
    UPDATE driver_profiles SET license_front_url = v_update.document_url WHERE user_id = v_update.driver_id;
  ELSIF v_update.document_type = 'license_back' THEN
    UPDATE driver_profiles SET license_back_url = v_update.document_url WHERE user_id = v_update.driver_id;
  ELSIF v_update.document_type = 'insurance' THEN
    UPDATE driver_profiles 
    SET 
        insurance_url = v_update.document_url,
        insurance_expiry = (v_update.metadata->>'expiry')::DATE 
    WHERE user_id = v_update.driver_id;
  END IF;

  -- Mark update as approved
  UPDATE driver_document_updates SET status = 'approved', updated_at = NOW() WHERE id = p_update_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
