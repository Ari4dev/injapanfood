/*
  # Fix Commission Duplication Bug

  1. Changes
    - Fix the logic for handling commission approval
    - Ensure approved commissions are correctly moved from pending to available
    - Fix the double-counting issue where approved commissions appear in both pending and available

  2. Security
    - Maintain existing security policies
*/

-- Create or replace function to handle commission approval
CREATE OR REPLACE FUNCTION handle_commission_approval(
  commission_id UUID,
  admin_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  commission_record RECORD;
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
  UPDATE affiliates
  SET 
    pending_commission = pending_commission - commission_record.commission_amount,
    approved_commission = COALESCE(approved_commission, 0) + commission_record.commission_amount,
    updated_at = NOW()
  WHERE id = commission_record.affiliate_id;
END;
$$;

-- Create or replace trigger function to update affiliate stats when commission status changes
CREATE OR REPLACE FUNCTION update_affiliate_stats_on_commission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If status changed from pending to approved
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    -- Move commission from pending to approved
    UPDATE affiliates
    SET 
      pending_commission = pending_commission - NEW.commission_amount,
      approved_commission = COALESCE(approved_commission, 0) + NEW.commission_amount,
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  -- If status changed from approved to rejected
  ELSIF OLD.status = 'approved' AND NEW.status = 'rejected' THEN
    -- Remove from approved commission
    UPDATE affiliates
    SET 
      approved_commission = COALESCE(approved_commission, 0) - NEW.commission_amount,
      total_commission = total_commission - NEW.commission_amount,
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  -- If status changed from pending to rejected
  ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    -- Remove from pending commission and total
    UPDATE affiliates
    SET 
      pending_commission = pending_commission - NEW.commission_amount,
      total_commission = total_commission - NEW.commission_amount,
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on affiliate_commissions table
DROP TRIGGER IF EXISTS trigger_update_affiliate_stats_on_commission_change ON affiliate_commissions;
CREATE TRIGGER trigger_update_affiliate_stats_on_commission_change
AFTER UPDATE ON affiliate_commissions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_affiliate_stats_on_commission_change();

-- Fix existing data to correct any commission duplication issues
DO $$
DECLARE
  affiliate_record RECORD;
  pending_sum INTEGER;
  approved_sum INTEGER;
  total_sum INTEGER;
  pending_commissions RECORD;
  approved_commissions RECORD;
BEGIN
  -- For each affiliate
  FOR affiliate_record IN SELECT id FROM affiliates LOOP
    -- Calculate correct sums
    SELECT COALESCE(SUM(commission_amount), 0) INTO pending_sum
    FROM affiliate_commissions
    WHERE affiliate_id = affiliate_record.id AND status = 'pending';
    
    SELECT COALESCE(SUM(commission_amount), 0) INTO approved_sum
    FROM affiliate_commissions
    WHERE affiliate_id = affiliate_record.id AND status = 'approved';
    
    -- Total should be the sum of pending and approved
    total_sum := pending_sum + approved_sum;
    
    -- Update affiliate record with correct values
    UPDATE affiliates
    SET 
      pending_commission = pending_sum,
      approved_commission = approved_sum,
      total_commission = total_sum,
      updated_at = NOW()
    WHERE id = affiliate_record.id;
    
    RAISE NOTICE 'Fixed affiliate %: pending=%, approved=%, total=%', 
      affiliate_record.id, pending_sum, approved_sum, total_sum;
  END LOOP;
END $$;