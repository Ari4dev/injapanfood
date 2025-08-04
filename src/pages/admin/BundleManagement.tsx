import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, Package, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { BundleManagementService } from '@/services/admin/bundleManagementService';
import { BundleWithItems } from '@/types/bundle';
import CreateBundleModal from '@/components/admin/CreateBundleModal';
import EditBundleModal from '@/components/admin/EditBundleModal';

const BundleManagement: React.FC = () => {
  const [bundles, setBundles] = useState<BundleWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBundle, setSelectedBundle] = useState<BundleWithItems | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    try {
      setLoading(true);
      const bundleData = await BundleManagementService.getAllBundles();
      setBundles(bundleData);
    } catch (error) {
      console.error('Error loading bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBundle = async (bundleId: string) => {
    try {
      await BundleManagementService.deleteBundle(bundleId);
      await loadBundles();
      setShowDeleteModal(false);
      setSelectedBundle(null);
    } catch (error) {
      console.error('Error deleting bundle:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('id-ID');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manajemen Bundle - Admin</title>
        <meta name="description" content="Kelola bundle produk" />
      </Helmet>

      <AdminLayout>
        <div className="p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manajemen Bundle</h1>
              <p className="text-gray-600">Kelola paket bundle produk</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bundle</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bundle</p>
                  <p className="text-2xl font-bold text-gray-900">{bundles.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bundle Aktif</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bundles.filter(b => b.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bundle Nonaktif</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bundles.filter(b => b.status === 'inactive').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bundles.reduce((total, bundle) => total + (bundle.items?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bundle Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bundle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Periode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bundles.map((bundle) => (
                    <tr key={bundle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={bundle.image_url || '/placeholder.svg'}
                              alt={bundle.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {bundle.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {bundle.description?.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bundle.bundle_type === 'fixed' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {bundle.bundle_type === 'fixed' ? 'Paket Tetap' : 'Mix & Match'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-semibold">{formatPrice(bundle.bundle_price)}</div>
                          <div className="text-gray-500 line-through text-xs">
                            {formatPrice(bundle.original_price)}
                          </div>
                          <div className="text-green-600 text-xs">
                            Hemat {formatPrice(bundle.savings || 0)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bundle.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bundle.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bundle.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatDate(bundle.start_date)} -</div>
                        <div>{formatDate(bundle.end_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBundle(bundle);
                              setShowViewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBundle(bundle);
                              setShowEditModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Bundle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBundle(bundle);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Hapus Bundle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {bundles.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada bundle</h3>
              <p className="mt-1 text-sm text-gray-500">
                Mulai dengan membuat bundle produk pertama Anda.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Bundle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Bundle Modal */}
        {showCreateModal && (
          <CreateBundleModal
            onClose={() => setShowCreateModal(false)}
            onBundleCreated={() => {
              loadBundles();
              setShowCreateModal(false);
            }}
          />
        )}

        {/* Edit Bundle Modal */}
        {showEditModal && selectedBundle && (
          <EditBundleModal
            bundle={selectedBundle}
            onClose={() => {
              setShowEditModal(false);
              setSelectedBundle(null);
            }}
            onBundleUpdated={() => {
              loadBundles();
              setShowEditModal(false);
              setSelectedBundle(null);
            }}
          />
        )}

        {/* View Bundle Modal */}
        {showViewModal && selectedBundle && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Detail Bundle: {selectedBundle.name}</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedBundle(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>ID:</strong> {selectedBundle.id}
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      selectedBundle.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedBundle.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <strong>Deskripsi:</strong>
                  <p className="mt-1 text-gray-600">{selectedBundle.description}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <strong>Harga Bundle:</strong>
                    <p className="text-lg font-semibold text-green-600">
                      {formatPrice(selectedBundle.bundle_price)}
                    </p>
                  </div>
                  <div>
                    <strong>Harga Asli:</strong>
                    <p className="text-gray-500 line-through">
                      {formatPrice(selectedBundle.original_price)}
                    </p>
                  </div>
                  <div>
                    <strong>Hemat:</strong>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatPrice(selectedBundle.savings || 0)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <strong>Produk dalam Bundle ({selectedBundle.items?.length || 0} items):</strong>
                  <div className="mt-2 space-y-2">
                    {selectedBundle.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                        <img
                          src={item.product?.image_url || '/placeholder.svg'}
                          alt={item.product?.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.product?.price || 0)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">Tidak ada produk</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Tanggal Mulai:</strong>
                    <p>{formatDate(selectedBundle.start_date)}</p>
                  </div>
                  <div>
                    <strong>Tanggal Berakhir:</strong>
                    <p>{formatDate(selectedBundle.end_date)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedBundle(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedBundle && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">Hapus Bundle</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Apakah Anda yakin ingin menghapus bundle "{selectedBundle.name}"? 
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={() => handleDeleteBundle(selectedBundle.id)}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-700"
                  >
                    Hapus
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedBundle(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-24 hover:bg-gray-400"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
};

export default BundleManagement;
