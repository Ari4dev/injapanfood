import React, { useState } from 'react';
import { Coupon } from '@/types/coupon';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CouponFormProps {
  coupon?: Coupon | null;
  onCreate?: (coupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (coupon: Coupon) => void;
}

export const CouponForm: React.FC<CouponFormProps> = ({ coupon, onCreate, onUpdate }) => {
  const [formState, setFormState] = useState<Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>>({
    code: coupon?.code || '',
    name: coupon?.name || '',
    type: coupon?.type || 'percentage',
    value: coupon?.value || 0,
    description: coupon?.description || '',
    minOrderAmount: coupon?.minOrderAmount,
    maxDiscountAmount: coupon?.maxDiscountAmount,
    usageLimit: coupon?.usageLimit,
    userUsageLimit: coupon?.userUsageLimit,
    validFrom: coupon?.validFrom || new Date(),
    validUntil: coupon?.validUntil || new Date(),
    isActive: coupon?.isActive || true,
    applicableProducts: coupon?.applicableProducts || [],
    applicableCategories: coupon?.applicableCategories || []
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormState({
        ...formState,
        [name]: checkbox.checked
      });
    } else if (name === 'validFrom' || name === 'validUntil') {
      setFormState({
        ...formState,
        [name]: new Date(value)
      });
    } else if (name === 'value' || name === 'minOrderAmount' || name === 'maxDiscountAmount' || name === 'usageLimit' || name === 'userUsageLimit') {
      setFormState({
        ...formState,
        [name]: value ? parseFloat(value) : undefined
      });
    } else {
      setFormState({
        ...formState,
        [name]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon) {
      onUpdate && onUpdate({ ...formState, id: coupon.id, createdAt: coupon.createdAt, updatedAt: new Date() });
    } else {
      onCreate && onCreate(formState);
    }
  };

  return (
    <div className="w-full">
      <DialogHeader className="mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
        <DialogTitle className="text-xl font-semibold text-gray-800">
          {coupon ? 'Edit Kupon' : 'Tambah Kupon Baru'}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information Section */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="text-base font-medium text-gray-700 mb-3">Informasi Dasar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Kode Kupon *
              </label>
              <input 
                type="text" 
                name="code" 
                id="code"
                value={formState.code} 
                onChange={handleChange} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: DISKON20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nama Kupon *
              </label>
              <input 
                type="text" 
                name="name" 
                id="name"
                value={formState.name} 
                onChange={handleChange} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: Diskon Spesial 20%"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipe Diskon *
              </label>
              <select 
                name="type" 
                id="type"
                value={formState.type} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed_amount">Jumlah Tetap (¥)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                Nilai Diskon *
              </label>
              <input 
                type="number" 
                name="value" 
                id="value"
                value={formState.value} 
                onChange={handleChange} 
                required 
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={formState.type === 'percentage' ? '20' : '1000'}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea 
              name="description" 
              id="description"
              value={formState.description || ''} 
              onChange={handleChange} 
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Deskripsi kupon (opsional)"
            />
          </div>
        </div>
        
        {/* Validity Period Section */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="text-base font-medium text-gray-700 mb-3">Periode Berlaku</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700">
                Berlaku Dari *
              </label>
              <input 
                type="date" 
                name="validFrom" 
                id="validFrom"
                value={formState.validFrom.toISOString().split('T')[0]} 
                onChange={handleChange} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
                Berlaku Sampai *
              </label>
              <input 
                type="date" 
                name="validUntil" 
                id="validUntil"
                value={formState.validUntil.toISOString().split('T')[0]} 
                onChange={handleChange} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        {/* Usage Limits Section */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="text-base font-medium text-gray-700 mb-3">Batasan Penggunaan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700">
                Batas Total Penggunaan
              </label>
              <input 
                type="number" 
                name="usageLimit" 
                id="usageLimit"
                value={formState.usageLimit || ''} 
                onChange={handleChange} 
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Kosongkan untuk tidak terbatas"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="userUsageLimit" className="block text-sm font-medium text-gray-700">
                Batas Penggunaan per User
              </label>
              <input 
                type="number" 
                name="userUsageLimit" 
                id="userUsageLimit"
                value={formState.userUsageLimit || ''} 
                onChange={handleChange} 
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Kosongkan untuk tidak terbatas"
              />
            </div>
          </div>
        </div>
        
        {/* Order Conditions Section */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="text-base font-medium text-gray-700 mb-3">Syarat Pemesanan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="minOrderAmount" className="block text-sm font-medium text-gray-700">
                Minimum Pemesanan (¥)
              </label>
              <input 
                type="number" 
                name="minOrderAmount" 
                id="minOrderAmount"
                value={formState.minOrderAmount || ''} 
                onChange={handleChange} 
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: 5000"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="maxDiscountAmount" className="block text-sm font-medium text-gray-700">
                Maksimum Diskon (¥)
              </label>
              <input 
                type="number" 
                name="maxDiscountAmount" 
                id="maxDiscountAmount"
                value={formState.maxDiscountAmount || ''} 
                onChange={handleChange} 
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Untuk kupon persentase"
              />
            </div>
          </div>
        </div>
        
        {/* Status Section */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="text-base font-medium text-gray-700 mb-3">Status</h3>
          <div className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              name="isActive" 
              id="isActive"
              checked={formState.isActive} 
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Kupon Aktif
            </label>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white z-10">
          <Button 
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {coupon ? 'Perbarui' : 'Buat'} Kupon
          </Button>
        </div>
      </form>
    </div>
  );
};

