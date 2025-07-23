/*
  # Fix Payout Logic

  1. Changes
    - Fix the logic for handling payout requests
    - Ensure available commission is correctly calculated and updated
    - Add trigger to properly update affiliate stats when payout is requested

  2. Security
    - Maintain existing security policies
*/

-- Create or replace function to handle payout requests
CREATE OR REPLACE FUNCTION handle_payout_request(
  affiliate_id UUID,
  amount INTEGER,
  method TEXT,
  bank_info JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  available_commission INTEGER;
  min_payout_amount INTEGER;
  payout_id UUID;
BEGIN
  -- Get minimum payout amount from settings
  SELECT default_commission_rate INTO min_payout_amount
  FROM affiliate_settings
  WHERE id = 'default';
  
  IF min_payout_amount IS NULL THEN
    min_payout_amount := 5000; -- Default if not found
  END IF;
  
  -- Get affiliate data
  SELECT (total_commission - pending_commission) INTO available_commission
  FROM affiliates
  WHERE id = affiliate_id;
  
  -- Validate amount
  IF amount < min_payout_amount THEN
    RAISE EXCEPTION 'Minimum payout amount is ¥%', min_payout_amount;
  END IF;
  
  IF amount > available_commission THEN
    RAISE EXCEPTION 'Insufficient available commission';
  END IF;
  
  -- Create payout request
  INSERT INTO affiliate_payouts (
    affiliate_id,
    amount,
    method,
    status,
    bank_info,
    requested_at
  ) VALUES (
    affiliate_id,
    amount,
    method,
    'pending',
    bank_info,
    NOW()
  ) RETURNING id INTO payout_id;
  
  -- Update affiliate stats - INCREASE pending_commission to REDUCE available commission
  UPDATE affiliates
  SET 
    pending_commission = pending_commission + amount,
    updated_at = NOW()
  WHERE id = affiliate_id;
  
  RETURN payout_id;
END;
$$;

-- Create or replace function to process payout
CREATE OR REPLACE FUNCTION process_payout(
  payout_id UUID,
  admin_id UUID,
  new_status TEXT,
  notes TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payout_record RECORD;
BEGIN
  -- Get payout details
  SELECT * INTO payout_record
  FROM affiliate_payouts
  WHERE id = payout_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout not found';
  END IF;
  
  -- Update payout status based on new status
  IF new_status = 'processing' THEN
    UPDATE affiliate_payouts
    SET 
      status = 'processing',
      processed_at = NOW(),
      processed_by = admin_id,
      notes = COALESCE(notes, affiliate_payouts.notes)
    WHERE id = payout_id;
    
  ELSIF new_status = 'completed' THEN
    UPDATE affiliate_payouts
    SET 
      status = 'completed',
      completed_at = NOW(),
      completed_by = admin_id,
      notes = COALESCE(notes, affiliate_payouts.notes)
    WHERE id = payout_id;
    
    -- Update affiliate stats - move from pending to paid
    UPDATE affiliates
    SET 
      pending_commission = pending_commission - payout_record.amount,
      paid_commission = paid_commission + payout_record.amount,
      updated_at = NOW()
    WHERE id = payout_record.affiliate_id;
    
  ELSIF new_status = 'rejected' THEN
    UPDATE affiliate_payouts
    SET 
      status = 'rejected',
      rejected_at = NOW(),
      rejected_by = admin_id,
      notes = COALESCE(notes, affiliate_payouts.notes)
    WHERE id = payout_id;
    
    -- Return amount to available commission by reducing pending
    UPDATE affiliates
    SET 
      pending_commission = pending_commission - payout_record.amount,
      updated_at = NOW()
    WHERE id = payout_record.affiliate_id;
    
  ELSIF new_status = 'paid' THEN
    UPDATE affiliate_payouts
    SET 
      status = 'paid',
      paid_at = NOW(),
      paid_by = admin_id,
      notes = COALESCE(notes, affiliate_payouts.notes)
    WHERE id = payout_id;
    
  ELSE
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;
END;
$$;

-- Create trigger function to update affiliate stats when payout status changes
CREATE OR REPLACE FUNCTION update_affiliate_stats_on_payout_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If status changed from pending to something else
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    -- If rejected, return amount to available commission
    IF NEW.status = 'rejected' THEN
      UPDATE affiliates
      SET 
        pending_commission = pending_commission - NEW.amount,
        updated_at = NOW()
      WHERE id = NEW.affiliate_id;
    -- If completed or paid, move from pending to paid
    ELSIF NEW.status = 'completed' OR NEW.status = 'paid' THEN
      UPDATE affiliates
      SET 
        pending_commission = pending_commission - NEW.amount,
        paid_commission = paid_commission + NEW.amount,
        updated_at = NOW()
      WHERE id = NEW.affiliate_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on affiliate_payouts table
DROP TRIGGER IF EXISTS trigger_update_affiliate_stats_on_payout ON affiliate_payouts;
CREATE TRIGGER trigger_update_affiliate_stats_on_payout
AFTER UPDATE ON affiliate_payouts
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_stats_on_payout_change();