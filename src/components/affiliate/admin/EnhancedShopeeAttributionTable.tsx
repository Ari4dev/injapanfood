import { useState } from 'react';
import { useEnhancedAffiliateAdmin } from '@/hooks/useEnhancedAffiliateAdmin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Target, RefreshCw, Eye, Clock } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AffiliateAttribution } from '@/services/shopeeAffiliateSystem';

const EnhancedShopeeAttributionTable = () => {
  const { attributions, loading, selectedMonth, setSelectedMonth, availableMonths } = useEnhancedAffiliateAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttribution, setSelectedAttribution] = useState<AffiliateAttribution | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAttributions = attributions.filter(attribution => {
    const matchesSearch = (
      attribution.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attribution.visitorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attribution.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || ''
    );

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && attribution.isActive) ||
      (statusFilter === 'inactive' && !attribution.isActive) ||
      (statusFilter === 'bound' && attribution.userId) ||
      (statusFilter === 'unbound' && !attribution.userId);

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const getStatusBadge = (attribution: AffiliateAttribution) => {
    const now = new Date();
    const expiresAt = new Date(attribution.attributionWindow);
    const isExpired = now > expiresAt;

    if (!attribution.isActive || isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (attribution.userId) {
      return <Badge className="bg-green-600">Bound</Badge>;
    }

    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>;
  };

  const getRemainingTime = (attributionWindow: string) => {
    const now = new Date();
    const expires = new Date(attributionWindow);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            BitKode-Style Attribution Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-40 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="flex items-center">
            <div className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              <span>BitKode Attribution Tracking ({attributions.length})</span>
              <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
                1-Day Window
              </Badge>
            </div>
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Expired</SelectItem>
                <SelectItem value="bound">Bound</SelectItem>
                <SelectItem value="unbound">Unbound</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {formatMonth(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari attribution..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {attributions.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada attribution data</h3>
            <p className="text-gray-500 text-sm mb-4">
              Data akan muncul setelah ada user yang mengklik referral link
            </p>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Visitor ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User Bound</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttributions.map((attribution) => (
                  <TableRow key={attribution.id}>
                    <TableCell>
                      <code className="bg-purple-100 px-2 py-1 rounded text-xs text-purple-800">
                        {attribution.referralCode}
                      </code>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {attribution.visitorId.substring(0, 12)}...
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(attribution)}
                    </TableCell>
                    <TableCell>
                      {attribution.userEmail ? (
                        <div className="text-sm">
                          <div className="font-medium">{attribution.userEmail}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(attribution.boundAt || '')}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Unbound
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-sm font-medium">{attribution.totalOrders}</div>
                        <div className="text-xs text-gray-500">orders</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold">
                        ¥{attribution.totalCommission.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        GMV: ¥{attribution.totalGMV.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                        {getRemainingTime(attribution.attributionWindow)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(attribution.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedAttribution(attribution)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Detail
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Attribution Detail</DialogTitle>
                          </DialogHeader>
                          {selectedAttribution && (
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Referral Code</h4>
                                  <p className="font-mono">{selectedAttribution.referralCode}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                                  <div className="mt-1">{getStatusBadge(selectedAttribution)}</div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Visitor ID</h4>
                                  <p className="font-mono text-xs">{selectedAttribution.visitorId}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Session ID</h4>
                                  <p className="font-mono text-xs">{selectedAttribution.sessionId}</p>
                                </div>
                              </div>
                              
                              {selectedAttribution.userEmail && (
                                <div className="border-t pt-4">
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">User Information</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h5 className="text-xs text-gray-400">Email</h5>
                                      <p>{selectedAttribution.userEmail}</p>
                                    </div>
                                    <div>
                                      <h5 className="text-xs text-gray-400">Bound At</h5>
                                      <p>{formatDate(selectedAttribution.boundAt || '')}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Attribution Timeline</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="text-xs text-gray-400">First Click</h5>
                                    <p className="text-sm">{formatDate(selectedAttribution.firstClick)}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-xs text-gray-400">Last Click</h5>
                                    <p className="text-sm">{formatDate(selectedAttribution.lastClick)}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-xs text-gray-400">Attribution Window</h5>
                                    <p className="text-sm">{formatDate(selectedAttribution.attributionWindow)}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-xs text-gray-400">Remaining Time</h5>
                                    <p className="text-sm">{getRemainingTime(selectedAttribution.attributionWindow)}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Performance</h4>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="text-center">
                                    <div className="text-lg font-bold">{selectedAttribution.totalOrders}</div>
                                    <div className="text-xs text-gray-500">Orders</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold">¥{selectedAttribution.totalGMV.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">Total GMV</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold">¥{selectedAttribution.totalCommission.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">Commission</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedShopeeAttributionTable;
