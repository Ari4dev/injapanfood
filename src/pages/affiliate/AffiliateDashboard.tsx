import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  DollarSign,
  TrendingUp,
  Link2,
  Share2,
  Copy,
  QrCode,
  Wallet,
  Settings,
  BarChart3,
  Trophy,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  ShoppingBag,
  Target
} from 'lucide-react';

// Import affiliate components
import AnalyticsDashboard from '@/components/affiliate/AnalyticsDashboard';
import TierSystem from '@/components/affiliate/TierSystem';
import LinkGenerator from '@/components/affiliate/LinkGenerator';
import PaymentMethods from '@/components/affiliate/PaymentMethods';
import PayoutRequestModal from '@/components/affiliate/PayoutRequestModal';

interface AffiliateData {
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
  orderTotal: number;
  commissionAmount: number;
  commissionStatus: string;
  orderDate: string;
  userEmail: string;
  productNames?: string[];
}

interface AffiliatePayout {
  id: string;
  amount: number;
  status: string;
  method: string;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [orders, setOrders] = useState<AffiliateOrder[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRegistering, setIsRegistering] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [stats, setStats] = useState({
    thisMonthCommission: 0,
    lastMonthCommission: 0,
    conversionRate: 0,
    avgOrderValue: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadAffiliateData();
  }, [user]);

  const loadAffiliateData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check if user is already an affiliate
      const affiliatesQuery = query(
        collection(db, 'bitkode_affiliates'),
        where('userId', '==', user.uid)
      );
      const affiliatesSnapshot = await getDocs(affiliatesQuery);

