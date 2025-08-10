# Affiliate System Migration Plan

## Current Status
- **Old System**: Traditional affiliate system using collections: `affiliates`, `affiliate_referrals`, `affiliate_commissions`, `affiliate_payouts`
- **New System**: BitKode/Shopee-style system using: `shopee_affiliates`, `affiliateAttribution`, `affiliateOrders`

## Features to Add to New System

### 1. Payout Management
- [ ] Create payout request functionality
- [ ] Payout approval workflow
- [ ] Payout history tracking
- [ ] Payment method management (Bank transfer, etc.)

### 2. Bank Information
- [ ] Add bank info fields to shopee_affiliates collection
- [ ] Bank account validation
- [ ] Secure storage of sensitive information

### 3. Affiliate Dashboard
- [ ] Migrate from old useAffiliate hook to new system
- [ ] Update all dashboard components to use new data structure
- [ ] Maintain backward compatibility during transition

### 4. Missing Core Features
- [ ] Follower tracking (users who registered via referral)
- [ ] Performance analytics
- [ ] Promotion materials
- [ ] Settings management

## Migration Steps

### Phase 1: Add Missing Features to New System
1. Implement payout functionality in new system
2. Add bank information management
3. Create follower tracking
4. Add settings management

### Phase 2: Create New Hooks and Services
1. Create `useShopeeAffiliate` hook to replace `useAffiliate`
2. Update all services to use new collections
3. Create migration utilities

### Phase 3: Update UI Components
1. Update Referral page to use new system
2. Update admin panels
3. Update all affiliate components

### Phase 4: Data Migration
1. Migrate existing affiliate users to shopee_affiliates
2. Convert old referrals to new attribution system
3. Migrate commission history
4. Transfer payout records

### Phase 5: Cleanup
1. Remove old affiliate services
2. Remove old hooks
3. Clean up unused components
4. Update Firestore rules

## Database Schema Changes

### New Collections Needed:
```typescript
// shopee_affiliate_payouts
interface ShopeeAffiliatePayout {
  id: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  method: 'bank_transfer' | 'paypal' | 'other';
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  notes?: string;
}

// shopee_affiliate_settings
interface ShopeeAffiliateSettings {
  commissionRate: number;
  minimumPayout: number;
  attributionWindowDays: number;
  payoutSchedule: 'weekly' | 'monthly';
}
```

### Updates to existing collections:
```typescript
// Add to shopee_affiliates
interface ShopeeAffiliate {
  // ... existing fields
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  payoutMethod?: 'bank_transfer' | 'paypal' | 'other';
  totalPayouts?: number;
  lastPayoutDate?: string;
}
```

## Implementation Priority
1. **High Priority**: Payout system (blocking issue for affiliates)
2. **High Priority**: Dashboard migration 
3. **Medium Priority**: Data migration utilities
4. **Low Priority**: Cleanup and optimization

## Testing Requirements
- [ ] Test payout request flow
- [ ] Verify commission calculations match
- [ ] Test attribution tracking
- [ ] Validate data migration
- [ ] Performance testing with large datasets

## Rollback Plan
1. Keep old system collections intact during migration
2. Create backup of all data before migration
3. Implement feature flags to switch between systems
4. Gradual rollout to users
