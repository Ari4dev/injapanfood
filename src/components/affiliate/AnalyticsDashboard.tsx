import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, MousePointer, ShoppingCart, 
  DollarSign, Award, Target, Activity, Globe, Smartphone, Monitor,
  ArrowUp, ArrowDown, Calendar
} from 'lucide-react';

interface AnalyticsData {
  conversionRate: number;
  clickThroughRate: number;
  averageOrderValue: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  dailyTrend: any[];
  topProducts: any[];
  geoDistribution: any[];
  deviceStats: any[];
}

const AnalyticsDashboard = ({ affiliateId }: { affiliateId?: string }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    conversionRate: 8.5,
    clickThroughRate: 12.3,
    averageOrderValue: 3500,
    totalClicks: 15234,
    totalConversions: 1295,
    totalRevenue: 4537500,
    dailyTrend: [
      { date: 'Mon', clicks: 2100, conversions: 178, revenue: 623000 },
      { date: 'Tue', clicks: 2350, conversions: 199, revenue: 696500 },
      { date: 'Wed', clicks: 1890, conversions: 160, revenue: 560000 },
      { date: 'Thu', clicks: 2456, conversions: 208, revenue: 728000 },
      { date: 'Fri', clicks: 2678, conversions: 227, revenue: 794500 },
      { date: 'Sat', clicks: 1980, conversions: 168, revenue: 588000 },
      { date: 'Sun', clicks: 1780, conversions: 155, revenue: 547500 },
    ],
    topProducts: [
      { name: 'Premium Ramen Set', sales: 245, revenue: 857500 },
      { name: 'Matcha Kit', sales: 189, revenue: 661500 },
      { name: 'Sushi Bundle', sales: 167, revenue: 584500 },
      { name: 'Snack Box', sales: 156, revenue: 546000 },
      { name: 'Sake Collection', sales: 134, revenue: 469000 },
    ],
    geoDistribution: [
      { region: 'Jakarta', value: 35 },
      { region: 'Surabaya', value: 20 },
      { region: 'Bandung', value: 15 },
      { region: 'Medan', value: 12 },
      { region: 'Others', value: 18 },
    ],
    deviceStats: [
      { device: 'Mobile', value: 65, color: '#8884d8' },
      { device: 'Desktop', value: 28, color: '#82ca9d' },
      { device: 'Tablet', value: 7, color: '#ffc658' },
    ],
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const MetricCard = ({ title, value, change, icon: Icon, color }: any) => (
    <Card className={`border-l-4 ${color} hover:shadow-lg transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <div className={`flex items-center mt-2 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                <span>{Math.abs(change)}% vs last period</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('500', '100')}`}>
            <Icon className={`w-6 h-6 ${color.replace('border-l-', 'text-')}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Conversion Rate"
          value={`${analyticsData.conversionRate}%`}
          change={2.3}
          icon={Target}
          color="border-l-blue-500"
        />
        <MetricCard
          title="Click-Through Rate"
          value={`${analyticsData.clickThroughRate}%`}
          change={-1.2}
          icon={MousePointer}
          color="border-l-green-500"
        />
        <MetricCard
          title="Avg Order Value"
          value={`¥${analyticsData.averageOrderValue.toLocaleString()}`}
          change={5.7}
          icon={ShoppingCart}
          color="border-l-yellow-500"
        />
        <MetricCard
          title="Total Revenue"
          value={`¥${(analyticsData.totalRevenue / 1000000).toFixed(2)}M`}
          change={12.4}
          icon={DollarSign}
          color="border-l-purple-500"
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height="400">
                <AreaChart data={analyticsData.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="clicks"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Clicks"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversions"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Conversions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Clicks</span>
                      <span className="text-sm font-bold">{analyticsData.totalClicks.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div className="bg-blue-500 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{ width: '100%' }}>
                        100%
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Add to Cart</span>
                      <span className="text-sm font-bold">3,456</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div className="bg-green-500 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{ width: '65%' }}>
                        65%
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Checkout</span>
                      <span className="text-sm font-bold">2,145</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div className="bg-yellow-500 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{ width: '40%' }}>
                        40%
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Purchase</span>
                      <span className="text-sm font-bold">{analyticsData.totalConversions.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div className="bg-purple-500 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{ width: '24%' }}>
                        24%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height="300">
                  <BarChart data={analyticsData.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `¥${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-gold-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.sales} sales</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">¥{product.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        {((product.revenue / analyticsData.totalRevenue) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height="300">
                  <PieChart>
                    <Pie
                      data={analyticsData.geoDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.region}: ${entry.value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.geoDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {analyticsData.geoDistribution.map((region, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span>{region.region}</span>
                      </div>
                      <span className="font-bold">{region.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Device Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {analyticsData.deviceStats.map((device, index) => (
                  <Card key={index} className="text-center">
                    <CardContent className="pt-6">
                      <div className="flex justify-center mb-4">
                        {device.device === 'Mobile' ? (
                          <Smartphone className="w-12 h-12 text-blue-500" />
                        ) : device.device === 'Desktop' ? (
                          <Monitor className="w-12 h-12 text-green-500" />
                        ) : (
                          <Monitor className="w-12 h-12 text-yellow-500" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold">{device.device}</h3>
                      <p className="text-3xl font-bold mt-2">{device.value}%</p>
                      <p className="text-sm text-gray-600 mt-1">of total traffic</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height="200">
                  <BarChart data={analyticsData.deviceStats} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="device" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {analyticsData.deviceStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
