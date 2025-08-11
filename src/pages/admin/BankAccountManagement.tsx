import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { runCompleteMigration } from '@/services/bankMigrationService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Banknote, 
  Plus,
  Settings,
  X,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  country: 'ID' | 'JP';
  currency: 'IDR' | 'JPY';
  isActive: boolean;
  isDefault: boolean;
  branch?: string;
  swiftCode?: string;
  bankCode?: string;
  branchCode?: string;
  createdAt: string;
  updatedAt: string;
}

// Migration data from hardcoded checkout form
const MIGRATION_DATA: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    bankName: 'Bank BRI',
    accountNumber: '0409 0100 2213 564',
    accountHolderName: 'INJAPAN LINK INDONESIA',
    country: 'ID',
    currency: 'IDR',
    isActive: true,
    isDefault: true,
    branch: 'KCP Jakarta'
  },
  {
    bankName: 'Yucho Bank',
    accountNumber: '22210551',
    accountHolderName: 'Heri Kurnianta',
    country: 'JP',
    currency: 'JPY',
    isActive: true,
    isDefault: false,
    bankCode: '11170',
    branchCode: '118'
  }
];

const BankAccountManagement = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [migrationComplete, setMigrationComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    country: 'ID' as 'ID' | 'JP',
    currency: 'IDR' as 'IDR' | 'JPY',
    branch: '',
    swiftCode: '',
    bankCode: '',
    branchCode: ''
  });

  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    defaultAccount: 0,
    inactiveAccounts: 0
  });

  useEffect(() => {
    checkAndRunMigration();
    setupRealtimeListener();
  }, []);

  const checkAndRunMigration = async () => {
    try {
      console.log('🔄 [Migration] Checking if migration is needed...');
      
      const snapshot = await getDocs(collection(db, 'admin_bank_accounts'));
      console.log('🔄 [Migration] Collection snapshot:', {
        empty: snapshot.empty,
        size: snapshot.size,
        docs: snapshot.docs.length
      });
      
      if (snapshot.empty) {
        console.log('🔄 [Migration] No bank accounts found, running complete migration...');
        setLoading(true);
        
        // First try to migrate from old system
        try {
          console.log('🔄 [Migration] Attempting old system migration...');
          await runCompleteMigration();
          console.log('✅ [Migration] Completed migration from old system');
          setMigrationComplete(true);
        } catch (oldMigrationError) {
          console.log('ℹ️ [Migration] No old system data found, running hardcoded migration...');
          console.log('🔄 [Migration] Old system error:', oldMigrationError);
          await runMigration();
        }
      } else {
        console.log('✅ [Migration] Bank accounts already exist, skipping migration');
        console.log('🔄 [Migration] Existing accounts:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setMigrationComplete(true);
      }
      
      await loadBankAccounts();
    } catch (error) {
      console.error('❌ [Migration] Error during migration check:', error);
      console.error('❌ [Migration] Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      
      // Try to load accounts anyway
      try {
        await loadBankAccounts();
      } catch (loadError) {
        console.error('❌ [Migration] Failed to load accounts after migration error:', loadError);
        setLoading(false);
      }
    }
  };

  const runMigration = async () => {
    try {
      console.log('🔄 [Migration] Starting auto-migration from hardcoded data...');
      
      for (const accountData of MIGRATION_DATA) {
        const docRef = await addDoc(collection(db, 'admin_bank_accounts'), {
          ...accountData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        console.log(`✅ [Migration] Migrated ${accountData.bankName} with ID: ${docRef.id}`);
      }
      
      setMigrationComplete(true);
      console.log('🎉 [Migration] Auto-migration completed successfully!');
      
      toast({
        title: 'Migration Successful',
        description: 'Bank accounts have been automatically migrated from checkout form data'
      });
      
    } catch (error) {
      console.error('❌ [Migration] Migration failed:', error);
      toast({
        title: 'Migration Failed',
        description: 'Failed to migrate bank accounts. Please add them manually.',
        variant: 'destructive'
      });
    }
  };

  const loadBankAccounts = async () => {
    try {
      console.log('📊 [LoadAccounts] Loading bank accounts...');
      const snapshot = await getDocs(collection(db, 'admin_bank_accounts'));
      console.log('📊 [LoadAccounts] Fetched snapshot:', {
        empty: snapshot.empty,
        size: snapshot.size
      });
      
      const accounts = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📊 [LoadAccounts] Processing account:', { id: doc.id, bankName: data.bankName });
        return {
          id: doc.id,
          ...data
        };
      }) as BankAccount[];
      
      console.log('📊 [LoadAccounts] Processed accounts:', accounts.length);
      setBankAccounts(accounts);
      calculateStats(accounts);
      setLoading(false);
    } catch (error) {
      console.error('❌ [LoadAccounts] Error loading bank accounts:', error);
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    const unsubscribe = onSnapshot(
      collection(db, 'admin_bank_accounts'),
      (snapshot) => {
        const accounts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BankAccount[];
        
        setBankAccounts(accounts);
        calculateStats(accounts);
      }
    );

    return () => unsubscribe();
  };

  const calculateStats = (accounts: BankAccount[]) => {
    const stats = {
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter(a => a.isActive).length,
      defaultAccount: accounts.filter(a => a.isDefault).length,
      inactiveAccounts: accounts.filter(a => !a.isActive).length
    };
    setStats(stats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAccount) {
        // Update existing account
        const accountRef = doc(db, 'admin_bank_accounts', editingAccount.id);
        await updateDoc(accountRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        
        toast({
          title: 'Success',
          description: 'Bank account updated successfully'
        });
      } else {
        // Add new account
        await addDoc(collection(db, 'admin_bank_accounts'), {
          ...formData,
          isActive: true,
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        toast({
          title: 'Success',
          description: 'Bank account added successfully'
        });
      }
      
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast({
        title: 'Error',
        description: 'Failed to save bank account',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      country: 'ID',
      currency: 'IDR',
      branch: '',
      swiftCode: '',
      bankCode: '',
      branchCode: ''
    });
    setEditingAccount(null);
  };

  const handleEdit = (account: BankAccount) => {
    setFormData({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolderName: account.accountHolderName,
      country: account.country,
      currency: account.currency,
      branch: account.branch || '',
      swiftCode: account.swiftCode || '',
      bankCode: account.bankCode || '',
      branchCode: account.branchCode || ''
    });
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const toggleAccountStatus = async (accountId: string, currentStatus: boolean) => {
    try {
      const accountRef = doc(db, 'admin_bank_accounts', accountId);
      await updateDoc(accountRef, {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Success',
        description: `Account ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling account status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account status',
        variant: 'destructive'
      });
    }
  };

  const setAsDefault = async (accountId: string) => {
    try {
      // First, remove default from all accounts
      const batch = bankAccounts.map(async (account) => {
        const accountRef = doc(db, 'admin_bank_accounts', account.id);
        return updateDoc(accountRef, { 
          isDefault: account.id === accountId,
          updatedAt: new Date().toISOString()
        });
      });

      await Promise.all(batch);

      toast({
        title: 'Success',
        description: 'Default account updated successfully'
      });
    } catch (error) {
      console.error('Error setting default account:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default account',
        variant: 'destructive'
      });
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    
    try {
      await deleteDoc(doc(db, 'admin_bank_accounts', accountId));
      toast({
        title: 'Success',
        description: 'Bank account deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold flex items-center mb-2">
                🏦 Bank Information Management
              </h1>
              <p className="text-green-100">Manage bank accounts for payment processing and affiliate payouts</p>
              {migrationComplete && (
                <p className="text-xs text-green-200 mt-2">
                  ✅ Auto-migration from checkout form completed
                </p>
              )}
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bank Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      placeholder="e.g., Bank BRI"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      placeholder="e.g., 1234567890"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                    <Input
                      id="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                      placeholder="e.g., PT Injapan Food"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select 
                        value={formData.country} 
                        onValueChange={(value: 'ID' | 'JP') => setFormData({
                          ...formData, 
                          country: value,
                          currency: value === 'ID' ? 'IDR' : 'JPY'
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ID">🇮🇩 Indonesia</SelectItem>
                          <SelectItem value="JP">🇯🇵 Japan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={formData.currency}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="branch">Branch (Optional)</Label>
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => setFormData({...formData, branch: e.target.value})}
                      placeholder="e.g., KCP Jakarta"
                    />
                  </div>
                  
                  {formData.country === 'JP' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bankCode">Bank Code</Label>
                        <Input
                          id="bankCode"
                          value={formData.bankCode}
                          onChange={(e) => setFormData({...formData, bankCode: e.target.value})}
                          placeholder="e.g., 11170"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="branchCode">Branch Code</Label>
                        <Input
                          id="branchCode"
                          value={formData.branchCode}
                          onChange={(e) => setFormData({...formData, branchCode: e.target.value})}
                          placeholder="e.g., 118"
                        />
                      </div>
                    </div>
                  )}
                  
                  {formData.country === 'JP' && (
                    <div>
                      <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
                      <Input
                        id="swiftCode"
                        value={formData.swiftCode}
                        onChange={(e) => setFormData({...formData, swiftCode: e.target.value})}
                        placeholder="e.g., BOTKJPJT"
                      />
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full">
                    {editingAccount ? 'Update Account' : 'Add Account'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Accounts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAccounts}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Banknote className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Accounts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeAccounts}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Default Account</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.defaultAccount}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.inactiveAccounts}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <XCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {bankAccounts.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No bank accounts found. Add your first bank account to get started.</p>
                
                {/* Manual Migration Button */}
                <div className="space-y-2">
                  <Button 
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await runMigration();
                        toast({
                          title: 'Migration Completed',
                          description: 'Bank accounts have been migrated successfully'
                        });
                      } catch (error) {
                        console.error('Manual migration failed:', error);
                        toast({
                          title: 'Migration Failed', 
                          description: 'Please add bank accounts manually',
                          variant: 'destructive'
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="mb-2"
                  >
                    🔄 Migrate Bank Data from Checkout Form
                  </Button>
                  <p className="text-xs text-gray-400">
                    This will import BRI and Yucho bank accounts from the checkout form
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Account Holder</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="font-medium">{account.bankName}</div>
                        {account.branch && (
                          <div className="text-sm text-gray-500">{account.branch}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {account.accountNumber}
                        </code>
                      </TableCell>
                      <TableCell>{account.accountHolderName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {account.country === 'ID' ? '🇮🇩 Indonesia' : '🇯🇵 Japan'} ({account.currency})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? 'default' : 'secondary'}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {account.isDefault ? (
                          <Badge 
                            variant="default" 
                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium px-3 py-1 shadow-sm"
                          >
                            ⭐ Default
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setAsDefault(account.id)}
                            disabled={!account.isActive}
                            className="h-7 px-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            Set Default
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Simple ON/OFF Text Button */}
                          <button
                            onClick={() => toggleAccountStatus(account.id, account.isActive)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                              account.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={account.isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {account.isActive ? 'ON' : 'OFF'}
                          </button>
                          
                          {/* Modern Settings Button */}
                          <Button
                            size="sm"
                            onClick={() => handleEdit(account)}
                            className="h-8 w-8 p-0 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border-0 rounded-lg"
                            title="Edit Account"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                          
                          {/* Modern Close Button */}
                          <Button
                            size="sm"
                            onClick={() => deleteAccount(account.id)}
                            className="h-8 w-8 p-0 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border-0 rounded-lg"
                            title="Delete Account"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BankAccountManagement;
