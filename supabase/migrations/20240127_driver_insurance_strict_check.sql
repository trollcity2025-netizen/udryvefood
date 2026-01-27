
-- Add status column to driver_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'status') THEN
        ALTER TABLE driver_profiles ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Function to check insurance expiry and restrict drivers
CREATE OR REPLACE FUNCTION check_driver_insurance_expiry()
RETURNS VOID AS $$
BEGIN
  -- Restrict drivers whose insurance expired more than 48 hours ago
  UPDATE driver_profiles
  SET status = 'restricted'
  WHERE insurance_expiry < (NOW() - INTERVAL '48 hours')
  AND status != 'restricted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the admin approval function to reactivate driver upon insurance approval
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
        insurance_expiry = (v_update.metadata->>'expiry')::DATE,
        status = 'active' -- Reactivate driver if they were restricted
    WHERE user_id = v_update.driver_id;
  END IF;

  -- Mark update as approved
  UPDATE driver_document_updates SET status = 'approved', updated_at = NOW() WHERE id = p_update_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
