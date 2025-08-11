import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Wallet
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useFirebaseAuth';

interface BankInformation {
  id?: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchName?: string;
  branchCode?: string;
  swiftCode?: string;
  country: string;
  currency: string;
  accountType: string;
  isActive: boolean;
  isDefault: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const UserBankInformationManager = () => {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankInformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAccountNumbers, setShowAccountNumbers] = useState<{[key: string]: boolean}>({});
  const [hasManuallyDeleted, setHasManuallyDeleted] = useState(false);
  
  const [formData, setFormData] = useState<BankInformation>({
    userId: user?.uid || '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branchName: '',
    branchCode: '',
    swiftCode: '',
    country: 'Japan',
    currency: 'JPY',
    accountType: 'checking',
    isActive: true,
    isDefault: false,
    notes: '',
    createdAt: '',
    updatedAt: ''
  });

  const countries = [
    { code: 'JP', name: 'Japan', currency: 'JPY' },
    { code: 'ID', name: 'Indonesia', currency: 'IDR' }
  ];

  const accountTypes = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'business', label: 'Business Account' }
  ];

  useEffect(() => {
    if (user?.uid) {
      checkMigrationFlag();
      loadUserBankAccounts();
    }
  }, [user]);

  // Check if user has previously deleted all accounts to prevent auto-migration
  const checkMigrationFlag = async () => {
    if (!user?.uid) return;
    
    try {
      // Check for migration flag in shopee_affiliates collection instead
      const affiliatesQuery = query(
        collection(db, 'shopee_affiliates'),
        where('userId', '==', user.uid)
      );
      const affiliateSnapshot = await getDocs(affiliatesQuery);
      
      if (!affiliateSnapshot.empty) {
        const affiliateData = affiliateSnapshot.docs[0].data();
        if (affiliateData.hasDeletedAllBankAccounts) {
          setHasManuallyDeleted(true);
        }
      }
    } catch (error) {
      console.error('Error checking migration flag:', error);
    }
  };

  // Migration function to import bank data from legacy system (shopee_affiliates)
  const migrateLegacyBankData = async () => {
    if (!user?.uid || hasManuallyDeleted) return;

    try {
      // Check if user already has bank accounts in new system
      if (bankAccounts.length > 0) {
        return; // Already migrated or has new data
      }

      // Look for bank info in legacy shopee_affiliates collection
      const affiliatesQuery = query(
        collection(db, 'shopee_affiliates'),
        where('userId', '==', user.uid)
      );
      const affiliateSnapshot = await getDocs(affiliatesQuery);

      if (!affiliateSnapshot.empty) {
        const affiliateData = affiliateSnapshot.docs[0].data();
        
        // Check if user has previously deleted all bank accounts
        if (affiliateData.hasDeletedAllBankAccounts) {
          return; // Don't auto-migrate if user has previously deleted all accounts
        }
        
        const legacyBankInfo = affiliateData.bankInfo;

        if (legacyBankInfo && legacyBankInfo.bankName && legacyBankInfo.accountNumber) {
          console.log('Found legacy bank data, migrating...', legacyBankInfo);
          
          // Create new bank account from legacy data
          const timestamp = new Date().toISOString();
          const migratedAccount: Omit<BankInformation, 'id'> = {
            userId: user.uid,
            bankName: legacyBankInfo.bankName,
            accountNumber: legacyBankInfo.accountNumber,
            accountHolder: legacyBankInfo.accountName || legacyBankInfo.accountHolder || 'Unknown',
            branchName: '',
            branchCode: '',
            swiftCode: '',
            country: 'Japan', // Default assumption
            currency: 'JPY',
            accountType: 'checking',
            isActive: true,
            isDefault: true, // Set as default since it's the only one
            notes: 'Migrated from legacy system',
            createdAt: timestamp,
            updatedAt: timestamp
          };

          await addDoc(collection(db, 'user_bank_accounts'), migratedAccount);
          
          toast({
            title: 'Bank Data Migrated',
            description: 'Your existing bank information has been imported successfully!',
          });

          // Reload data to show migrated account
          loadUserBankAccounts();
        }
      }
    } catch (error) {
      console.error('Error migrating legacy bank data:', error);
      // Don't show error toast for migration failures, just log it
    }
  };

  const loadUserBankAccounts = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const q = query(collection(db, 'user_bank_accounts'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const accounts: BankInformation[] = [];
      
      querySnapshot.forEach((doc) => {
        accounts.push({
          id: doc.id,
          ...doc.data()
        } as BankInformation);
      });

      // Sort by isDefault (default first), then by createdAt (newest first)
      accounts.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setBankAccounts(accounts);
      
      // If no accounts found, try to migrate legacy data
      if (accounts.length === 0) {
        migrateLegacyBankData();
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bank accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setFormData({
        ...formData,
        country: country.name,
        currency: country.currency
      });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.bankName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Bank name is required',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.accountNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Account number is required',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.accountHolder.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Account holder name is required',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user?.uid) return;

    try {
      const timestamp = new Date().toISOString();
      
      if (isEditing) {
        // Update existing account
        const accountRef = doc(db, 'user_bank_accounts', isEditing);
        await updateDoc(accountRef, {
          ...formData,
          updatedAt: timestamp
        });

        toast({
          title: 'Success',
          description: 'Bank account updated successfully'
        });
      } else {
        // Add new account
        await addDoc(collection(db, 'user_bank_accounts'), {
          ...formData,
          userId: user.uid,
          createdAt: timestamp,
          updatedAt: timestamp
        });

        toast({
          title: 'Success',
          description: 'Bank account added successfully'
        });
      }

      // If this account is set as default, update other accounts
      if (formData.isDefault) {
        await handleSetDefault(isEditing || 'new');
      }

      resetForm();
      loadUserBankAccounts();
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast({
        title: 'Error',
        description: 'Failed to save bank account',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (account: BankInformation) => {
    setIsEditing(account.id || null);
    setFormData(account);
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'user_bank_accounts', accountId));
      
      // Check if this was the last account
      const remainingAccounts = bankAccounts.filter(acc => acc.id !== accountId);
      if (remainingAccounts.length === 0 && user?.uid) {
        // Set flag to prevent auto-migration after deleting all accounts
        setHasManuallyDeleted(true);
        
        // Update the shopee_affiliates document with deletion flag for persistence
        try {
          const affiliatesQuery = query(
            collection(db, 'shopee_affiliates'),
            where('userId', '==', user.uid)
          );
          const affiliateSnapshot = await getDocs(affiliatesQuery);
          
          if (!affiliateSnapshot.empty) {
            const affiliateDoc = affiliateSnapshot.docs[0];
            await updateDoc(doc(db, 'shopee_affiliates', affiliateDoc.id), {
              hasDeletedAllBankAccounts: true,
              bankAccountsDeletedAt: new Date().toISOString()
            });
          }
        } catch (flagError) {
          console.error('Error saving migration flag:', flagError);
          // Don't fail the deletion if flag saving fails
        }
      }
      
      toast({
        title: 'Success',
        description: 'Bank account deleted successfully'
      });
      loadUserBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bank account',
        variant: 'destructive'
      });
    }
  };

  const handleSetDefault = async (accountId: string) => {
    if (!user?.uid) return;

    try {
      // First, remove default status from all user's accounts
      const q = query(collection(db, 'user_bank_accounts'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const updatePromises: Promise<void>[] = [];

      querySnapshot.forEach((docSnapshot) => {
        if (docSnapshot.id !== accountId) {
          const accountRef = doc(db, 'user_bank_accounts', docSnapshot.id);
          updatePromises.push(updateDoc(accountRef, { isDefault: false }));
        }
      });

      await Promise.all(updatePromises);

      // Then set the selected account as default
      if (accountId !== 'new') {
        const accountRef = doc(db, 'user_bank_accounts', accountId);
        await updateDoc(accountRef, { isDefault: true });
      }

      toast({
        title: 'Success',
        description: 'Default account updated successfully'
      });
      
      loadUserBankAccounts();
    } catch (error) {
      console.error('Error setting default account:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default account',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      userId: user?.uid || '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      branchName: '',
      branchCode: '',
      swiftCode: '',
      country: 'Japan',
      currency: 'JPY',
      accountType: 'checking',
      isActive: true,
      isDefault: false,
      notes: '',
      createdAt: '',
      updatedAt: ''
    });
    setIsEditing(null);
  };

  const toggleAccountNumberVisibility = (accountId: string) => {
    setShowAccountNumbers(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const maskAccountNumber = (accountNumber: string, show: boolean = false): string => {
    if (show) return accountNumber;
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading bank accounts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Balance */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-600" />
                Bank Information for Payouts
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage your bank accounts for receiving affiliate payouts
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-2xl font-bold text-green-600">¥0</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add/Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Edit Bank Account' : 'Add New Bank Account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., Mitsubishi UFJ Bank"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="accountHolder">Account Holder Name *</Label>
                <Input
                  id="accountHolder"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  placeholder="Full name as on account"
                  required
                />
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="1234567890"
                  required
                />
              </div>

              <div>
                <Label htmlFor="accountType">Account Type</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={countries.find(c => c.name === formData.country)?.code || 'JP'}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              {formData.country === 'Japan' && (
                <div>
                  <Label htmlFor="branchCode">Branch Code</Label>
                  <Input
                    id="branchCode"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                    placeholder="e.g., 001"
                  />
                </div>
              )}

              {formData.country !== 'Japan' && (
                <div>
                  <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
                  <Input
                    id="swiftCode"
                    value={formData.swiftCode}
                    onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                    placeholder="e.g., BMRIIDJA"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isDefault">Set as default account</Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                <Building2 className="w-4 h-4 mr-2" />
                {isEditing ? 'Update Account' : 'Add Account'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bank Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No bank accounts found. Add your first bank account to receive payouts.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{account.bankName}</h4>
                        {account.isDefault && (
                          <Badge className="bg-blue-500 text-white">Default</Badge>
                        )}
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{account.accountHolder}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm">
                          {maskAccountNumber(account.accountNumber, showAccountNumbers[account.id || ''])}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleAccountNumberVisibility(account.id || '')}
                        >
                          {showAccountNumbers[account.id || ''] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {account.country} • {account.currency} • {account.accountType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!account.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(account.id || '')}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(account.id || '')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Important:</strong> Bank account information is used for affiliate payout processing. 
          Please ensure all details are accurate to avoid payment delays.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default UserBankInformationManager;
