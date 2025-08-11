import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
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
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wallet,
  Settings,
  Download,
  Search,
  Filter,
  BarChart3,
  Trophy,
  Link2,
  CreditCard
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  approvePayout,
  rejectPayout,
  processPayout,
  completePayout,
  getPayoutStats
} from '@/services/shopeeAffiliatePayoutService';


interface ShopeeAffiliate {
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
  isActive: boolean;
  tier?: string;
  createdAt: string;
}

interface AffiliateOrder {
  id: string;
  orderId: string;
  referralCode: string;
  referrerId: string;
  orderTotal: number;
  commissionAmount: number;
  commissionStatus: string;
  orderDate: string;
  userEmail: string;
}

interface AffiliatePayout {
  id: string;
  affiliateId: string;
  affiliateEmail: string;
  amount: number;
  status: string;
  method: string;
  requestedAt: string;
  notes?: string;
}

const BitKodeAffiliateManagement = () => {
  const [affiliates, setAffiliates] = useState<ShopeeAffiliate[]>([]);
  const [orders, setOrders] = useState<AffiliateOrder[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalCommissions: 0,
    pendingPayouts: 0,
    totalRevenue: 0
  });
  const [settings, setSettings] = useState({
    commissionRate: 10,
    minimumPayout: 1000,
    attributionWindowDays: 1,
    taxRate: 10, // Japanese tax rate
    enableTaxWithholding: true,
    paymentMethods: {
      japanBank: true,
      indonesiaBank: true
    }
  });

  useEffect(() => {
    loadData();
    setupRealtimeListeners();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load affiliates - Use real data from Firebase
      const affiliatesSnapshot = await getDocs(collection(db, 'shopee_affiliates'));
      const affiliatesData = affiliatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShopeeAffiliate[];
      setAffiliates(affiliatesData);

      // Load orders - Use real data from Firebase
      const ordersQuery = query(
        collection(db, 'affiliateOrders'),
        orderBy('orderDate', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AffiliateOrder[];
      setOrders(ordersData);

      // Load payouts
      const payoutsQuery = query(
        collection(db, 'shopee_affiliate_payouts'),
        orderBy('requestedAt', 'desc')
      );
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const payoutsData = payoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AffiliatePayout[];
      setPayouts(payoutsData);

      // Load settings
      const settingsSnapshot = await getDocs(collection(db, 'shopee_affiliate_settings'));
      if (!settingsSnapshot.empty) {
        const settingsData = settingsSnapshot.docs[0].data();
        setSettings({
          commissionRate: settingsData.commissionRate || 10,
          minimumPayout: settingsData.minimumPayout || 1000,
          attributionWindowDays: settingsData.attributionWindowDays || 1,
          taxRate: settingsData.taxRate || 10,
          enableTaxWithholding: settingsData.enableTaxWithholding ?? true,
          paymentMethods: {
            japanBank: settingsData.paymentMethods?.japanBank ?? true,
            indonesiaBank: settingsData.paymentMethods?.indonesiaBank ?? true
          }
        });
      }

      // Calculate stats
      calculateStats(affiliatesData, ordersData, payoutsData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load affiliate data',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    // Listen to affiliates changes
    const unsubAffiliates = onSnapshot(
      collection(db, 'shopee_affiliates'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ShopeeAffiliate[];
        setAffiliates(data);
      }
    );

    // Listen to orders changes
    const unsubOrders = onSnapshot(
      query(collection(db, 'affiliateOrders'), orderBy('orderDate', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AffiliateOrder[];
        setOrders(data);
      }
    );

    // Listen to payouts changes
    const unsubPayouts = onSnapshot(
      query(collection(db, 'shopee_affiliate_payouts'), orderBy('requestedAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AffiliatePayout[];
        setPayouts(data);
      }
    );

    return () => {
      unsubAffiliates();
      unsubOrders();
      unsubPayouts();
    };
  };

  const calculateStats = (
    affiliatesData: ShopeeAffiliate[],
    ordersData: AffiliateOrder[],
    payoutsData: AffiliatePayout[]
  ) => {
    const totalAffiliates = affiliatesData.length;
    const activeAffiliates = affiliatesData.filter(a => a.isActive).length;
    const totalCommissions = ordersData.reduce((sum, o) => sum + o.commissionAmount, 0);
    const pendingPayouts = payoutsData.filter(p => 
      p.status === 'pending' || p.status === 'approved'
    ).length;
    const totalRevenue = ordersData.reduce((sum, o) => sum + o.orderTotal, 0);

    setStats({
      totalAffiliates,
      activeAffiliates,
      totalCommissions,
      pendingPayouts,
      totalRevenue
    });
  };

  const handleApproveCommission = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'affiliateOrders', orderId);
      await updateDoc(orderRef, {
        commissionStatus: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: 'admin'
      });

      // Update affiliate's approved commission
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const affiliateRef = doc(db, 'shopee_affiliates', order.referrerId);
        const affiliate = affiliates.find(a => a.id === order.referrerId);
        if (affiliate) {
          await updateDoc(affiliateRef, {
            approvedCommission: (affiliate.approvedCommission || 0) + order.commissionAmount,
            pendingCommission: Math.max(0, (affiliate.pendingCommission || 0) - order.commissionAmount)
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Commission approved successfully'
      });
    } catch (error) {
      console.error('Error approving commission:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve commission',
        variant: 'destructive'
      });
    }
  };

  const handleRejectCommission = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'affiliateOrders', orderId);
      await updateDoc(orderRef, {
        commissionStatus: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: 'admin'
      });

      // Update affiliate's pending commission
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const affiliateRef = doc(db, 'shopee_affiliates', order.referrerId);
        const affiliate = affiliates.find(a => a.id === order.referrerId);
        if (affiliate) {
          await updateDoc(affiliateRef, {
            pendingCommission: Math.max(0, (affiliate.pendingCommission || 0) - order.commissionAmount)
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Commission rejected'
      });
    } catch (error) {
      console.error('Error rejecting commission:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject commission',
        variant: 'destructive'
      });
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    try {
      await approvePayout(payoutId, 'admin');
      toast({
        title: 'Success',
        description: 'Payout approved successfully'
      });
    } catch (error) {
      console.error('Error approving payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve payout',
        variant: 'destructive'
      });
    }
  };

  const handleRejectPayout = async (payoutId: string, reason: string) => {
    try {
      await rejectPayout(payoutId, 'admin', reason);
      toast({
        title: 'Success',
        description: 'Payout rejected'
      });
    } catch (error) {
      console.error('Error rejecting payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payout',
        variant: 'destructive'
      });
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    try {
      await processPayout(payoutId);
      toast({
        title: 'Success',
        description: 'Payout marked as processing'
      });
    } catch (error) {
      console.error('Error processing payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payout',
        variant: 'destructive'
      });
    }
  };

  const handleCompletePayout = async (payoutId: string, transactionId?: string) => {
    try {
      await completePayout(payoutId, transactionId);
      toast({
        title: 'Success',
        description: 'Payout completed successfully'
      });
    } catch (error) {
      console.error('Error completing payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete payout',
        variant: 'destructive'
      });
    }
  };

  const updateSettings = async () => {
    try {
      console.log('🔧 [Settings] Starting update settings process...');
      console.log('🔧 [Settings] Current settings:', settings);
      
      const settingsRef = collection(db, 'shopee_affiliate_settings');
      const snapshot = await getDocs(settingsRef);
      
      console.log('🔧 [Settings] Settings collection snapshot empty?', snapshot.empty);
      
      if (snapshot.empty) {
        // Create new settings document
        console.log('🔧 [Settings] Creating new settings document...');
        const newDoc = await addDoc(settingsRef, {
          ...settings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('✅ [Settings] New settings document created with ID:', newDoc.id);
      } else {
        // Update existing settings
        const docRef = doc(db, 'shopee_affiliate_settings', snapshot.docs[0].id);
        console.log('🔧 [Settings] Updating existing settings document ID:', snapshot.docs[0].id);
        
        await updateDoc(docRef, {
          ...settings,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ [Settings] Settings updated successfully');
      }

      toast({
        title: 'Success',
        description: 'Settings updated successfully'
      });
      
      console.log('✅ [Settings] Update process completed successfully');
    } catch (error) {
      console.error('❌ [Settings] Error updating settings:', error);
      console.error('❌ [Settings] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    }
  };

  const toggleAffiliateStatus = async (affiliateId: string, currentStatus: boolean) => {
    try {
      const affiliateRef = doc(db, 'shopee_affiliates', affiliateId);
      await updateDoc(affiliateRef, {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Success',
        description: `Affiliate ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling affiliate status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update affiliate status',
        variant: 'destructive'
      });
    }
  };

  const exportData = () => {
    // Create CSV data
    const csvData = [
      ['Affiliate Email', 'Referral Code', 'Total Orders', 'Total Commission', 'Status'],
      ...affiliates.map(a => [
        a.email,
        a.referralCode,
        a.totalOrders.toString(),
        a.totalCommission.toString(),
        a.isActive ? 'Active' : 'Inactive'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredAffiliates = affiliates.filter(a => 
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.commissionStatus === filterStatus);

  const filteredPayouts = filterStatus === 'all'
    ? payouts
    : payouts.filter(p => p.status === filterStatus);

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
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold flex items-center mb-2">
                💻 BitKode Affiliate Management
              </h1>
              <p className="text-blue-100">Kelola program affiliate, komisi, dan pembayaran</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => loadData()} variant="secondary" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
              <Button onClick={exportData} variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Overview with Icons and Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Affiliates</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAffiliates}</p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    <p className="text-xs text-green-600 font-medium">{stats.activeAffiliates} active</p>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">¥{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">From affiliate sales</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                  <p className="text-3xl font-bold text-gray-900">¥{stats.totalCommissions.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">All time</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingPayouts}</p>
                  {stats.pendingPayouts > 0 && (
                    <Badge variant="destructive" className="mt-1">Requires action</Badge>
                  )}
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Commission Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{settings.commissionRate}%</p>
                  <p className="text-xs text-gray-500">Current rate</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input 
                  placeholder="Search affiliates, orders, payouts..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Updates Active
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Tabs with Icons */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white border grid grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Overview
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Affiliates
              <Badge variant="secondary" className="ml-1">{affiliates.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Commissions
              <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Payouts
              {stats.pendingPayouts > 0 && (
                <Badge variant="destructive" className="ml-1">{stats.pendingPayouts}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Affiliates */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Affiliates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {affiliates
                      .sort((a, b) => b.totalCommission - a.totalCommission)
                      .slice(0, 5)
                      .map((affiliate) => (
                        <div key={affiliate.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{affiliate.displayName}</p>
                            <p className="text-sm text-gray-500">{affiliate.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">¥{affiliate.totalCommission.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{affiliate.totalOrders} orders</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Affiliate Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">¥{order.orderTotal.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">¥{order.commissionAmount.toLocaleString()}</p>
                          <Badge variant={
                            order.commissionStatus === 'approved' ? 'default' :
                            order.commissionStatus === 'pending' ? 'secondary' :
                            'destructive'
                          }>
                            {order.commissionStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Affiliates</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search affiliates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Total Commission</TableHead>
                      <TableHead>Available Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAffiliates.map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>{affiliate.displayName}</TableCell>
                        <TableCell>{affiliate.email}</TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {affiliate.referralCode}
                          </code>
                        </TableCell>
                        <TableCell>{affiliate.totalOrders}</TableCell>
                        <TableCell>¥{affiliate.totalCommission.toLocaleString()}</TableCell>
                        <TableCell>¥{affiliate.approvedCommission.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={affiliate.isActive ? 'default' : 'secondary'}>
                            {affiliate.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAffiliateStatus(affiliate.id, affiliate.isActive)}
                          >
                            {affiliate.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Commission Management</CardTitle>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order Total</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {new Date(order.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {order.orderId.slice(0, 12)}...
                        </TableCell>
                        <TableCell>{order.userEmail}</TableCell>
                        <TableCell>¥{order.orderTotal.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">
                          ¥{order.commissionAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            order.commissionStatus === 'approved' ? 'default' :
                            order.commissionStatus === 'pending' ? 'secondary' :
                            order.commissionStatus === 'paid' ? 'outline' :
                            'destructive'
                          }>
                            {order.commissionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.commissionStatus === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveCommission(order.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectCommission(order.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Payout Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          {new Date(payout.requestedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{payout.affiliateEmail}</TableCell>
                        <TableCell className="font-semibold">
                          ¥{payout.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{payout.method}</TableCell>
                        <TableCell>
                          <Badge variant={
                            payout.status === 'completed' ? 'default' :
                            payout.status === 'pending' ? 'secondary' :
                            payout.status === 'approved' ? 'outline' :
                            payout.status === 'processing' ? 'outline' :
                            'destructive'
                          }>
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {payout.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprovePayout(payout.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectPayout(payout.id, 'Admin rejection')}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {payout.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcessPayout(payout.id)}
                              >
                                Process
                              </Button>
                            )}
                            {payout.status === 'processing' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompletePayout(payout.id)}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6">
              {/* Commission Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Commission Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label>Commission Rate (%)</Label>
                      <Input
                        type="number"
                        value={settings.commissionRate}
                        onChange={(e) => setSettings({
                          ...settings,
                          commissionRate: parseInt(e.target.value) || 0
                        })}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Percentage of order total paid as commission
                      </p>
                    </div>

                    <div>
                      <Label>Minimum Payout (¥)</Label>
                      <Input
                        type="number"
                        value={settings.minimumPayout}
                        onChange={(e) => setSettings({
                          ...settings,
                          minimumPayout: parseInt(e.target.value) || 0
                        })}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Minimum amount required for payout request
                      </p>
                    </div>

                    <div>
                      <Label>Attribution Window (days)</Label>
                      <Input
                        type="number"
                        value={settings.attributionWindowDays}
                        onChange={(e) => setSettings({
                          ...settings,
                          attributionWindowDays: parseInt(e.target.value) || 1
                        })}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        How long referral links remain active after click
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Settings</CardTitle>
                  <p className="text-sm text-gray-500">
                    Configure tax withholding for affiliate payouts
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Tax Withholding</Label>
                        <p className="text-sm text-gray-500">
                          Automatically deduct tax from affiliate payouts
                        </p>
                      </div>
                      <Switch
                        checked={settings.enableTaxWithholding}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          enableTaxWithholding: checked
                        })}
                      />
                    </div>

                    {settings.enableTaxWithholding && (
                      <div>
                        <Label>Japan Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={settings.taxRate}
                          onChange={(e) => setSettings({
                            ...settings,
                            taxRate: parseInt(e.target.value) || 10
                          })}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Tax rate for Japanese transactions (default: 10%)
                        </p>
                      </div>
                    )}

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Tax Information:</strong><br />
                        • Japan: 10% withholding tax on affiliate commissions<br />
                        • Indonesia: Tax handled by affiliate (no withholding)<br />
                        • Affiliates must provide tax documents for compliance
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <p className="text-sm text-gray-500">
                    Configure available payment methods for affiliate payouts
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="flex items-center gap-2">
                          <svg className="w-5 h-5" viewBox="0 0 900 600">
                            <rect width="900" height="600" fill="#fff"/>
                            <circle cx="450" cy="300" r="180" fill="#bc002d"/>
                          </svg>
                          Japan Bank Transfer
                        </Label>
                        <p className="text-sm text-gray-500">
                          Enable bank transfers to Japanese banks
                        </p>
                      </div>
                      <Switch
                        checked={settings.paymentMethods.japanBank}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            japanBank: checked
                          }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="flex items-center gap-2">
                          <svg className="w-5 h-5" viewBox="0 0 3 2">
                            <rect width="3" height="2" fill="#dc143c"/>
                            <rect width="3" height="1" fill="#fff"/>
                          </svg>
                          Indonesia Bank Transfer
                        </Label>
                        <p className="text-sm text-gray-500">
                          Enable bank transfers to Indonesian banks
                        </p>
                      </div>
                      <Switch
                        checked={settings.paymentMethods.indonesiaBank}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            indonesiaBank: checked
                          }
                        })}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Supported Banks</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Japan:</p>
                          <ul className="mt-1 space-y-1 text-gray-600">
                            <li>• Mitsubishi UFJ</li>
                            <li>• Sumitomo Mitsui</li>
                            <li>• Mizuho Bank</li>
                            <li>• Japan Post Bank</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Indonesia:</p>
                          <ul className="mt-1 space-y-1 text-gray-600">
                            <li>• Bank Mandiri</li>
                            <li>• Bank BCA</li>
                            <li>• Bank BNI</li>
                            <li>• Bank BRI</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={updateSettings} className="w-full">
                Save All Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default BitKodeAffiliateManagement;
