import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';

// This component is no longer used - redirecting to new system
const EnhancedAffiliateManagementContent = () => {
  const selectedMonth = '';
  const totalStats = { totalAffiliates: 0, activeAttributions: 0, totalCommissionCombined: 0, pendingCommissions: 0 };
  
  // Enhanced scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Format month for display
  const formatMonth = (monthStr: string) => {
    if (!monthStr) return 'Bulan Ini';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Zap className="w-8 h-8 mr-3 text-blue-600" />
              Enhanced Affiliate Management
            </h1>
            <p className="text-gray-600 mt-2">
              Sistem affiliate terintegrasi: Traditional + BitKode-style attribution
            </p>
          </div>
          <div className="bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
            <p className="text-sm font-medium text-primary">Periode: {formatMonth(selectedMonth)}</p>
            <p className="text-xs text-gray-500">Data ditampilkan per bulan</p>
          </div>
        </div>
        
        {/* System Status Cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Target className="w-4 h-4 mr-2 text-blue-600" />
                Sistem Traditional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalAffiliates}</div>
              <p className="text-xs text-muted-foreground">Affiliate aktif</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Zap className="w-4 h-4 mr-2 text-purple-600" />
                BitKode-Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.activeAttributions}</div>
              <p className="text-xs text-muted-foreground">Attribution aktif</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                Combined Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{totalStats.totalCommissionCombined.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total komisi</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mb-8">
        <EnhancedAffiliateStatsOverview />
      </div>

      <div className="mb-8">
        <AffiliateMonthlyChart />
      </div>
      
      <Tabs defaultValue="affiliates" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="affiliates" className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Daftar Affiliate
          </TabsTrigger>
          <TabsTrigger value="attributions" className="flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Attribution Tracking
            <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200 text-xs">
              BitKode-Style
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Komisi
            {totalStats.pendingCommissions > 0 && (
              <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                {totalStats.pendingCommissions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Pencairan
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Pengaturan
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="affiliates">
          <AffiliatesTable />
        </TabsContent>
        
        <TabsContent value="attributions">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
                  Tentang BitKode-Style Attribution
                </CardTitle>
                <CardDescription>
                  Sistem tracking modern dengan 1-day attribution window untuk affiliate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">🎯 Fitur Utama:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <div>• 1-day attribution window</div>
                      <li>• Last-click attribution model</li>
                      <li>• Browser fingerprinting</li>
                      <li>• Multi-order tracking</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">📊 Data yang Ditampilkan:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Visitor tracking records</li>
                      <li>• User binding status</li>
                      <li>• Attribution expiry time</li>
                      <li>• Commission generation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <EnhancedShopeeAttributionTable />
          </div>
        </TabsContent>
        
        <TabsContent value="commissions">
          <CommissionsAdminTable />
        </TabsContent>
        
        <TabsContent value="payouts">
          <PayoutsAdminTable />
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Integration Status</CardTitle>
                <CardDescription>
                  Status integrasi antara sistem affiliate lama dan baru
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">Sistem Traditional</h4>
                      <Badge className="bg-blue-600">Aktif</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-blue-700">
                      <div>✅ Affiliate registration</div>
                      <div>✅ Referral code generation</div>
                      <div>✅ Commission tracking</div>
                      <div>✅ Payout management</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-900">BitKode-Style System</h4>
                      <Badge className="bg-purple-600">Aktif</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-purple-700">
                      <div>✅ Attribution tracking</div>
                      <div>• 1-day window system</div>
                      <div>✅ User binding</div>
                      <div>✅ Multi-order attribution</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">🎉 Integration Complete!</h4>
                  <p className="text-sm text-green-700">
                    Kedua sistem bekerja secara paralel. Data dari sistem lama tetap tersedia, 
                    sementara referral baru menggunakan BitKode-style attribution.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <AffiliateSettingsForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EnhancedAffiliateManagement = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Auto redirect to new affiliate management
    navigate('/admin/bitkode-affiliate-management');
  }, [navigate]);
  
  return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div>Redirecting to new affiliate management...</div>
      </div>
    </AdminLayout>
  );
};

export default EnhancedAffiliateManagement;
