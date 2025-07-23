/*
  # Fix Affiliate Payout Bug

  1. New Fields
    - Add approved_commission field to affiliates table to track approved commissions separately
    - Add helper functions to calculate approved commission correctly

  2. Security
    - Ensure proper access to affiliate data
*/

-- Add approved_commission field to affiliates table if it doesn't exist
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS approved_commission INTEGER NOT NULL DEFAULT 0;

-- Create function to update affiliate commission stats
CREATE OR REPLACE FUNCTION update_affiliate_commission_stats(affiliate_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total_commission INTEGER;
  pending_commission INTEGER;
  approved_commission INTEGER;
BEGIN
  -- Calculate total commission from all commissions
  SELECT COALESCE(SUM(commission_amount), 0) INTO total_commission
  FROM affiliate_commissions
  WHERE affiliate_id = update_affiliate_commission_stats.affiliate_id;
  
  -- Calculate pending commission (only from pending status)
  SELECT COALESCE(SUM(commission_amount), 0) INTO pending_commission
  FROM affiliate_commissions
  WHERE affiliate_id = update_affiliate_commission_stats.affiliate_id
  AND status = 'pending';
  
  -- Calculate approved commission (only from approved status)
  SELECT COALESCE(SUM(commission_amount), 0) INTO approved_commission
  FROM affiliate_commissions
  WHERE affiliate_id = update_affiliate_commission_stats.affiliate_id
  AND status = 'approved';
  
  -- Update affiliate record
  UPDATE affiliates
  SET 
    total_commission = total_commission,
    pending_commission = pending_commission,
    approved_commission = approved_commission,
    updated_at = now()
  WHERE id = update_affiliate_commission_stats.affiliate_id;
END;
$$;

-- Create trigger function to update affiliate stats when commission status changes
CREATE OR REPLACE FUNCTION update_affiliate_stats_on_commission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If status changed, update affiliate stats
  IF OLD.status IS NULL OR OLD.status <> NEW.status THEN
    PERFORM update_affiliate_commission_stats(NEW.affiliate_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on affiliate_commissions table
DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON affiliate_commissions;
CREATE TRIGGER trigger_update_affiliate_stats
AFTER INSERT OR UPDATE ON affiliate_commissions
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_stats_on_commission_change();

-- Update all existing affiliate records to calculate correct stats
DO $$
DECLARE
  affiliate_record RECORD;
BEGIN
  FOR affiliate_record IN SELECT id FROM affiliates LOOP
    PERFORM update_affiliate_commission_stats(affiliate_record.id);
  END LOOP;
END $$;