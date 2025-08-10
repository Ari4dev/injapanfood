import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy, Crown, Star, Award, TrendingUp, Gift, Zap, Target,
  CheckCircle, Lock, Unlock, ArrowUp, Info, DollarSign, Users,
  ShoppingBag, Percent, Medal, Shield, Gem
} from 'lucide-react';

interface TierLevel {
  id: string;
  name: string;
  icon: any;
  color: string;
  minSales: number;
  commissionRate: number;
  benefits: string[];
  bonuses: {
    signupBonus?: number;
    monthlyBonus?: number;
    quarterlyBonus?: number;
  };
  requirements: {
    monthlySales: number;
    totalRevenue: number;
    activeReferrals?: number;
  };
}

interface AffiliateStats {
  currentTier: string;
  totalSales: number;
  monthlyRevenue: number;
  totalRevenue: number;
  activeReferrals: number;
  nextTierProgress: number;
}

const TierSystem = ({ affiliateId }: { affiliateId?: string }) => {
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats>({
    currentTier: 'silver',
    totalSales: 145,
    monthlyRevenue: 2850000,
    totalRevenue: 15670000,
    activeReferrals: 23,
    nextTierProgress: 65
  });

  const tierLevels: TierLevel[] = [
    {
      id: 'bronze',
      name: 'Bronze',
      icon: Medal,
      color: 'bg-orange-600',
      minSales: 0,
      commissionRate: 5,
      benefits: [
        'Basic analytics dashboard',
        'Monthly payment',
        'Email support',
        'Basic promotional materials'
      ],
      bonuses: {
        signupBonus: 50000
      },
      requirements: {
        monthlySales: 0,
        totalRevenue: 0
      }
    },
    {
      id: 'silver',
      name: 'Silver',
      icon: Shield,
      color: 'bg-gray-500',
      minSales: 50,
      commissionRate: 8,
      benefits: [
        'Advanced analytics',
        'Bi-weekly payment',
        'Priority email support',
        'Custom promotional materials',
        'Exclusive product previews'
      ],
      bonuses: {
        signupBonus: 100000,
        monthlyBonus: 150000
      },
      requirements: {
        monthlySales: 1000000,
        totalRevenue: 5000000,
        activeReferrals: 10
      }
    },
    {
      id: 'gold',
      name: 'Gold',
      icon: Star,
      color: 'bg-yellow-500',
      minSales: 200,
      commissionRate: 12,
      benefits: [
        'Premium analytics with AI insights',
        'Weekly payment',
        'Dedicated account manager',
        'Co-branded marketing materials',
        'Early access to new products',
        'Quarterly bonus program'
      ],
      bonuses: {
        signupBonus: 200000,
        monthlyBonus: 300000,
        quarterlyBonus: 1000000
      },
      requirements: {
        monthlySales: 5000000,
        totalRevenue: 25000000,
        activeReferrals: 50
      }
    },
    {
      id: 'platinum',
      name: 'Platinum',
      icon: Gem,
      color: 'bg-purple-600',
      minSales: 500,
      commissionRate: 15,
      benefits: [
        'Enterprise analytics suite',
        'Daily payment option',
        'Dedicated team support',
        'White-label solutions',
        'Exclusive partner events',
        'Custom API access',
        'Performance-based bonuses'
      ],
      bonuses: {
        signupBonus: 500000,
        monthlyBonus: 750000,
        quarterlyBonus: 3000000
      },
      requirements: {
        monthlySales: 15000000,
        totalRevenue: 100000000,
        activeReferrals: 150
      }
    },
    {
      id: 'diamond',
      name: 'Diamond',
      icon: Crown,
      color: 'bg-blue-600',
      minSales: 1000,
      commissionRate: 20,
      benefits: [
        'Full suite analytics & AI tools',
        'Instant payment processing',
        'C-level partnership status',
        'Custom development support',
        'Revenue sharing program',
        'Global expansion opportunities',
        'Equity participation options',
        'VIP retreat invitations'
      ],
      bonuses: {
        signupBonus: 1000000,
        monthlyBonus: 2000000,
        quarterlyBonus: 10000000
      },
      requirements: {
        monthlySales: 50000000,
        totalRevenue: 500000000,
        activeReferrals: 500
      }
    }
  ];

  const getCurrentTier = () => tierLevels.find(t => t.id === affiliateStats.currentTier);
  const getNextTier = () => {
    const currentIndex = tierLevels.findIndex(t => t.id === affiliateStats.currentTier);
    return currentIndex < tierLevels.length - 1 ? tierLevels[currentIndex + 1] : null;
  };

  const TierCard = ({ tier, isActive, isLocked }: { tier: TierLevel, isActive: boolean, isLocked: boolean }) => {
    const Icon = tier.icon;
    
    return (
      <Card className={`relative ${isActive ? 'ring-2 ring-blue-500' : ''} ${isLocked ? 'opacity-60' : ''}`}>
        {isActive && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-500 text-white">Current Tier</Badge>
          </div>
        )}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${tier.color} text-white`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="text-lg font-bold text-green-600">
                  {tier.commissionRate}% Commission
                </CardDescription>
              </div>
            </div>
            {isLocked ? (
              <Lock className="w-5 h-5 text-gray-400" />
            ) : (
              <Unlock className="w-5 h-5 text-green-500" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Requirements:</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                Monthly: ¥{tier.requirements.monthlySales.toLocaleString()}
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                Total: ¥{tier.requirements.totalRevenue.toLocaleString()}
              </li>
              {tier.requirements.activeReferrals && (
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  {tier.requirements.activeReferrals} Active Referrals
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Benefits:</h4>
            <ul className="space-y-1">
              {tier.benefits.slice(0, 3).map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
              {tier.benefits.length > 3 && (
                <li className="text-sm text-gray-500 ml-6">
                  +{tier.benefits.length - 3} more benefits
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Bonuses:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {tier.bonuses.signupBonus && (
                <div className="flex items-center gap-1">
                  <Gift className="w-4 h-4 text-purple-500" />
                  <span>¥{(tier.bonuses.signupBonus / 1000)}K signup</span>
                </div>
              )}
              {tier.bonuses.monthlyBonus && (
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>¥{(tier.bonuses.monthlyBonus / 1000)}K/month</span>
                </div>
              )}
              {tier.bonuses.quarterlyBonus && (
                <div className="flex items-center gap-1 col-span-2">
                  <Trophy className="w-4 h-4 text-gold-500" />
                  <span>¥{(tier.bonuses.quarterlyBonus / 1000000)}M/quarter</span>
                </div>
              )}
            </div>
          </div>

          {isActive && (
            <div className="pt-2 border-t">
              <Button className="w-full" variant="default">
                View My Benefits
              </Button>
            </div>
          )}
          {!isActive && !isLocked && (
            <div className="pt-2 border-t">
              <Button className="w-full" variant="outline">
                View Requirements
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ProgressSection = () => {
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    
    if (!nextTier) {
      return (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Crown className="w-12 h-12 text-gold-500" />
              <div>
                <h3 className="text-lg font-bold">Congratulations!</h3>
                <p className="text-gray-600">You've reached the highest tier - Diamond Partner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Progress to {nextTier.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-bold">{affiliateStats.nextTierProgress}%</span>
            </div>
            <Progress value={affiliateStats.nextTierProgress} className="h-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Monthly Revenue</span>
              </div>
              <p className="text-lg font-bold">
                ¥{affiliateStats.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Need ¥{(nextTier.requirements.monthlySales - affiliateStats.monthlyRevenue).toLocaleString()} more
              </p>
              <Progress 
                value={(affiliateStats.monthlyRevenue / nextTier.requirements.monthlySales) * 100} 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Total Revenue</span>
              </div>
              <p className="text-lg font-bold">
                ¥{affiliateStats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Need ¥{(nextTier.requirements.totalRevenue - affiliateStats.totalRevenue).toLocaleString()} more
              </p>
              <Progress 
                value={(affiliateStats.totalRevenue / nextTier.requirements.totalRevenue) * 100} 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Active Referrals</span>
              </div>
              <p className="text-lg font-bold">
                {affiliateStats.activeReferrals}
              </p>
              <p className="text-xs text-gray-500">
                Need {(nextTier.requirements.activeReferrals || 0) - affiliateStats.activeReferrals} more
              </p>
              <Progress 
                value={(affiliateStats.activeReferrals / (nextTier.requirements.activeReferrals || 1)) * 100} 
                className="h-2" 
              />
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong>Pro Tip:</strong> Focus on increasing your active referrals to accelerate your tier progression. 
              Each new active customer brings you closer to {nextTier.name} tier with {nextTier.commissionRate}% commission!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tier System & Rewards</h2>
        <Button variant="outline">
          <Award className="w-4 h-4 mr-2" />
          View All Rewards
        </Button>
      </div>

      <ProgressSection />

      <Tabs defaultValue="all-tiers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-tiers">All Tiers</TabsTrigger>
          <TabsTrigger value="benefits">Benefits Comparison</TabsTrigger>
          <TabsTrigger value="earnings">Earnings Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="all-tiers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tierLevels.map((tier) => {
              const currentIndex = tierLevels.findIndex(t => t.id === affiliateStats.currentTier);
              const tierIndex = tierLevels.findIndex(t => t.id === tier.id);
              const isLocked = tierIndex > currentIndex;
              const isActive = tier.id === affiliateStats.currentTier;
              
              return (
                <TierCard 
                  key={tier.id} 
                  tier={tier} 
                  isActive={isActive}
                  isLocked={isLocked}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Benefits Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Benefit</th>
                      {tierLevels.map(tier => (
                        <th key={tier.id} className="text-center p-2">
                          <div className="flex flex-col items-center gap-1">
                            <tier.icon className="w-5 h-5" />
                            <span className="text-sm">{tier.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Commission Rate</td>
                      {tierLevels.map(tier => (
                        <td key={tier.id} className="text-center p-2">
                          <Badge variant="outline">{tier.commissionRate}%</Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Payment Frequency</td>
                      <td className="text-center p-2">Monthly</td>
                      <td className="text-center p-2">Bi-weekly</td>
                      <td className="text-center p-2">Weekly</td>
                      <td className="text-center p-2">Daily</td>
                      <td className="text-center p-2">Instant</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Signup Bonus</td>
                      {tierLevels.map(tier => (
                        <td key={tier.id} className="text-center p-2">
                          ¥{(tier.bonuses.signupBonus || 0).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Monthly Bonus</td>
                      {tierLevels.map(tier => (
                        <td key={tier.id} className="text-center p-2">
                          {tier.bonuses.monthlyBonus ? `¥${tier.bonuses.monthlyBonus.toLocaleString()}` : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Account Manager</td>
                      <td className="text-center p-2">-</td>
                      <td className="text-center p-2">-</td>
                      <td className="text-center p-2">✓</td>
                      <td className="text-center p-2">✓</td>
                      <td className="text-center p-2">✓</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">API Access</td>
                      <td className="text-center p-2">-</td>
                      <td className="text-center p-2">-</td>
                      <td className="text-center p-2">-</td>
                      <td className="text-center p-2">✓</td>
                      <td className="text-center p-2">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Calculator</CardTitle>
              <CardDescription>See how much you could earn at each tier level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Monthly Sales Volume</label>
                    <input 
                      type="number" 
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="Enter amount in ¥"
                      defaultValue="5000000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Number of Sales</label>
                    <input 
                      type="number" 
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="Enter number"
                      defaultValue="150"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
                  {tierLevels.map(tier => (
                    <Card key={tier.id} className="text-center">
                      <CardContent className="pt-4">
                        <tier.icon className="w-8 h-8 mx-auto mb-2" />
                        <h4 className="font-semibold">{tier.name}</h4>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          ¥{(5000000 * tier.commissionRate / 100).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">per month</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TierSystem;
