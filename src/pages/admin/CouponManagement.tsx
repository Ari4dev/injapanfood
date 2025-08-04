import React, { useState } from 'react';
import { useCoupons } from '@/hooks/useCoupons';
import { Coupon, CouponUsage } from '@/types/coupon';
import { LoadingOverlay, Spinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CouponForm } from './CouponForm';
import { couponService } from '@/services/couponService';

export const CouponManagement: React.FC = () => {
  const {
    coupons,
    isLoadingCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
  } = useCoupons();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [couponHistory, setCouponHistory] = useState<CouponUsage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleCreate = (coupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>) => {
    createCoupon({ couponData: coupon, userId: 'admin' });
    setDialogOpen(false);
    setEditingCoupon(null);
  };

  const handleViewHistory = async (coupon: Coupon) => {
    setLoadingHistory(true);
    setHistoryDialogOpen(true);
    try {
      const history = await couponService.getCouponUsageHistory(coupon.id);
      setCouponHistory(history);
    } catch (error) {
      console.error('Error fetching coupon history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setDialogOpen(true);
  };

  const handleUpdate = (coupon: Coupon) => {
    updateCoupon(coupon);
    setDialogOpen(false);
    setEditingCoupon(null);
  };

  const handleAddNew = () => {
    setEditingCoupon(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      deleteCoupon(id);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Coupon Management</h1>
      <LoadingOverlay isLoading={isLoadingCoupons}>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 text-left">Code</th>
              <th className="py-2 text-left">Name</th>
              <th className="py-2 text-left">Type</th>
              <th className="py-2 text-left">Value</th>
              <th className="py-2 text-left">Expires</th>
              <th className="py-2 text-left">Used Count</th>
              <th className="py-2 text-left">Status</th>
              <th className="py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="py-2">{coupon.code}</td>
                <td className="py-2">{coupon.name}</td>
                <td className="py-2">{coupon.type === 'percentage' ? '%' : '¥'}</td>
                <td className="py-2">{coupon.value}</td>
                <td className="py-2">{coupon.validUntil.toLocaleDateString()}</td>
                <td className="py-2">{coupon.usedCount || 0}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    coupon.isActive && new Date() <= coupon.validUntil
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {coupon.isActive && new Date() <= coupon.validUntil ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2">
                  <Button onClick={() => handleEdit(coupon)} className="mr-2" size="sm">Edit</Button>
                  <Button onClick={() => handleDelete(coupon.id)} variant="destructive" className="mr-2" size="sm">Delete</Button>
                  <Button onClick={() => handleViewHistory(coupon)} size="sm">History</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button onClick={handleAddNew} className="mt-4">Add Coupon</Button>
      </LoadingOverlay>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <CouponForm
            coupon={editingCoupon}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
          />
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Coupon Usage History</DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {couponHistory.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No usage history found</p>
              ) : (
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 text-left">User ID</th>
                      <th className="py-2 text-left">Order ID</th>
                      <th className="py-2 text-left">Discount Amount</th>
                      <th className="py-2 text-left">Used At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponHistory.map((usage) => (
                      <tr key={usage.id}>
                        <td className="py-2">{usage.userId}</td>
                        <td className="py-2">{usage.orderId}</td>
                        <td className="py-2">¥{usage.discountAmount}</td>
                        <td className="py-2">{new Date(usage.usedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

