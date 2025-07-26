import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAffiliate } from '@/hooks/useAffiliate';
import { TrendingUp, Users, ShoppingCart, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const AffiliateStats = () => {
  const { affiliate, loading, commissions } = useAffiliate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!affiliate) {
    return null;
  }

  // Calculate commission values from actual commission records for consistency
  const pendingCommissions = commissions.filter(comm => comm.status === 'pending');
  const approvedCommissions = commissions.filter(comm => comm.status === 'approved');
  const paidCommissions = commissions.filter(comm => comm.status === 'paid');
  
  const calculatedPendingCommission = pendingCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
  const calculatedApprovedCommission = approvedCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
  const calculatedTotalCommission = calculatedPendingCommission + calculatedApprovedCommission + 
                                   paidCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);

  const stats = [
    {
      title: 'Total Klik',
      value: affiliate.totalClicks,
  // Calculate actual referral counts from referrals array for accuracy
  const actualTotalClicks = referrals.filter(ref => ref.status === 'clicked' || ref.status === 'registered' || ref.status === 'ordered' || ref.status === 'approved').length;
  const actualTotalReferrals = referrals.filter(ref => 
    ref.status === 'registered' || ref.status === 'ordered' || ref.status === 'approved'
  ).length;
  
  // Use actual counts instead of affiliate object values for consistency
  const displayTotalClicks = Math.max(actualTotalClicks, affiliate.totalClicks);
  const displayTotalReferrals = Math.max(actualTotalReferrals, affiliate.totalReferrals);
  
  // Fix the calculation logic - clicks should count all interactions
  const correctTotalClicks = referrals.filter(ref => 
    ref.status === 'clicked' || ref.status === 'registered' || ref.status === 'ordered' || ref.status === 'approved'
  ).length;
  
  const correctedConversionRate = correctTotalClicks > 0 
    ? ((correctTotalReferrals / correctTotalClicks) * 100).toFixed(1) 
    : '0.0';
  // Referrals should only count successful conversions (registered and beyond)
  const correctTotalReferrals = referrals.filter(ref => 
    ref.status === 'registered' || ref.status === 'ordered' || ref.status === 'approved'
  ).length;
      value: displayTotalClicks,
      value: correctTotalClicks,
      icon: TrendingUp,
      color: 'bg-blue-500 text-white',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Jumlah klik pada link affiliate',
      change: '+12% minggu ini'
    },
    {
      title: 'Total Referral',
      value: displayTotalReferrals,
      value: correctTotalReferrals,
      icon: Users,
      color: 'bg-green-500 text-white',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Jumlah pengguna yang mendaftar',
      change: '+3 bulan ini'
    },
    {
      title: 'Komisi Pending',
      value: `¥${calculatedPendingCommission.toLocaleString()}`,
      icon: Clock,
      color: 'bg-yellow-500 text-white',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      description: 'Komisi yang belum dibayarkan',
      change: 'Menunggu persetujuan'
    },
    {
      title: 'Total Komisi',
      value: `¥${calculatedTotalCommission.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-red-500 text-white',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Total komisi yang didapatkan',
      change: `¥${calculatedApprovedCommission.toLocaleString()} tersedia`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card 
              key={index} 
              className={`hover:shadow-md transition-all duration-300 border ${stat.borderColor} ${stat.bgColor} overflow-hidden`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
                  <Icon className="w-4 h-4 mr-2 text-gray-500" />
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.color} shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">{stat.description}</p>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50 border border-gray-200">
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AffiliateStats;