import React, { useState, useEffect, useMemo } from 'react';
import { db, analytics } from '@/config/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  Globe, 
  Smartphone, 
  Monitor,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

const TrafficAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  // Debug log untuk melihat perubahan analyticsData
  console.log('Current analyticsData:', analyticsData);
  console.log('Using Firestore data?', !!analyticsData);
  if (analyticsData) {
    console.log('Total visitors from Firestore:', analyticsData.totalVisitors);
    console.log('Daily breakdown from Firestore:', analyticsData.dailyBreakdown);
  }

  // Get data from Firestore or use fallback dummy data - using useMemo for reactive updates
  const visitorData = useMemo(() => {
    console.log('Recalculating visitorData, analyticsData:', analyticsData);
    return analyticsData?.dailyBreakdown || [
      { date: 'Sen', visitors: 2400, pageViews: 4800, bounceRate: 35 },
      { date: 'Sel', visitors: 1398, pageViews: 2800, bounceRate: 42 },
      { date: 'Rab', visitors: 9800, pageViews: 15600, bounceRate: 28 },
      { date: 'Kam', visitors: 3908, pageViews: 7800, bounceRate: 31 },
      { date: 'Jum', visitors: 4800, pageViews: 9600, bounceRate: 33 },
      { date: 'Sab', visitors: 3800, pageViews: 7200, bounceRate: 29 },
      { date: 'Min', visitors: 4300, pageViews: 8600, bounceRate: 34 }
    ];
  }, [analyticsData]);

  const deviceData = useMemo(() => {
    console.log('Recalculating deviceData, analyticsData:', analyticsData);
    return analyticsData?.devices ? [
      { name: 'Desktop', value: analyticsData.devices.desktop, color: '#0088FE' },
      { name: 'Mobile', value: analyticsData.devices.mobile, color: '#00C49F' },
      { name: 'Tablet', value: analyticsData.devices.tablet, color: '#FFBB28' }
    ] : [
      { name: 'Desktop', value: 45, color: '#0088FE' },
      { name: 'Mobile', value: 35, color: '#00C49F' },
      { name: 'Tablet', value: 20, color: '#FFBB28' }
    ];
  }, [analyticsData]);

  const trafficSources = useMemo(() => {
    console.log('Recalculating trafficSources, analyticsData:', analyticsData);
    return analyticsData?.trafficSources ? [
      { source: 'Google Search', visitors: analyticsData.trafficSources.google.visitors, percentage: analyticsData.trafficSources.google.percentage },
      { source: 'Direct', visitors: analyticsData.trafficSources.direct.visitors, percentage: analyticsData.trafficSources.direct.percentage },
      { source: 'Social Media', visitors: analyticsData.trafficSources.social.visitors, percentage: analyticsData.trafficSources.social.percentage },
      { source: 'Referral', visitors: analyticsData.trafficSources.referral.visitors, percentage: analyticsData.trafficSources.referral.percentage }
    ] : [
      { source: 'Google Search', visitors: 12450, percentage: 45.2 },
      { source: 'Direct', visitors: 8320, percentage: 30.1 },
      { source: 'Social Media', visitors: 4230, percentage: 15.3 },
      { source: 'Referral', visitors: 2580, percentage: 9.4 }
    ];
  }, [analyticsData]);

  const topPages = useMemo(() => {
    console.log('Recalculating topPages, analyticsData:', analyticsData);
    return analyticsData?.topPages ? analyticsData.topPages.map(page => ({
      page: page.page,
      views: page.views,
      bounce: `${page.bounce}%`
    })) : [
      { page: '/', views: 15420, bounce: '28%' },
      { page: '/products', views: 12350, bounce: '32%' },
      { page: '/bundles', views: 8940, bounce: '25%' },
      { page: '/auth', views: 6780, bounce: '45%' },
      { page: '/cart', views: 4560, bounce: '15%' }
    ];
  }, [analyticsData]);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = useMemo(() => {
    console.log('Recalculating stats, analyticsData:', analyticsData);
    return [
      {
        title: 'Total Pengunjung',
        value: analyticsData ? formatNumber(analyticsData.totalVisitors) : '28.5K',
        change: '+12.5%',
        icon: Users,
        color: 'bg-blue-500',
        trend: 'up'
      },
      {
        title: 'Page Views',
        value: analyticsData ? formatNumber(analyticsData.totalPageViews) : '64.2K',
        change: '+8.2%',
        icon: Eye,
        color: 'bg-green-500',
        trend: 'up'
      },
      {
        title: 'Avg. Session',
        value: analyticsData ? formatDuration(analyticsData.avgSessionDuration) : '3:45',
        change: '-2.1%',
        icon: Clock,
        color: 'bg-orange-500',
        trend: 'down'
      },
      {
        title: 'Bounce Rate',
        value: analyticsData ? `${analyticsData.avgBounceRate}%` : '32.4%',
        change: '-5.3%',
        icon: TrendingUp,
        color: 'bg-purple-500',
        trend: 'down'
      }
    ];
  }, [analyticsData]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulasi loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = () => {
    // Implementasi export data
    alert('Export data functionality akan diimplementasikan');
  };

  // Seed sample analytics data
  const seedSampleData = async () => {
    setIsLoading(true);
    try {
      const sampleData = [
        {
          id: 'weekly_summary_2024_w31',
          date: '2024-07-29',
          type: 'weekly_summary',
          period: 'week_31_2024',
          totalVisitors: 28500,
          totalPageViews: 64200,
          avgBounceRate: 32.4,
          avgSessionDuration: 225,
          devices: {
            desktop: 45,
            mobile: 35,
            tablet: 20
          },
          trafficSources: {
            google: { visitors: 12825, percentage: 45.0 },
            direct: { visitors: 8550, percentage: 30.0 },
            social: { visitors: 4275, percentage: 15.0 },
            referral: { visitors: 2850, percentage: 10.0 }
          },
          topPages: [
            { page: '/', views: 15420, bounce: 28 },
            { page: '/products', views: 12350, bounce: 32 },
            { page: '/bundles', views: 8940, bounce: 25 },
            { page: '/auth', views: 6780, bounce: 45 },
            { page: '/cart', views: 4560, bounce: 15 }
          ],
          dailyBreakdown: [
            { date: 'Sen', visitors: 2400, pageViews: 4800, bounceRate: 35 },
            { date: 'Sel', visitors: 1398, pageViews: 2800, bounceRate: 42 },
            { date: 'Rab', visitors: 9800, pageViews: 15600, bounceRate: 28 },
            { date: 'Kam', visitors: 3908, pageViews: 7800, bounceRate: 31 },
            { date: 'Jum', visitors: 4800, pageViews: 9600, bounceRate: 33 },
            { date: 'Sab', visitors: 3800, pageViews: 7200, bounceRate: 29 },
            { date: 'Min', visitors: 4300, pageViews: 8600, bounceRate: 34 }
          ]
        }
      ];

      for (const data of sampleData) {
        await setDoc(doc(db, 'analytics', data.id), data);
        console.log(`Added analytics data: ${data.id}`);
      }
      
      alert('Sample data berhasil ditambahkan ke Firestore!');
      // Refresh data setelah seeding
      const querySnapshot = await getDocs(collection(db, 'analytics'));
      const data = querySnapshot.docs.map(doc => doc.data());
      // Find weekly summary data
      const weeklyData = data.find(item => item.type === 'weekly_summary');
      setAnalyticsData(weeklyData);
      
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Error menambahkan sample data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data from Firestore
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'analytics'));
        const data = querySnapshot.docs.map(doc => doc.data());
        console.log('Data fetched from Firestore:', data);
        // Find weekly summary data
        const weeklyData = data.find(item => item.type === 'weekly_summary');
        console.log('Found weekly data:', weeklyData);
        if (weeklyData) {
          setAnalyticsData(weeklyData);
          setRenderKey(prev => prev + 1); // Force re-render
          console.log('Analytics data set:', weeklyData);
        } else {
          console.log('No weekly data found, available data:', data);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };
    
    fetchAnalyticsData();
  }, [timeRange]);

  return (
    <AdminLayout>
      <div className="p-8" key={renderKey}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Traffic Analytics</h1>
              <p className="text-gray-600">Analisis kunjungan dan performa website</p>
            </div>
            <div className="flex space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 Jam Terakhir</SelectItem>
                  <SelectItem value="7d">7 Hari Terakhir</SelectItem>
                  <SelectItem value="30d">30 Hari Terakhir</SelectItem>
                  <SelectItem value="90d">90 Hari Terakhir</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="secondary" onClick={seedSampleData} disabled={isLoading}>
                <Calendar className="w-4 h-4 mr-2" />
                Seed Data
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} dari periode sebelumnya
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Visitor Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Tren Pengunjung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={visitorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Pengunjung"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pageViews" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Page Views"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="w-5 h-5 mr-2" />
                Perangkat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {deviceData.map((device) => (
                  <div key={device.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: device.color }}
                      />
                      <span className="text-sm">{device.name}</span>
                    </div>
                    <span className="text-sm font-medium">{device.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Sumber Traffic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{source.source}</p>
                      <p className="text-sm text-gray-600">{source.visitors.toLocaleString()} pengunjung</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{source.percentage}%</p>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Halaman Terpopuler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium truncate">{page.page}</p>
                      <p className="text-sm text-gray-600">{page.views.toLocaleString()} views</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        parseInt(page.bounce) < 30 
                          ? 'bg-green-100 text-green-800' 
                          : parseInt(page.bounce) < 40 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {page.bounce} bounce
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TrafficAnalytics;
