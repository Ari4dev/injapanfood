import { useState } from 'react';
import { useAffiliate, AffiliateProvider } from '@/hooks/useAffiliate';
import { useShopeeAffiliateIntegration } from '@/hooks/useShopeeAffiliate';
import { useLanguage } from '@/hooks/useLanguage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ModernAffiliateStats from '@/components/affiliate/ModernAffiliateStats';
import ModernReferralLinkCard from '@/components/affiliate/ModernReferralLinkCard';
import ModernPayoutRequestForm from '@/components/affiliate/ModernPayoutRequestForm';
import ModernReferralsTable from '@/components/affiliate/ModernReferralsTable';
import ModernCommissionsTable from '@/components/affiliate/ModernCommissionsTable';
import ModernFollowersTable from '@/components/affiliate/ModernFollowersTable';
import ModernPayoutsTable from '@/components/affiliate/ModernPayoutsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Info, AlertTriangle } from 'lucide-react';
import JoinAffiliateCard from '@/components/affiliate/JoinAffiliateCard';
import { useEffect } from 'react';

const UnifiedAffiliateContent = () => {
  const { affiliate, loading: oldSystemLoading, commissions } = useAffiliate();
  const { 
    activeAttribution, 
    isLoadingAttribution,
    checkoutReferralCode 
  } = useShopeeAffiliateIntegration();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Enhanced scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // If not an affiliate yet, show join card
  if (!affiliate && !oldSystemLoading) {
    return <JoinAffiliateCard />;
  }

  // System status indicators
  const oldSystemActive = !!affiliate;
  const newSystemActive = !!activeAttribution;
  
  // Calculate commission data from old system
  const pendingCommissions = commissions.filter(comm => comm.status === 'pending');
  const approvedCommissions = commissions.filter(comm => comm.status === 'approved');
  const paidCommissions = commissions.filter(comm => comm.status === 'paid');
  
  const totalLifetimeCommission = approvedCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0) + 
                                  paidCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
  
  const availableCommission = affiliate?.approvedCommission || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('affiliate.dashboard')}</h1>
          <p className="text-gray-600">{t('affiliate.manageProgramDesc')}</p>
          
          {/* System Status Indicators */}
          <div className="flex gap-2 mt-4">
            <Badge variant={oldSystemActive ? "default" : "secondary"} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${oldSystemActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              {t('affiliate.traditionalSystemLabel')} {oldSystemActive ? t('affiliate.statusActive') : t('affiliate.statusInactive')}
            </Badge>
            <Badge variant={newSystemActive ? "default" : "secondary"} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${newSystemActive ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
              {t('affiliate.shopeeSystemLabel')} {newSystemActive ? t('affiliate.statusActive') : t('affiliate.statusInactive')}
            </Badge>
          </div>
        </div>

        {/* System Integration Alert */}
        <Alert className="mb-6">
          <Info className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
                  <p className=\"font-medium\">🔄 {t('affiliate.hybridSystemActive') || 'Sistem Hybrid Aktif'}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <p className=\"text-sm font-medium text-blue-600\">{t('affiliate.traditionalSystem') || '📊 Traditional System'}:</p>
                  <ul className="text-xs text-gray-600 ml-4">
                    <li>• {t('affiliate.traditionalSystemFeatures.0', 'Referral tracking & commissions')}</li>
                    <li>• {t('affiliate.traditionalSystemFeatures.1', 'Admin approval workflow')}</li>
                    <li>• {t('affiliate.traditionalSystemFeatures.2', 'Payout management')}</li>
                  </ul>
                </div>
                <div>
                  <p className=\"text-sm font-medium text-green-600\">{t('affiliate.shopeeSystem') || '🛍️ Shopee System'}:</p>
                  <ul className="text-xs text-gray-600 ml-4">
                    <li>• {t('affiliate.shopeeSystemFeatures.0', '1-day attribution window')}</li>
                    <li>• {t('affiliate.shopeeSystemFeatures.1', 'Browser fingerprinting')}</li>
                    <li>• {t('affiliate.shopeeSystemFeatures.2', 'Auto-fill referral codes')}</li>
                  </ul>
                </div>
              </div>
              {newSystemActive && (
                <div className="bg-green-50 p-2 rounded mt-2">
                  <p className=\"text-xs text-green-700\">
                    ✅ {t('affiliate.activeAttribution') || 'Active attribution'}: <strong>{activeAttribution?.referralCode}</strong> 
                    {activeAttribution?.userId && ` (${t('affiliate.boundToUser') || 'Bound to user'})`}
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
        
        {/* Stats Overview */}
        <div className="mb-8">
          <ModernAffiliateStats />
        </div>
        
        {/* Commission Summary Card - Enhanced with dual system info */}
        <div className="mb-8">
          <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <DollarSign className="w-5 h-5 mr-2" />
                {t('affiliate.commissionSummary')} - {t('affiliate.combinedSystems') || 'Combined Systems'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg border border-primary/20">
                  <h3 className=\"text-sm font-medium text-gray-600 mb-1\">{t('affiliate.traditionalCommission') || 'Traditional Commission'}</h3>
                  <p className=\"text-2xl font-bold text-primary\">¥{totalLifetimeCommission.toLocaleString()}</p>
                  <p className=\"text-xs text-gray-500 mt-1\">{t('affiliate.fromOldSystem') || 'From old affiliate system'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h3 className=\"text-sm font-medium text-gray-600 mb-1\">{t('affiliate.availableBalance') || 'Available Balance'}</h3>
                  <p className=\"text-2xl font-bold text-green-600\">¥{availableCommission.toLocaleString()}</p>
                  <p className=\"text-xs text-gray-500 mt-1\">{t('affiliate.readyForPayout') || 'Ready for payout'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <h3 className=\"text-sm font-medium text-gray-600 mb-1\">{t('affiliate.shopeeAttribution') || 'Shopee Attribution'}</h3>
                  <p className="text-lg font-bold text-blue-600">
                    {activeAttribution ? (
                      <>¥{(activeAttribution.totalCommission || 0).toLocaleString()}</>
                    ) : (
                      t('affiliate.noActiveAttribution') || 'No Active Attribution'
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activeAttribution ? 
                    `${activeAttribution.totalOrders || 0} ${t('affiliate.ordersAttributed') || 'orders attributed'}` : 
                      t('affiliate.attributionWindow') || '1-day attribution window'
                    }
                  </p>
                </div>
              </div>
              
              {/* Attribution Details */}
              {activeAttribution && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className=\"text-sm font-medium text-blue-800 mb-2\">🛍️ {t('affiliate.activeShopeeAttribution') || 'Active Shopee Attribution'}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className=\"text-blue-600\">{t('affiliate.code') || 'Code'}:</span> {activeAttribution.referralCode}
                    </div>
                    <div>
                      <span className=\"text-blue-600\">{t('affiliate.status') || 'Status'}:</span> {activeAttribution.isActive ? t('affiliate.statusActive') || 'Active' : t('affiliate.statusExpired') || 'Expired'}
                    </div>
                    <div>
                      <span className=\"text-blue-600\">{t('affiliate.orders') || 'Orders'}:</span> {activeAttribution.totalOrders || 0}
                    </div>
                    <div>
                      <span className=\"text-blue-600\">{t('affiliate.gmv') || 'GMV'}:</span> ¥{(activeAttribution.totalGMV || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">{t('affiliate.dashboardTab')}</TabsTrigger>
            <TabsTrigger value="referrals">{t('affiliate.referralsTab')}</TabsTrigger>
            <TabsTrigger value="commissions">{t('affiliate.commissionsTab')}</TabsTrigger>
            <TabsTrigger value="payouts">{t('affiliate.payoutsTab')}</TabsTrigger>
            <TabsTrigger value=\"system\" className=\"text-orange-600\">🔧 {t('affiliate.systemInfoTab') || 'System Info'}</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ModernReferralLinkCard />
              <ModernPayoutRequestForm />
            </div>
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
          
          {/* System Info Tab - NEW */}
          <TabsContent value="system">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    {t('affiliate.systemIntegrationStatus') || 'System Integration Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Traditional System Status */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${oldSystemActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <h3 className=\"font-semibold text-lg\">📊 {t('affiliate.traditionalAffiliateSystem') || 'Traditional Affiliate System'}</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className=\"text-gray-600\">{t('affiliate.status') || 'Status'}:</p>
                        <p className=\"font-medium\">{oldSystemActive ? t('affiliate.statusActive') || 'Active' : t('affiliate.statusInactive') || 'Inactive'}</p>
                      </div>
                      <div>
                        <p className=\"text-gray-600\">{t('affiliate.affiliateId') || 'Affiliate ID'}:</p>
                        <p className="font-medium font-mono text-xs">{affiliate?.id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className=\"text-gray-600\">{t('affiliate.referralCode') || 'Referral Code'}:</p>
                        <p className="font-medium">{affiliate?.referralCode || 'N/A'}</p>
                      </div>
                      <div>
                        <p className=\"text-gray-600\">{t('affiliate.totalCommission') || 'Total Commission'}:</p>
                        <p className="font-medium">¥{(affiliate?.totalCommission || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Shopee System Status */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${newSystemActive ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                      <h3 className=\"font-semibold text-lg\">🛍️ {t('affiliate.shopeeStyleAttributionSystem') || 'Shopee-Style Attribution System'}</h3>
                    </div>
                    {activeAttribution ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                        <p className=\"text-gray-600\">{t('affiliate.attributionId') || 'Attribution ID'}:</p>
                          <p className="font-medium font-mono text-xs">{activeAttribution.id || 'N/A'}</p>
                        </div>
                        <div>
                        <p className=\"text-gray-600\">{t('affiliate.visitorId') || 'Visitor ID'}:</p>
                          <p className="font-medium font-mono text-xs">{activeAttribution.visitorId?.substring(0, 12)}...</p>
                        </div>
                        <div>
                        <p className=\"text-gray-600\">{t('affiliate.windowExpires') || 'Window Expires'}:</p>
                          <p className="font-medium text-xs">
                            {activeAttribution.attributionWindow ? 
                              new Date(activeAttribution.attributionWindow).toLocaleDateString() : 
                              'N/A'
                            }
                          </p>
                        </div>
                        <div>
                        <p className=\"text-gray-600\">{t('affiliate.totalGmv') || 'Total GMV'}:</p>
                          <p className="font-medium">¥{(activeAttribution.totalGMV || 0).toLocaleString()}</p>
                        </div>
                        <div className="col-span-2 md:col-span-4">
                          <p className=\"text-gray-600\">{t('affiliate.attributionDetails') || 'Attribution Details'}:</p>
                          <div className="bg-gray-50 p-2 rounded text-xs font-mono mt-1">
                            <p>{t('affiliate.firstClick') || 'First Click'}: {activeAttribution.firstClick ? new Date(activeAttribution.firstClick).toLocaleString() : 'N/A'}</p>
                            <p>{t('affiliate.lastClick') || 'Last Click'}: {activeAttribution.lastClick ? new Date(activeAttribution.lastClick).toLocaleString() : 'N/A'}</p>
                            <p>{t('affiliate.userBound') || 'User Bound'}: {activeAttribution.boundAt ? new Date(activeAttribution.boundAt).toLocaleString() : t('affiliate.notBound') || 'Not bound'}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>{t('affiliate.noActiveAttributionFound') || 'No active attribution found'}</p>
                        <p className=\"text-sm\">{t('affiliate.useReferralLinkToCreate') || 'Use a referral link to create an attribution record'}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Integration Notes */}
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className=\"font-medium\">{t('affiliate.systemIntegrationNotes') || 'System Integration Notes'}:</p>
                        <ul className="text-sm space-y-1 ml-4">
                          <li>• {t('affiliate.integrationNotes.0', 'Traditional system handles existing commissions and payouts')}</li>
                          <li>• {t('affiliate.integrationNotes.1', 'Shopee system provides advanced attribution tracking')}</li>
                          <li>• {t('affiliate.integrationNotes.2', 'Both systems can run simultaneously without conflicts')}</li>
                          <li>• {t('affiliate.integrationNotes.3', 'Attribution window changed to 1 day (from 7 days)')}</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

const UnifiedAffiliateDashboard = () => {
  return (
    <AffiliateProvider>
      <UnifiedAffiliateContent />
    </AffiliateProvider>
  );
};

export default UnifiedAffiliateDashboard;