      if (!affiliatesSnapshot.empty) {
        const affiliateDoc = affiliatesSnapshot.docs[0];
        const data = {
          id: affiliateDoc.id,
          ...affiliateDoc.data()
        } as AffiliateData;
        
        setAffiliateData(data);
        
        // Generate referral link
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}?ref=${data.referralCode}`);

        // Load orders
        await loadOrders(data.id);
        
        // Load payouts
        await loadPayouts(data.id);
        
        // Calculate stats
        calculateStats(data);

        // Setup real-time listeners
        setupRealtimeListeners(data.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load affiliate data',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const loadOrders = async (affiliateId: string) => {
    try {
      const ordersQuery = query(
        collection(db, 'affiliateOrders'),
        where('referrerId', '==', affiliateId),
        orderBy('orderDate', 'desc'),
        limit(50)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AffiliateOrder[];
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadPayouts = async (affiliateId: string) => {
    try {
      const payoutsQuery = query(
        collection(db, 'bitkode_affiliate_payouts'),
        where('affiliateId', '==', affiliateId),
        orderBy('requestedAt', 'desc'),
        limit(20)
      );
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const payoutsData = payoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AffiliatePayout[];
      
      setPayouts(payoutsData);
    } catch (error) {
      console.error('Error loading payouts:', error);
    }
  };

  const setupRealtimeListeners = (affiliateId: string) => {
    // Listen to affiliate data changes
    const affiliateUnsubscribe = onSnapshot(
      doc(db, 'bitkode_affiliates', affiliateId),
      (doc) => {
        if (doc.exists()) {
          setAffiliateData({
            id: doc.id,
            ...doc.data()
          } as AffiliateData);
        }
      }
    );

    // Listen to new orders
    const ordersUnsubscribe = onSnapshot(
      query(
        collection(db, 'affiliateOrders'),
        where('referrerId', '==', affiliateId),
        orderBy('orderDate', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AffiliateOrder[];
        setOrders(ordersData);
      }
    );

    // Listen to payouts
    const payoutsUnsubscribe = onSnapshot(
      query(
        collection(db, 'bitkode_affiliate_payouts'),
        where('affiliateId', '==', affiliateId),
        orderBy('requestedAt', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        const payoutsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AffiliatePayout[];
        setPayouts(payoutsData);
      }
    );

    // Cleanup function
    return () => {
      affiliateUnsubscribe();
      ordersUnsubscribe();
      payoutsUnsubscribe();
    };
  };

  const calculateStats = (data: AffiliateData) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // Calculate this month's commission
    const thisMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
    });
    const thisMonthCommission = thisMonthOrders.reduce((sum, order) => sum + order.commissionAmount, 0);

    // Calculate last month's commission
    const lastMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
    });
    const lastMonthCommission = lastMonthOrders.reduce((sum, order) => sum + order.commissionAmount, 0);

    // Calculate conversion rate
    const conversionRate = data.totalClicks > 0 
      ? ((data.totalOrders / data.totalClicks) * 100) 
      : 0;

    // Calculate average order value
    const avgOrderValue = data.totalOrders > 0 
      ? (data.totalGMV / data.totalOrders) 
      : 0;

    setStats({
      thisMonthCommission,
      lastMonthCommission,
      conversionRate,
      avgOrderValue
    });
  };

  const registerAsAffiliate = async () => {
    if (!user) return;

    try {
      setIsRegistering(true);

      // Generate unique referral code
      const referralCode = `BK${user.uid.slice(0, 6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

      // Create affiliate record
      const affiliateData = {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email || 'User',
        referralCode,
        totalClicks: 0,
        totalReferrals: 0,
        totalOrders: 0,
        totalGMV: 0,
        totalCommission: 0,
        pendingCommission: 0,
        approvedCommission: 0,
        paidCommission: 0,
        isActive: true,
        tier: 'Bronze',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'bitkode_affiliates'), affiliateData);

      // Update local state
      setAffiliateData({
        id: docRef.id,
        ...affiliateData
      });

      // Generate referral link
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}?ref=${referralCode}`);

      toast({
        title: 'Success!',
        description: 'You have successfully registered as an affiliate!'
      });

      setIsRegistering(false);
    } catch (error) {
      console.error('Error registering as affiliate:', error);
      toast({
        title: 'Error',
        description: 'Failed to register as affiliate. Please try again.',
        variant: 'destructive'
      });
      setIsRegistering(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard'
    });
  };

  const handlePayoutSuccess = () => {
    // Reload data after successful payout
    loadAffiliateData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Card className="text-center p-8">
            <CardHeader>
              <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-fit">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Join BitKode Affiliate Program</CardTitle>
              <p className="text-lg text-gray-600 mt-2">
                Earn commission by sharing our products with your audience
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 border rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-semibold">Earn 10% Commission</h3>
                  <p className="text-sm text-gray-600">Get commission on every sale you refer</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold">Real-time Tracking</h3>
                  <p className="text-sm text-gray-600">Track your performance instantly</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Wallet className="h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold">Fast Payouts</h3>
                  <p className="text-sm text-gray-600">Get paid quickly and securely</p>
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={registerAsAffiliate}
                disabled={isRegistering}
                className="mt-6"
              >
                {isRegistering ? 'Registering...' : 'Become an Affiliate'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold flex items-center mb-2">
                💻 BitKode Affiliate Dashboard
              </h1>
              <p className="text-blue-100">Welcome back, {affiliateData.displayName}!</p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {affiliateData.tier || 'Bronze'} Tier
                </Badge>
                <Badge variant={affiliateData.isActive ? 'default' : 'destructive'}>
                  {affiliateData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Referral Code</p>
              <code className="bg-white/20 px-3 py-1 rounded text-lg font-mono">
                {affiliateData.referralCode}
              </code>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold">¥{affiliateData.approvedCommission.toLocaleString()}</p>
                  <Button 
                    size="sm" 
                    variant={affiliateData.approvedCommission >= 1000 ? "default" : "outline"}
                    className="mt-2" 
                    onClick={() => setShowPayoutModal(true)}
                    disabled={affiliateData.approvedCommission < 1000}
                  >
                    {affiliateData.approvedCommission >= 1000 ? 'Request Payout' : 'Min ¥1,000'}
                  </Button>
                </div>
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Commission</p>
                  <p className="text-2xl font-bold">¥{affiliateData.pendingCommission.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Awaiting approval</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earned</p>
                  <p className="text-2xl font-bold">¥{affiliateData.totalCommission.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">All time</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">{affiliateData.totalOrders} orders</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[300px]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                  />
                  <Button onClick={copyReferralLink} variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tier">Tier System</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">This Month</span>
                      <span className="font-bold text-lg">¥{stats.thisMonthCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last Month</span>
                      <span className="font-bold text-lg">¥{stats.lastMonthCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Clicks</span>
                      <span className="font-bold text-lg">{affiliateData.totalClicks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Orders</span>
                      <span className="font-bold text-lg">{affiliateData.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Avg Order Value</span>
                      <span className="font-bold text-lg">¥{stats.avgOrderValue.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
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

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard affiliateId={affiliateData.id} />
          </TabsContent>

          {/* Tier System Tab */}
          <TabsContent value="tier">
            <TierSystem affiliateId={affiliateData.id} />
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links">
            <LinkGenerator affiliateId={affiliateData.id} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <PaymentMethods affiliateId={affiliateData.id} />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <p className="text-sm text-gray-500">
                  All orders generated through your referral links
                </p>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payout Request Modal */}
        {affiliateData && (
          <PayoutRequestModal
            isOpen={showPayoutModal}
            onClose={() => setShowPayoutModal(false)}
            affiliateData={{
              id: affiliateData.id,
              email: affiliateData.email,
              displayName: affiliateData.displayName,
              approvedCommission: affiliateData.approvedCommission,
              tier: affiliateData.tier
            }}
            onSuccess={handlePayoutSuccess}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AffiliateDashboard;
