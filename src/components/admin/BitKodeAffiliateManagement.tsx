import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users, UserPlus, UserCheck, UserX, Search, Filter, Download,
  TrendingUp, TrendingDown, DollarSign, Link2, Eye, Edit,
  Ban, CheckCircle, Clock, AlertCircle, Mail, MoreVertical,
  Settings, FileText, BarChart3, Award, Shield, Trash2,
  Calendar, ArrowUpDown, ChevronRight, Info, MessageSquare
} from 'lucide-react';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  tier: string;
  joinDate: Date;
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  activeLinks: number;
  conversionRate: number;
  lastActivity: Date;
  paymentMethod?: string;
  notes?: string;
}

interface Application {
  id: string;
  name: string;
  email: string;
  website?: string;
  socialMedia?: string;
  experience: string;
  expectedSales: string;
  marketingPlan: string;
  appliedDate: Date;
  status: 'pending' | 'approved' | 'rejected';
}

const BitKodeAffiliateManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const [affiliates] = useState<Affiliate[]>([
    {
      id: 'AFF001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+81 90-1234-5678',
      status: 'active',
      tier: 'Gold',
      joinDate: new Date('2023-06-15'),
      totalSales: 245,
      totalRevenue: 8575000,
      totalCommission: 1028400,
      activeLinks: 42,
      conversionRate: 8.5,
      lastActivity: new Date('2024-01-28'),
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 'AFF002',
      name: 'Sarah Smith',
      email: 'sarah.smith@example.com',
      status: 'active',
      tier: 'Silver',
      joinDate: new Date('2023-08-20'),
      totalSales: 156,
      totalRevenue: 5460000,
      totalCommission: 436800,
      activeLinks: 28,
      conversionRate: 7.2,
      lastActivity: new Date('2024-01-27'),
      paymentMethod: 'PayPal'
    },
    {
      id: 'AFF003',
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      status: 'pending',
      tier: 'Bronze',
      joinDate: new Date('2024-01-15'),
      totalSales: 0,
      totalRevenue: 0,
      totalCommission: 0,
      activeLinks: 0,
      conversionRate: 0,
      lastActivity: new Date('2024-01-15')
    },
    {
      id: 'AFF004',
      name: 'Emma Wilson',
      email: 'emma.w@example.com',
      status: 'suspended',
      tier: 'Silver',
      joinDate: new Date('2023-09-10'),
      totalSales: 89,
      totalRevenue: 3115000,
      totalCommission: 249200,
      activeLinks: 15,
      conversionRate: 5.8,
      lastActivity: new Date('2024-01-10'),
      notes: 'Suspended due to policy violation'
    }
  ]);

  const [applications] = useState<Application[]>([
    {
      id: 'APP001',
      name: 'David Chen',
      email: 'david.chen@example.com',
      website: 'https://foodblog.com',
      socialMedia: '@davidfoodie',
      experience: '3 years in food blogging',
      expectedSales: '50-100 per month',
      marketingPlan: 'Instagram, YouTube, Blog posts',
      appliedDate: new Date('2024-01-25'),
      status: 'pending'
    },
    {
      id: 'APP002',
      name: 'Lisa Park',
      email: 'lisa.park@example.com',
      website: 'https://asiancuisine.blog',
      socialMedia: '@lisaeats',
      experience: '5 years influencer marketing',
      expectedSales: '100-200 per month',
      marketingPlan: 'TikTok, Instagram Stories, Email newsletter',
      appliedDate: new Date('2024-01-26'),
      status: 'pending'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'diamond': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <div className={`flex items-center mt-2 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                <span>{Math.abs(change)}% from last month</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AffiliateDetailsDialog = () => (
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Affiliate Details - {selectedAffiliate?.name}</DialogTitle>
          <DialogDescription>
            View and manage affiliate information
          </DialogDescription>
        </DialogHeader>
        
        {selectedAffiliate && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select defaultValue={selectedAffiliate.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tier</Label>
                <Select defaultValue={selectedAffiliate.tier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bronze">Bronze (5%)</SelectItem>
                    <SelectItem value="Silver">Silver (8%)</SelectItem>
                    <SelectItem value="Gold">Gold (12%)</SelectItem>
                    <SelectItem value="Platinum">Platinum (15%)</SelectItem>
                    <SelectItem value="Diamond">Diamond (20%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Commission Rate (Optional)</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="e.g., 10" />
                <span className="flex items-center px-3 bg-gray-100 rounded">%</span>
              </div>
              <p className="text-xs text-gray-500">Override tier commission rate</p>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                placeholder="Add internal notes about this affiliate..."
                defaultValue={selectedAffiliate.notes}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="font-bold">¥{selectedAffiliate.totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Commission</p>
                <p className="font-bold">¥{selectedAffiliate.totalCommission.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="font-bold">{selectedAffiliate.conversionRate}%</p>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Affiliates"
          value="1,234"
          change={12}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Affiliates"
          value="892"
          change={8}
          icon={UserCheck}
          color="bg-green-500"
        />
        <StatCard
          title="Total Revenue"
          value="¥45.6M"
          change={23}
          icon={DollarSign}
          color="bg-purple-500"
        />
        <StatCard
          title="Avg. Conversion"
          value="7.8%"
          change={-2}
          icon={TrendingUp}
          color="bg-yellow-500"
        />
      </div>

      <Tabs defaultValue="affiliates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="affiliates">All Affiliates</TabsTrigger>
          <TabsTrigger value="applications">
            Applications
            <Badge className="ml-2" variant="destructive">
              {applications.filter(a => a.status === 'pending').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Manage Affiliates</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search affiliates..."
                      className="pl-10 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Affiliate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Conv. Rate</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates
                    .filter(a => filterStatus === 'all' || a.status === filterStatus)
                    .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 a.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{affiliate.name}</p>
                          <p className="text-sm text-gray-500">{affiliate.email}</p>
                          <p className="text-xs text-gray-400">ID: {affiliate.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(affiliate.status)}>
                          {affiliate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierColor(affiliate.tier)}>
                          {affiliate.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>{affiliate.totalSales}</TableCell>
                      <TableCell>¥{affiliate.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell>¥{affiliate.totalCommission.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {affiliate.conversionRate}%
                          {affiliate.conversionRate > 7 ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : affiliate.conversionRate > 0 ? (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {affiliate.lastActivity.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedAffiliate(affiliate);
                              setShowEditDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600">
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Applications</CardTitle>
              <CardDescription>
                Review and approve new affiliate applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.filter(a => a.status === 'pending').map((application) => (
                  <Card key={application.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-semibold">{application.name}</h4>
                            <p className="text-sm text-gray-600">{application.email}</p>
                          </div>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {application.appliedDate.toLocaleDateString()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Website</p>
                            <p className="font-medium">{application.website || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Social Media</p>
                            <p className="font-medium">{application.socialMedia || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Expected Sales</p>
                            <p className="font-medium">{application.expectedSales}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Experience</p>
                            <p className="font-medium">{application.experience}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Marketing Plan</p>
                          <p className="text-sm">{application.marketingPlan}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          <UserX className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Monitor affiliate performance and identify top performers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Top Performers */}
                <div>
                  <h3 className="font-semibold mb-3">Top Performers This Month</h3>
                  <div className="space-y-3">
                    {affiliates
                      .filter(a => a.status === 'active')
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .slice(0, 5)
                      .map((affiliate, index) => (
                      <div key={affiliate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{affiliate.name}</p>
                            <p className="text-sm text-gray-600">
                              {affiliate.totalSales} sales • {affiliate.conversionRate}% conversion
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">¥{affiliate.totalRevenue.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">
                            Commission: ¥{affiliate.totalCommission.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Avg. Order Value</p>
                          <p className="text-xl font-bold">¥35,000</p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Active Links</p>
                          <p className="text-xl font-bold">3,456</p>
                        </div>
                        <Link2 className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Click-Through Rate</p>
                          <p className="text-xl font-bold">12.3%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Management</CardTitle>
              <CardDescription>
                Process and track affiliate payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Pending Payouts</p>
                      <p className="text-2xl font-bold">¥2,345,678</p>
                      <p className="text-xs text-gray-500 mt-1">23 affiliates</p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Processed This Month</p>
                      <p className="text-2xl font-bold">¥8,901,234</p>
                      <p className="text-xs text-gray-500 mt-1">156 payments</p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Next Payout Date</p>
                      <p className="text-2xl font-bold">Jan 31</p>
                      <p className="text-xs text-gray-500 mt-1">In 3 days</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Pending Payouts</h3>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                    <Button>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Process All Payouts
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates
                      .filter(a => a.status === 'active' && a.totalCommission > 0)
                      .map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{affiliate.name}</p>
                            <p className="text-sm text-gray-500">{affiliate.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          ¥{(affiliate.totalCommission * 0.1).toLocaleString()}
                        </TableCell>
                        <TableCell>{affiliate.paymentMethod || 'Not set'}</TableCell>
                        <TableCell>Jan 1-31, 2024</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm">
                              Process
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission Settings</CardTitle>
                <CardDescription>
                  Configure default commission rates and tier requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Bronze Tier</Label>
                      <div className="flex gap-2 mt-1">
                        <Input type="number" defaultValue="5" />
                        <span className="flex items-center px-3 bg-gray-100 rounded">%</span>
                      </div>
                    </div>
                    <div>
                      <Label>Silver Tier</Label>
                      <div className="flex gap-2 mt-1">
                        <Input type="number" defaultValue="8" />
                        <span className="flex items-center px-3 bg-gray-100 rounded">%</span>
                      </div>
                    </div>
                    <div>
                      <Label>Gold Tier</Label>
                      <div className="flex gap-2 mt-1">
                        <Input type="number" defaultValue="12" />
                        <span className="flex items-center px-3 bg-gray-100 rounded">%</span>
                      </div>
                    </div>
                    <div>
                      <Label>Platinum Tier</Label>
                      <div className="flex gap-2 mt-1">
                        <Input type="number" defaultValue="15" />
                        <span className="flex items-center px-3 bg-gray-100 rounded">%</span>
                      </div>
                    </div>
                    <div>
                      <Label>Diamond Tier</Label>
                      <div className="flex gap-2 mt-1">
                        <Input type="number" defaultValue="20" />
                        <span className="flex items-center px-3 bg-gray-100 rounded">%</span>
                      </div>
                    </div>
                  </div>
                  <Button>Save Commission Settings</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-approve applications</p>
                    <p className="text-sm text-gray-600">Automatically approve new affiliate applications</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Cookie duration</p>
                    <p className="text-sm text-gray-600">How long affiliate cookies last</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Minimum payout</p>
                    <p className="text-sm text-gray-600">Minimum balance required for payout</p>
                  </div>
                  <div className="flex gap-2">
                    <Input type="number" defaultValue="100000" className="w-32" />
                    <span className="flex items-center px-3 bg-gray-100 rounded">JPY</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AffiliateDetailsDialog />
    </div>
  );
};

export default BitKodeAffiliateManagement;
