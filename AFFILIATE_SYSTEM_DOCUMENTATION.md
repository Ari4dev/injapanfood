# Shopee/BitKode Affiliate System Documentation

## Overview

The new affiliate system is a modern, browser-based attribution tracking system inspired by Shopee's affiliate model. It provides accurate last-click attribution, real-time commission tracking, and comprehensive payout management.

## Key Features

### 1. Browser-Based Attribution Tracking
- **Visitor ID**: Unique browser fingerprint stored in localStorage
- **Session ID**: Temporary session identifier stored in sessionStorage  
- **Attribution Window**: 1-day window from last referral click
- **Last-Click Attribution**: Most recent referral code wins

### 2. Commission Management
- **Automatic Creation**: Commissions created automatically on order placement
- **Status Workflow**: pending → approved → paid
- **Real-time Updates**: Live synchronization using Firestore subscriptions
- **Commission Rate**: Configurable (default 10%)

### 3. Payout System
- **Minimum Payout**: ¥1,000 (configurable)
- **Payment Methods**: Bank transfer, PayPal, other
- **Workflow**: pending → approved → processing → completed
- **Bank Information**: Secure storage of bank details

## Database Structure

### Collections

#### `shopee_affiliates`
Stores affiliate user profiles and statistics.

```typescript
{
  id: string;
  userId: string;
  email: string;
  displayName: string;
  referralCode: string;
  totalClicks: number;
  totalReferrals: number;
  totalOrders: number;
  totalGMV: number;
  totalCommission: number;
  pendingCommission: number;
  approvedCommission: number;
  paidCommission: number;
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  isActive: boolean;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  createdAt: string;
  updatedAt: string;
}
```

#### `affiliateAttribution`
Tracks visitor attribution and referral clicks.

```typescript
{
  id: string;
  visitorId: string;
  sessionId: string;
  referralCode: string;
  referrerId: string;
  firstClick: string;
  lastClick: string;
  attributionWindow: string;
  isActive: boolean;
  userId?: string;
  userEmail?: string;
  boundAt?: string;
  totalOrders: number;
  totalGMV: number;
  totalCommission: number;
  createdAt: string;
  updatedAt: string;
}
```

#### `affiliateOrders`
Records commissions for affiliate-referred orders.

