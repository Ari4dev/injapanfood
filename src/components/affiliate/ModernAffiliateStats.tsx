import { Card, CardContent } from '@/components/ui/card';
import { useAffiliate } from '@/hooks/useAffiliate';
import { TrendingUp, Users, Clock, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import { useLanguage } from '@/hooks/useLanguage';

const ModernAffiliateStats = () => {
  const { affiliate, loading, commissions, referrals } = useAffiliate();
  const { t } = useLanguage();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (!affiliate) {
    return null;
  }

  // Calculate conversion rate
  const conversionRate = affiliate.totalClicks > 0 
    ? ((affiliate.totalReferrals / affiliate.totalClicks) * 100).toFixed(1) 
    : '0.0';

  // Count approved commissions
  const approvedCommissionsCount = commissions.filter(comm => comm.status === 'approved').length;
  // Calculate commission values from actual commission records for consistency
  const pendingCommissions = commissions.filter(comm => comm.status === 'pending');
  const approvedCommissions = commissions.filter(comm => comm.status === 'approved');
  const paidCommissions = commissions.filter(comm => comm.status === 'paid');
  
  const calculatedPendingCommission = pendingCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
  const calculatedApprovedCommission = approvedCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
  
  // FIXED: Total commission should NOT include paid commissions
  const calculatedPaidCommission = paidCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
  
  // FIXED: Total commission should include ALL commissions (lifetime earnings)
  const calculatedTotalCommission = calculatedPendingCommission + calculatedApprovedCommission + calculatedPaidCommission;
  
  // Available commission is only approved commissions (ready for payout)
  const availableCommission = calculatedApprovedCommission;

  // Calculate actual referral counts from referrals array for accuracy
  const actualTotalClicks = referrals.filter(ref => ref.status === 'clicked' || ref.status === 'registered' || ref.status === 'ordered' || ref.status === 'approved').length;
  const actualTotalReferrals = referrals.filter(ref => 
    ref.status === 'registered' || ref.status === 'ordered' || ref.status === 'approved'
  ).length;
  // Calculate actual referral counts from referrals array for accuracy
  const actualTotalClicks = referrals.filter(ref => 
    ref.status === 'clicked' || ref.status === 'registered' || ref.status === 'ordered' || ref.status === 'approved'
  ).length;
  
  const actualTotalReferrals = referrals.filter(ref => 
    ref.status === 'registered' || ref.status === 'ordered' || ref.status === 'approved'
  ).length;
  
  // Use actual counts for display
  const displayTotalClicks = Math.max(actualTotalClicks, affiliate.totalClicks);
      value: displayTotalClicks,
      icon: TrendingUp,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      growth: 8.2, // Mock data
      description: 'Jumlah klik pada link affiliate'
    },
    {
      title: 'Total Referral',
      value: displayTotalReferrals,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100',
      growth: 5.3, // Mock data
      description: 'Jumlah pengguna yang mendaftar'
    },
    {
      title: 'Komisi Pending',
      value: `¥${calculatedPendingCommission.toLocaleString()}`,
      icon: Clock,
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      growth: 0, // No growth for pending
      description: 'Komisi yang belum disetujui admin'
      title: 'Komisi Tersedia',
      value: `¥${availableCommission.toLocaleString()}`,
      title: 'Total Komisi',
      value: `¥${calculatedApprovedCommission.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-50',
      description: 'Komisi siap untuk dicairkan',
      change: `Dari total ¥${calculatedTotalCommission.toLocaleString()}`
      description: `Saldo komisi yang tersedia untuk dicairkan`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositiveGrowth = stat.growth > 0;
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={`border ${stat.borderColor} ${stat.bgColor} overflow-hidden hover:shadow-md transition-all duration-300`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.textColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {stat.growth !== 0 && (
                    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                      isPositiveGrowth ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isPositiveGrowth ? (
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(stat.growth)}%
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ModernAffiliateStats;