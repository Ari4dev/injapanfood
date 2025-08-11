import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LayoutDashboard, BarChart3, Trophy, Link2, CreditCard, 
  Bell, Settings, HelpCircle, LogOut, Menu, X, User,
  TrendingUp, Users, DollarSign, Target, ChevronRight,
  MessageSquare, BookOpen, Gift, Sparkles
} from 'lucide-react';

// Import all the components we created
import PaymentMethods from './PaymentMethods';
import BitKodeAffiliateManagement from '../admin/BitKodeAffiliateManagement';

interface AffiliateInfo {
  id: string;
  name: string;
  email: string;
  tier: string;
  joinDate: Date;
  totalEarnings: number;
  currentBalance: number;
  activeLinks: number;
  conversions: number;
}

const BitKodeAffiliateDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Toggle for admin view
  
  const [affiliateInfo] = useState<AffiliateInfo>({
    id: '',
    name: '',
    email: '',
    tier: 'Bronze',
    joinDate: new Date(),
    totalEarnings: 0,
    currentBalance: 0,
    activeLinks: 0,
    conversions: 0
  });

  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold">¥{affiliateInfo.totalEarnings.toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +23% this month
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold">¥{affiliateInfo.currentBalance.toLocaleString()}</p>
              <Button size="sm" variant="link" className="p-0 mt-1">
                Request Payout <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <CreditCard className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Links</p>
              <p className="text-2xl font-bold">{affiliateInfo.activeLinks}</p>
              <p className="text-xs text-gray-500 mt-1">
                {affiliateInfo.conversions} conversions
              </p>
            </div>
            <Link2 className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Tier</p>
              <p className="text-2xl font-bold">{affiliateInfo.tier}</p>
              <Badge className="mt-1" variant="outline">8% Commission</Badge>
            </div>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-600">BitKode Affiliate</h1>
            <Button
              size="sm"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard className="w-4 h-4 mr-3" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'payments' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('payments')}
          >
            <CreditCard className="w-4 h-4 mr-3" />
            Payments
          </Button>

          {isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-3">Admin</p>
                <Button
                  variant={activeTab === 'admin' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('admin')}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Manage Affiliates
                </Button>
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <MessageSquare className="w-4 h-4 mr-3" />
            Support
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <BookOpen className="w-4 h-4 mr-3" />
            Resources
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{affiliateInfo.name}</p>
              <p className="text-xs text-gray-500">ID: {affiliateInfo.id}</p>
            </div>
            <Button size="sm" variant="ghost">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const WelcomeBanner = () => (
    <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, {affiliateInfo.name}! 👋</h2>
            <p className="opacity-90 mb-4">
              You're doing great! Your performance this month has been exceptional.
            </p>
            <div className="flex gap-3">
              <Button size="sm" variant="secondary">
                <Gift className="w-4 h-4 mr-2" />
                Claim Bonus
              </Button>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Sparkles className="w-4 h-4 mr-2" />
                What's New
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm font-semibold mb-1">Next Tier Progress</p>
              <div className="w-48 bg-white/30 rounded-full h-2 mb-2">
                <div className="bg-white rounded-full h-2" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs">65% to Gold Tier</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const NotificationBar = () => (
    <Alert className="mb-6 bg-yellow-50 border-yellow-200">
      <Bell className="h-4 w-4 text-yellow-600" />
      <AlertDescription>
        <strong>New Campaign Available!</strong> Join our Valentine's Day special campaign for 
        extra 3% commission on all sales. <Button variant="link" className="p-0 h-auto">Learn more →</Button>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="ghost"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'analytics' && 'Analytics & Reports'}
                {activeTab === 'tiers' && 'Tier System & Rewards'}
                {activeTab === 'links' && 'Link Generator & QR Codes'}
                {activeTab === 'payments' && 'Payment Methods & History'}
                {activeTab === 'admin' && 'Affiliate Management (Admin)'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                <Badge variant="destructive" className="ml-1">3</Badge>
              </Button>
              <Button variant="outline" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
              {!isAdmin && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsAdmin(true)}
                >
                  Switch to Admin
                </Button>
              )}
              {isAdmin && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsAdmin(false)}
                >
                  Switch to Affiliate
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <>
              <WelcomeBanner />
              <NotificationBar />
              <QuickStats />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-semibold">New conversion</p>
                          <p className="text-sm text-gray-600">Premium Ramen Set - ¥3,500</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50">+¥280</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-semibold">Link clicked</p>
                          <p className="text-sm text-gray-600">Instagram Story Campaign</p>
                        </div>
                        <Badge variant="outline">23 clicks</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-semibold">Payment received</p>
                          <p className="text-sm text-gray-600">January Commission</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50">¥385,000</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-auto py-4 flex-col">
                        <Link2 className="w-5 h-5 mb-2" />
                        <span className="text-xs">Create Link</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col">
                        <BarChart3 className="w-5 h-5 mb-2" />
                        <span className="text-xs">View Stats</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col">
                        <CreditCard className="w-5 h-5 mb-2" />
                        <span className="text-xs">Request Payout</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col">
                        <Gift className="w-5 h-5 mb-2" />
                        <span className="text-xs">Claim Rewards</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'payments' && <PaymentMethods affiliateId={affiliateInfo.id} />}
          {activeTab === 'admin' && isAdmin && <BitKodeAffiliateManagement />}
        </main>
      </div>
    </div>
  );
};

export default BitKodeAffiliateDashboard;
