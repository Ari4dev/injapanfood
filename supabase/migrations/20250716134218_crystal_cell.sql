/*
  # Fix Negative Commission Values

  1. Changes
    - Prevent negative commission values in affiliate stats
    - Fix calculation of pending and approved commissions
    - Add safeguards to ensure commission values are always non-negative

  2. Security
    - Maintain existing security policies
*/

-- Create or replace function to handle commission approval with non-negative checks
CREATE OR REPLACE FUNCTION handle_commission_approval(
  commission_id UUID,
  admin_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  commission_record RECORD;
  current_pending INTEGER;
  current_approved INTEGER;
BEGIN
  -- Get commission details
  SELECT * INTO commission_record
  FROM affiliate_commissions
  WHERE id = commission_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commission not found';
  END IF;
  
  -- Check if commission is already approved
  IF commission_record.status = 'approved' THEN
    RAISE EXCEPTION 'Commission is already approved';
  END IF;
  
  -- Get current values to ensure we don't go negative
  SELECT pending_commission, approved_commission INTO current_pending, current_approved
  FROM affiliates
  WHERE id = commission_record.affiliate_id;
  
  -- Update commission status
  UPDATE affiliate_commissions
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = admin_id,
    updated_at = NOW()
  WHERE id = commission_id;
  
  -- Update referral if exists
  IF commission_record.referral_id IS NOT NULL THEN
    UPDATE affiliate_referrals
    SET 
      status = 'approved',
      approved_at = NOW(),
      approved_by = admin_id,
      updated_at = NOW()
    WHERE id = commission_record.referral_id;
  END IF;
  
  -- Update affiliate stats - DECREASE pending_commission to INCREASE available commission
  -- Use GREATEST to ensure values never go below zero
  UPDATE affiliates
  SET 
    pending_commission = GREATEST(0, current_pending - commission_record.commission_amount),
    approved_commission = current_approved + commission_record.commission_amount,
    updated_at = NOW()
  WHERE id = commission_record.affiliate_id;
END;
$$;

-- Create or replace trigger function to update affiliate stats when commission status changes
CREATE OR REPLACE FUNCTION update_affiliate_stats_on_commission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_pending INTEGER;
  current_approved INTEGER;
  current_total INTEGER;
BEGIN
  -- Get current values to ensure we don't go negative
  SELECT 
    pending_commission, 
    approved_commission,
    total_commission 
  INTO 
    current_pending, 
    current_approved,
    current_total
  FROM affiliates
  WHERE id = NEW.affiliate_id;
  
  -- If status changed from pending to approved
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    -- Move commission from pending to approved
    UPDATE affiliates
    SET 
      pending_commission = GREATEST(0, current_pending - NEW.commission_amount),
      approved_commission = current_approved + NEW.commission_amount,
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  -- If status changed from approved to rejected
  ELSIF OLD.status = 'approved' AND NEW.status = 'rejected' THEN
    -- Remove from approved commission
    UPDATE affiliates
    SET 
      approved_commission = GREATEST(0, current_approved - NEW.commission_amount),
      total_commission = GREATEST(0, current_total - NEW.commission_amount),
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  -- If status changed from pending to rejected
  ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    -- Remove from pending commission and total
    UPDATE affiliates
    SET 
      pending_commission = GREATEST(0, current_pending - NEW.commission_amount),
      total_commission = GREATEST(0, current_total - NEW.commission_amount),
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create or replace function to handle payout requests with non-negative checks
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
  current_pending INTEGER;
  current_approved INTEGER;
BEGIN
  -- Get minimum payout amount from settings
  SELECT default_commission_rate INTO min_payout_amount
  FROM affiliate_settings
  WHERE id = 'default';
  
  IF min_payout_amount IS NULL THEN
    min_payout_amount := 5000; -- Default if not found
  END IF;
  
  -- Get affiliate data
  SELECT 
    approved_commission,
    pending_commission
  INTO 
    available_commission,
    current_pending
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
  -- Use approved_commission directly instead of calculating from total - pending
  UPDATE affiliates
  SET 
    pending_commission = current_pending + amount,
    approved_commission = GREATEST(0, available_commission - amount),
    updated_at = NOW()
  WHERE id = affiliate_id;
  
  RETURN payout_id;
END;
$$;

-- Fix existing data to ensure no negative values
DO $$
DECLARE
  affiliate_record RECORD;
  pending_sum INTEGER;
  approved_sum INTEGER;
  total_sum INTEGER;
BEGIN
  -- For each affiliate
  FOR affiliate_record IN SELECT id FROM affiliates LOOP
    -- Calculate correct sums from commissions
    SELECT COALESCE(SUM(commission_amount), 0) INTO pending_sum
    FROM affiliate_commissions
    WHERE affiliate_id = affiliate_record.id AND status = 'pending';
    
    SELECT COALESCE(SUM(commission_amount), 0) INTO approved_sum
    FROM affiliate_commissions
    WHERE affiliate_id = affiliate_record.id AND status = 'approved';
    
    -- Total should be the sum of pending and approved
    total_sum := pending_sum + approved_sum;
    
    -- Update affiliate record with correct values, ensuring no negative values
    UPDATE affiliates
    SET 
      pending_commission = GREATEST(0, pending_sum),
      approved_commission = GREATEST(0, approved_sum),
      total_commission = GREATEST(0, total_sum),
      updated_at = NOW()
    WHERE id = affiliate_record.id;
    
    RAISE NOTICE 'Fixed affiliate %: pending=%, approved=%, total=%', 
      affiliate_record.id, pending_sum, approved_sum, total_sum;
  END LOOP;
END $$;