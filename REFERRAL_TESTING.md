# 🧪 Referral Testing Guide

## 🚀 Testing Steps

### **Step 1: Test Referral Registration Flow**

1. **Create a test affiliate account:**
   ```
   Email: affiliate@test.com
   Name: Test Affiliate
   ```
   - Login and go to `/affiliate` 
   - Get referral code (example: `ABC12345`)

2. **Test referral signup process:**
   ```
   - Open: http://localhost:8080/?ref=ABC12345
   - Should redirect to: /auth?tab=signup&ref=ABC12345
   - Fill signup form with NEW user data:
     Email: newuser@test.com  
     Name: New User
     Referral Code: ABC12345 (should auto-populate)
   - Submit signup
   ```

3. **Check console logs for:**
   ```
   ✅ Stored referral code before signup: ABC12345
   🔗 Starting referral registration process...
   🔍 Referral check results: { referralCode: "ABC12345", isValid: true, ... }
   ✅ Processing referral registration for code: ABC12345
   ✅ User successfully registered with referral: ABC12345
   ✅ Cleared referral session after successful registration
   ```

4. **Verify in affiliate dashboard:**
   - Login as `affiliate@test.com`
   - Go to `/affiliate`
   - Check `Followers` count should be `1`
   - Check `Total Referrals` should be `1`

## 🔍 **Debug Checklist**

### **Console Logs to Look For:**

#### ✅ **Success Flow:**
```
🔗 Starting referral registration process...
🔍 Referral check results: { 
  referralCode: "ABC12345", 
  isValid: true, 
  userId: "...", 
  userEmail: "newuser@test.com", 
  userName: "New User" 
}
✅ Processing referral registration for code: ABC12345
Registering user with referral: { referralCode: "ABC12345", userId: "...", userEmail: "newuser@test.com", userName: "New User" }
Getting affiliate by referral code: ABC12345
Found affiliate by referral code: { id: "...", referralCode: "ABC12345", ... }
✅ User successfully registered with referral: ABC12345
User registered with referral successfully
Cleared referral session after successful registration
```

#### ❌ **Error Scenarios:**
```
❌ No valid referral code found: { referralCode: null, isValid: false }
❌ Error processing referral registration: [error details]
Referral error details: { message: "...", stack: "...", ... }
```

### **Database Verification:**

1. **Check `affiliates` collection:**
   ```
   - Find affiliate with referralCode: "ABC12345"  
   - Verify totalReferrals increased by 1
   ```

2. **Check `affiliate_referrals` collection:**
   ```
   - Should have new record with:
     - referralCode: "ABC12345"
     - referrerId: [affiliate document ID]
     - referredUserId: [new user ID]
     - referredUserEmail: "newuser@test.com"
     - referredUserName: "New User"
     - status: "registered"
   ```

## 🐛 **Common Issues & Solutions**

### **Issue 1: Storage Inconsistency**
**Problem:** Referral code not found during signup
**Solution:** Ensure both `AuthForm.tsx` and `referralUtils.ts` use same storage:
```javascript
// Both should use:
sessionStorage.setItem('currentSessionReferral', referralCode);
sessionStorage.getItem('currentSessionReferral');
```

### **Issue 2: Self-Referral**
**Problem:** User tries to use their own referral code
**Solution:** Check logs for:
```
Self-referral attempt blocked: { referralCode: "...", userId: "..." }
```

### **Issue 3: Duplicate Registration**
**Problem:** Same user registered multiple times
**Solution:** Check for:
```
User already registered with this referral code
```

### **Issue 4: Invalid Referral Code**
**Problem:** Code doesn't exist in database
**Solution:** Check for:
```
Affiliate not found for referral code: ABC12345
```

## 🎯 **Manual Testing Scenarios**

### **Scenario A: Happy Path**
1. Create affiliate account
2. Get referral code  
3. Use referral link in incognito browser
4. Register new account
5. Verify dashboard shows new follower

### **Scenario B: Self-Referral Prevention** 
1. Login as affiliate
2. Try to use own referral code during registration
3. Should show "Invalid referral code" message

### **Scenario C: Invalid Code**
1. Use non-existent referral code: `INVALID123`
2. Should show validation error during form submission

### **Scenario D: Empty/Missing Code**
1. Access `/auth?tab=signup` without ref parameter
2. Should work normally without referral processing
3. No referral-related logs should appear

## 📊 **Expected Results**

After successful referral registration:

### **Affiliate Dashboard (`/affiliate`):**
```
📊 Statistics:
- Total Clicks: [varies]
- Followers: +1 (increased)
- Total Referrals: +1 (increased) 
- Pending Commission: ¥0 (no orders yet)

👥 Followers Tab:
- Should show new user:
  Name: New User
  Email: newuser@test.com  
  Status: Registered
```

### **Referrals Tab:**
```
📋 Referral Record:
- Email: newuser@test.com
- Status: Registered  
- Registration Date: [current date]
```

## 🚨 **Troubleshooting Commands**

If issues persist, run in browser console:

### **Check Storage:**
```javascript
console.log('Session Storage:', {
  referralCode: sessionStorage.getItem('currentSessionReferral'),
  timestamp: sessionStorage.getItem('currentSessionReferralTimestamp')
});
```

### **Manual Debug:**
```javascript
// Import debug functions
import { debugReferralIssue, detectAbnormalElements, clearAllCaches, handleSESErrors } from './src/utils/debugUtils';

// Run diagnostics
debugReferralIssue();
detectAbnormalElements();

// Clear issues
handleSESErrors();
clearAllCaches();
```

### **Force Clear Everything:**
```javascript
// Nuclear option - clear all storage
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## ✅ **Success Criteria**

Test is successful when:
1. ✅ Console shows all success logs
2. ✅ Affiliate dashboard shows +1 follower
3. ✅ `affiliate_referrals` collection has new record
4. ✅ No error messages in console
5. ✅ New user account created successfully

---

**Last Updated:** January 2025  
**Version:** 2.0.0
