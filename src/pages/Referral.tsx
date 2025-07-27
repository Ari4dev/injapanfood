import { useState } from 'react';
import { useAffiliate, AffiliateProvider } from '@/hooks/useAffiliate';
import { useLanguage } from '@/hooks/useLanguage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ModernAffiliateStats from '@/components/affiliate/ModernAffiliateStats';
import ModernReferralLinkCard from '@/components/affiliate/ModernReferralLinkCard';
import ModernPayoutRequestForm from '@/components/affiliate/ModernPayoutRequestForm';
import AffiliatePerformanceChart from '@/components/affiliate/AffiliatePerformanceChart';
import ModernReferralsTable from '@/components/affiliate/ModernReferralsTable';
import ModernCommissionsTable from '@/components/affiliate/ModernCommissionsTable';
import ModernFollowersTable from '@/components/affiliate/ModernFollowersTable';
import ModernPayoutsTable from '@/components/affiliate/ModernPayoutsTable';
import AffiliatePromotionMaterials from '@/components/affiliate/AffiliatePromotionMaterials';
import AffiliateFAQ from '@/components/affiliate/AffiliateFAQ';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import JoinAffiliateCard from '@/components/affiliate/JoinAffiliateCard';
import { useEffect } from 'react';

const AffiliateContent = () => {
  const { affiliate, loading, commissions } = useAffiliate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Enhanced scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // If not an affiliate yet, show join card
  if (!affiliate && !loading) {
    return <JoinAffiliateCard />;
  }
  
  // Use backend's authoritative values instead of calculating from commission records
  // This ensures consistency with the main stats cards
  const pendingCommissions = commissions.filter(comm => comm.status === 'pending');
  const approvedCommissions = commissions.filter(comm => comm.status === 'approved');
  const paidCommissions = commissions.filter(comm => comm.status === 'paid');
  
  // Total Lifetime Commission: ALL commissions ever approved (including paid ones)
  const totalLifetimeCommission = approvedCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0) + 
                                  paidCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
  
  // Available Commission: Use backend's authoritative value
  const availableCommission = affiliate?.approvedCommission || 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('affiliate.dashboard')}</h1>
          <p className="text-gray-600">Kelola program affiliate Anda dan pantau performa</p>
        </div>
        
        {/* Stats Overview */}
        <div className="mb-8">
          <ModernAffiliateStats />
        </div>
        
        {/* Commission Summary Card */}
        <div className="mb-8">
          <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <DollarSign className="w-5 h-5 mr-2" />
                Ringkasan Komisi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border border-primary/20">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Komisi (Lifetime)</h3>
                  <p className="text-2xl font-bold text-primary">¥{totalLifetimeCommission.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Akumulasi seluruh komisi yang pernah diterima</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Komisi Tersedia</h3>
                  <p className="text-2xl font-bold text-green-600">¥{availableCommission.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Saldo siap untuk diajukan pencairan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ModernReferralLinkCard />
              <ModernPayoutRequestForm />
            </div>
            <AffiliatePerformanceChart />
          </TabsContent>
          
          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <div className="space-y-8">
              <ModernReferralsTable />
              <ModernFollowersTable />
            </div>
          </TabsContent>
          
          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <ModernCommissionsTable />
          </TabsContent>
          
          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <ModernPayoutsTable />
          </TabsContent>
          
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

const Referral = () => {
  return (
    <AffiliateProvider>
      <AffiliateContent />
    </AffiliateProvider>
  );
};

export default Referral;