import { useEnhancedAffiliateAdmin } from '@/hooks/useEnhancedAffiliateAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  Target,
  Activity,
  Zap
} from 'lucide-react';

const EnhancedAffiliateStatsOverview = () => {
  const { totalStats, loading, attributions, shopeeOrders } = useEnhancedAffiliateAdmin();
  
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get recent activity stats
  const recentAttributions = attributions.filter(attr => {
    const createdDate = new Date(attr.createdAt);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return createdDate >= sevenDaysAgo;
  }).length;

  const recentOrders = shopeeOrders.filter(order => {
    const createdDate = new Date(order.createdAt);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return createdDate >= sevenDaysAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* System Status Indicator */}
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <Zap className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Enhanced Affiliate System</h3>
            <p className="text-xs text-blue-600">
              Menggabungkan sistem lama dan BitKode-style attribution
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Sistem Lama: Aktif
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            BitKode-Style: Aktif
          </Badge>
        </div>
      </div>

      {/* Combined Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Affiliates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalAffiliates}</div>
            <p className="text-xs text-muted-foreground">
              User aktif dalam program
            </p>
          </CardContent>
        </Card>

        {/* Combined Commission */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Komisi</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStats.totalCommissionCombined)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">
                Lama: {formatCurrency(totalStats.totalCommissionOld)}
              </span>
              {' • '}
              <span className="text-purple-600">
                Baru: {formatCurrency(totalStats.totalCommissionNew)}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Combined Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Order</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalOrdersCombined}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">Lama: {totalStats.totalOrdersOld}</span>
              {' • '}
              <span className="text-purple-600">Baru: {totalStats.totalOrdersNew}</span>
            </p>
          </CardContent>
        </Card>

        {/* Pending Commissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Komisi Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalStats.pendingCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalStats.pendingCommissionsCount || 0} komisi butuh persetujuan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* BitKode-Style System Specific Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Attributions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attribution Aktif</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalStats.activeAttributions}
            </div>
            <p className="text-xs text-muted-foreground">
              1-day tracking window
            </p>
          </CardContent>
        </Card>

        {/* Total Attributions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attribution</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalStats.totalAttributions}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime tracking records
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity (7 days) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivitas 7 Hari</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recentAttributions}
            </div>
            <p className="text-xs text-muted-foreground">
              Attribution baru
            </p>
          </CardContent>
        </Card>

        {/* Recent Orders (7 days) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order 7 Hari</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recentOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              Order dengan komisi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                🔄 Sistem Affiliate Tradisional
              </h4>
              <div className="space-y-1 text-xs text-blue-700">
                <div>• {totalStats.totalAffiliates} affiliate terdaftar</div>
                <div>• {totalStats.totalOrdersOld} order dengan komisi</div>
                <div>• {formatCurrency(totalStats.totalCommissionOld)} total komisi</div>
                <div>• Sistem berbasis referral code sederhana</div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">
                💻 Sistem BitKode-Style
              </h4>
              <div className="space-y-1 text-xs text-purple-700">
                <div>• {totalStats.totalAttributions} tracking records</div>
                <div>• {totalStats.activeAttributions} attribution window aktif</div>
                <div>• {totalStats.totalOrdersNew} order terintegrasi</div>
                <div>• 1-day attribution window</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAffiliateStatsOverview;
