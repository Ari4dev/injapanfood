import React, { useState, useEffect } from 'react';
import { 
  approveBitKodeCommission, 
  rejectBitKodeCommission,
  bulkSyncBitKodeToOldSystem,
  getSyncStatus
} from '@/services/affiliateSyncService';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AffiliateOrder } from '@/services/shopeeAffiliateSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  Sync,
  DollarSign,
  Clock,
  User
} from 'lucide-react';

export const BitKodeCommissionManager = () => {
  const [orders, setOrders] = useState<AffiliateOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Load BitKode orders
  useEffect(() => {
    const ordersRef = collection(db, 'affiliateOrders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AffiliateOrder));
      setOrders(ordersData);
    });

    // Load sync status
    loadSyncStatus();

    return () => unsubscribe();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleApprove = async (orderId: string) => {
    setProcessingId(orderId);
    setMessage(null);
    
    try {
      await approveBitKodeCommission(orderId, 'admin');
      setMessage({ 
        type: 'success', 
        text: '✅ Commission approved and synced to payout system!' 
      });
      loadSyncStatus();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `❌ Error: ${error.message}` 
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: string, reason?: string) => {
    setProcessingId(orderId);
    setMessage(null);
    
    try {
      await rejectBitKodeCommission(orderId, 'admin', reason);
      setMessage({ 
        type: 'success', 
        text: '✅ Commission rejected successfully' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `❌ Error: ${error.message}` 
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkSync = async () => {
    setBulkSyncing(true);
    setMessage(null);
    
    try {
      const result = await bulkSyncBitKodeToOldSystem();
      setMessage({ 
        type: 'success', 
        text: `✅ Bulk sync completed! Synced: ${result.synced}, Skipped: ${result.skipped}, Failed: ${result.failed}` 
      });
      loadSyncStatus();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `❌ Bulk sync error: ${error.message}` 
      });
    } finally {
      setBulkSyncing(false);
    }
  };

  const getStatusBadge = (status: string, synced?: boolean) => {
    if (status === 'approved' && synced) {
      return <Badge className="bg-green-500">Approved & Synced</Badge>;
    }
    if (status === 'approved' && !synced) {
      return <Badge className="bg-yellow-500">Approved (Pending Sync)</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>;
    }
    if (status === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (status === 'paid') {
      return <Badge className="bg-blue-500">Paid</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sync className="w-5 h-5" />
              BitKode ↔️ Old System Sync Status
            </span>
            <Button 
              onClick={loadSyncStatus} 
              size="sm" 
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncStatus && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold">{syncStatus.totalBitKodeOrders}</div>
                <div className="text-xs text-gray-600">Total Orders</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{syncStatus.approvedOrders}</div>
                <div className="text-xs text-gray-600">Approved</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{syncStatus.syncedOrders}</div>
                <div className="text-xs text-gray-600">Synced</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">{syncStatus.unsyncedOrders}</div>
                <div className="text-xs text-gray-600">Pending Sync</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <Button 
                  onClick={handleBulkSync}
                  disabled={bulkSyncing || syncStatus.unsyncedOrders === 0}
                  className="w-full"
                  variant={syncStatus.unsyncedOrders > 0 ? "default" : "secondary"}
                >
                  {bulkSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Sync className="w-4 h-4 mr-1" />
                      Bulk Sync
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert className={
          message.type === 'success' ? 'border-green-500' : 
          message.type === 'error' ? 'border-red-500' : 
          'border-blue-500'
        }>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          <strong>How Real-time Sync Works:</strong>
          <ul className="text-sm mt-2 space-y-1">
            <li>• When you approve a BitKode commission, it automatically syncs to the old system</li>
            <li>• Synced commissions become available for payout requests</li>
            <li>• Use "Bulk Sync" to sync any missed commissions</li>
            <li>• Rejected commissions are not synced</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* BitKode Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>BitKode Commission Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Order ID</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Referral Code</th>
                  <th className="text-right p-2">Order Total</th>
                  <th className="text-right p-2">Commission</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-center p-2">Sync</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">
                      {order.orderId?.substring(0, 8)}...
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="text-xs">{order.userEmail?.split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{order.referralCode}</Badge>
                    </td>
                    <td className="p-2 text-right">
                      ¥{order.orderTotal?.toLocaleString()}
                    </td>
                    <td className="p-2 text-right font-medium">
                      ¥{order.commissionAmount?.toLocaleString()}
                    </td>
                    <td className="p-2 text-center">
                      {getStatusBadge(order.commissionStatus, order.syncedToOldSystem)}
                    </td>
                    <td className="p-2 text-center">
                      {order.syncedToOldSystem ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Synced
                        </Badge>
                      ) : order.commissionStatus === 'approved' ? (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="secondary">N/A</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1 justify-center">
                        {order.commissionStatus === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(order.id!)}
                              disabled={processingId === order.id}
                            >
                              {processingId === order.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(order.id!, 'Admin review')}
                              disabled={processingId === order.id}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {order.commissionStatus === 'approved' && !order.syncedToOldSystem && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(order.id!)}
                            disabled={processingId === order.id}
                          >
                            <Sync className="w-3 h-3 mr-1" />
                            Sync Now
                          </Button>
                        )}
                        {order.commissionStatus === 'approved' && order.syncedToOldSystem && (
                          <Badge className="bg-green-100 text-green-700">
                            ✅ Ready for Payout
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No BitKode orders found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BitKodeCommissionManager;