```typescript
{
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  attributionId: string;
  referralCode: string;
  referrerId: string;
  orderTotal: number;
  orderDate: string;
  commissionRate: number;
  commissionAmount: number;
  commissionStatus: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### `shopee_affiliate_payouts`
Manages payout requests and history.

```typescript
{
  id: string;
  affiliateId: string;
  affiliateEmail: string;
  affiliateName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  method: 'bank_transfer' | 'paypal' | 'other';
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  commissionIds: string[];
  totalCommissions: number;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  notes?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### `shopee_affiliate_settings`
System-wide affiliate configuration.

```typescript
{
  id: string;
  commissionRate: number;
  minimumPayout: number;
  attributionWindowDays: number;
  payoutSchedule: 'weekly' | 'monthly' | 'manual';
  autoApprovePayouts: boolean;
  maxPayoutAmount: number;
  createdAt: string;
  updatedAt: string;
}
```

## User Guide

### For Affiliates

#### 1. Joining the Program
- Navigate to `/referral`
- Click "Join Now" button
- System automatically generates unique referral code

#### 2. Getting Your Referral Link
- Access dashboard at `/referral`
- Copy referral link from dashboard
- Format: `https://domain.com/?ref=YOURCODE`

#### 3. Tracking Performance
- **Dashboard Tab**: Overview of earnings and stats
- **Referrals Tab**: List of clicks and registrations
- **Commissions Tab**: Detailed commission history
- **Payouts Tab**: Payout request history

#### 4. Requesting Payouts
1. Ensure minimum balance (¥1,000)
2. Enter/update bank information
3. Enter payout amount
4. Click "Request Payout"
5. Wait for admin approval

### For Administrators

#### 1. Access Admin Panel
Navigate to `/admin/shopee-affiliate-management`

#### 2. Managing Affiliates
- **Overview Tab**: Top performers and recent activity
- **Affiliates Tab**: View all affiliates, activate/deactivate
- **Export Data**: Download CSV of affiliate data

#### 3. Commission Management
- **Pending Commissions**: Approve or reject
- **Filter by Status**: View specific commission states
- **Bulk Actions**: Process multiple commissions

#### 4. Payout Processing
1. **Pending**: Initial request from affiliate
2. **Approved**: Admin approves, funds allocated
3. **Processing**: Payment being processed
4. **Completed**: Payment sent to affiliate
5. **Rejected**: Request denied (funds returned)

#### 5. System Settings
- **Commission Rate**: Percentage of order total
- **Minimum Payout**: Minimum withdrawal amount
- **Attribution Window**: Days referral remains active

## API Integration

### Tracking Referral Clicks
```typescript
import { trackAffiliateClick } from '@/services/shopeeAffiliateSystem';

// When user visits with referral code
const urlParams = new URLSearchParams(window.location.search);
const refCode = urlParams.get('ref');
if (refCode) {
  await trackAffiliateClick(refCode);
}
```

### Creating Commission on Order
```typescript
import { createAffiliateCommission } from '@/services/shopeeAffiliateSystem';

// After order creation
await createAffiliateCommission(
  orderId,
  orderTotal,
  userId,
  userEmail
);
```

### Using the Hook
```typescript
import { useShopeeAffiliate } from '@/hooks/useShopeeAffiliate';

const MyComponent = () => {
  const {
    affiliate,
    commissions,
    payouts,
    referralLink,
    joinAffiliate,
    requestPayout,
    copyReferralLink
  } = useShopeeAffiliate();
  
  // Use affiliate data
};
```

## Testing Guide

### 1. Test Affiliate Registration
```bash
1. Login as regular user
2. Navigate to /referral
3. Click "Join Now"
4. Verify unique referral code generated
5. Check shopee_affiliates collection in Firebase
```

### 2. Test Referral Tracking
```bash
1. Copy referral link
2. Open incognito/private browser
3. Visit site with referral link
4. Check affiliateAttribution collection
5. Verify visitor ID and attribution created
```

### 3. Test Commission Creation
```bash
1. Use referral link in new browser
2. Place an order
3. Check affiliateOrders collection
4. Verify commission calculated correctly (10% default)
```

### 4. Test Payout Flow
```bash
1. Login as affiliate with approved commissions
2. Request payout from dashboard
3. Login as admin
4. Approve payout
5. Process payout
6. Complete payout
7. Verify affiliate balance updated
```

## Troubleshooting

### Common Issues

#### 1. Referral Not Tracking
- Check if referral code exists in URL
- Verify affiliate is active
- Check browser console for errors
- Ensure localStorage is not blocked

#### 2. Commission Not Created
- Verify attribution exists and is active
- Check attribution window (1 day)
- Ensure order creation includes user info
- Check Firestore rules allow creation

#### 3. Payout Request Failed
- Verify minimum balance met
- Check bank information is complete
- Ensure no pending payouts exist
- Verify Firestore rules allow creation

#### 4. Real-time Updates Not Working
- Check Firestore subscriptions in console
- Verify user is authenticated
- Check network connectivity
- Review Firestore rules for read access

## Security Considerations

1. **Bank Information**: Stored encrypted, never exposed in frontend
2. **Commission Approval**: Admin-only function
3. **Payout Processing**: Multi-step verification process
4. **Rate Limiting**: Prevent abuse of referral clicks
5. **Attribution Window**: Prevents old referrals from being used

## Performance Optimization

1. **Indexed Queries**: Use composite indexes for common queries
2. **Pagination**: Limit results for large datasets
3. **Caching**: Store frequently accessed data in memory
4. **Batch Operations**: Process multiple documents in transactions
5. **Real-time Subscriptions**: Limit to necessary collections

## Migration from Old System

### Data Not Migrated
As per requirements, old affiliate data is not migrated. Start fresh with new system.

### Parallel Operation
Both systems can run simultaneously during transition period.

### Cleanup
Old system files have been removed:
- `/src/hooks/useAffiliate.tsx`
- `/src/hooks/useAffiliateAdmin.tsx`
- Old affiliate components

## Future Enhancements

1. **Tiered Commission Rates**: Different rates based on performance
2. **Promotional Campaigns**: Time-limited increased commissions
3. **Advanced Analytics**: Detailed performance metrics
4. **Email Notifications**: Automated emails for milestones
5. **API Endpoints**: RESTful API for external integrations
6. **Mobile App**: Dedicated affiliate mobile application
7. **Social Media Integration**: Direct sharing to social platforms
8. **A/B Testing**: Test different commission structures

## Support

For technical support or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check Firestore data directly
4. Contact system administrator

## Version History

- **v2.0.0** (Current): Complete rewrite with Shopee-style system
- **v1.0.0** (Deprecated): Traditional affiliate system

---

Last Updated: 2025-01-09
System Version: 2.0.0
Attribution Window: 1 day
Default Commission: 10%
