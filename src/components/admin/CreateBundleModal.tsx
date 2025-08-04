import React, { useState, useEffect } from 'react';
import { BundleManagementService, CreateBundleData, BundleItem } from '@/services/admin/bundleManagementService';
import { getAllProducts, uploadProductImages } from '@/services/productService';
import { Product } from '@/types';
import { Plus, Trash2, Upload, X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onBundleCreated: () => void;
}

const CreateBundleModal: React.FC<Props> = ({ onClose, onBundleCreated }) => {
  const [bundleData, setBundleData] = useState<CreateBundleData>({
    name: '',
    description: '',
    bundle_type: 'fixed',
    bundle_price: 0,
    original_price: 0,
    savings: 0,
    status: 'active',
    priority: 1,
    min_items: 1,
    max_items: 1,
    start_date: new Date(),
    end_date: new Date(),
    image_url: '',
  });
  
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const products = await getAllProducts();
      setAvailableProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setBundleData({ ...bundleData, [name]: value });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(value);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(['File harus berupa gambar']);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(['Ukuran file tidak boleh lebih dari 5MB']);
      return;
    }

    try {
      setUploadingImage(true);
      setErrors([]);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const imageUrls = await uploadProductImages([file]);
      if (imageUrls.length > 0) {
        setBundleData(prev => ({ ...prev, image_url: imageUrls[0] }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors(['Gagal mengupload gambar']);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setBundleData(prev => ({ ...prev, image_url: '' }));
    setImagePreview(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const addProductToBundle = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;

    const bundleItem: Omit<BundleItem, 'id' | 'bundle_id'> = {
      product_id: productId,
      quantity: 1,
      is_required: true,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        image_url: product.image_url,
        description: product.description,
      }
    };

    setSelectedProducts([...selectedProducts, bundleItem as BundleItem]);
  };

  const removeProductFromBundle = (index: number) => {
    const newSelectedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newSelectedProducts);
  };

  const updateProductQuantity = (index: number, quantity: number) => {
    const newSelectedProducts = [...selectedProducts];
    newSelectedProducts[index].quantity = quantity;
    setSelectedProducts(newSelectedProducts);
  };

  const calculateOriginalPrice = () => {
    return selectedProducts.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      const validationErrors = BundleManagementService.validateBundleData(bundleData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (selectedProducts.length === 0) {
        setErrors(['Minimal harus memilih 1 produk untuk bundle']);
        return;
      }

      // Calculate savings
      bundleData.savings = BundleManagementService.calculateSavings(bundleData.original_price, bundleData.bundle_price);
      
      // Create bundle
      const bundleId = await BundleManagementService.createBundle(bundleData);
      
      // Add products to bundle
      for (const product of selectedProducts) {
        await BundleManagementService.addProductToBundle(bundleId, {
          ...product,
          id: `${bundleId}-${product.product_id}`,
          bundle_id: bundleId,
        });
      }
      
      onBundleCreated();
      onClose();
    } catch (error) {
      console.error('Error creating bundle:', error);
      setErrors(['Terjadi kesalahan saat membuat bundle']);
    }
  };

  // Auto-calculate original price and set image when products change
  useEffect(() => {
    const originalPrice = calculateOriginalPrice();
    setBundleData(prev => {
      // Only auto-set image if no manual image is uploaded and no URL is set
      const shouldAutoSetImage = !prev.image_url && !imagePreview;
      const imageUrl = shouldAutoSetImage && selectedProducts.length > 0 
        ? selectedProducts[0].product.image_url 
        : prev.image_url;
      
      return { 
        ...prev, 
        original_price: originalPrice,
        image_url: imageUrl || '/placeholder.svg'
      };
    });
  }, [selectedProducts, imagePreview]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <h2 className="text-2xl font-bold mb-4">Tambah Bundle Baru</h2>
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700">Nama Bundle</span>
            <input
              type="text"
              name="name"
              value={bundleData.name}
              onChange={handleInputChange}
              placeholder="Nama Bundle"
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Deskripsi Bundle</span>
            <textarea
              name="description"
              value={bundleData.description}
              onChange={handleInputChange}
              placeholder="Deskripsi Bundle"
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Harga Bundle</span>
            <input
              type="number"
              name="bundle_price"
              value={bundleData.bundle_price}
              onChange={handleInputChange}
              placeholder="Harga Bundle"
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Harga Asli</span>
            <input
              type="number"
              name="original_price"
              value={bundleData.original_price}
              onChange={handleInputChange}
              placeholder="Harga Asli"
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Prioritas</span>
            <input
              type="number"
              name="priority"
              value={bundleData.priority}
              onChange={handleInputChange}
              placeholder="Prioritas"
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Minimal Items</span>
            <input
              type="number"
              name="min_items"
              value={bundleData.min_items}
              onChange={handleInputChange}
              placeholder="Minimal Items"
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Maksimal Items</span>
            <input
              type="number"
              name="max_items"
              value={bundleData.max_items}
              onChange={handleInputChange}
              placeholder="Maksimal Items"
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-gray-700">Tanggal Mulai</span>
              <input
                type="date"
                name="start_date"
                value={bundleData.start_date instanceof Date ? bundleData.start_date.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setBundleData({ ...bundleData, start_date: new Date(e.target.value) });
                }}
                className="w-full mt-1 p-2 border rounded"
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Tanggal Berakhir</span>
              <input
                type="date"
                name="end_date"
                value={bundleData.end_date instanceof Date ? bundleData.end_date.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setBundleData({ ...bundleData, end_date: new Date(e.target.value) });
                }}
                className="w-full mt-1 p-2 border rounded"
              />
            </label>
          </div>
          
          <label className="block">
            <span className="text-gray-700">Tipe Bundle</span>
            <select
              name="bundle_type"
              value={bundleData.bundle_type}
              onChange={handleInputChange}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="fixed">Paket Tetap</option>
              <option value="mix_and_match">Mix & Match</option>
            </select>
          </label>
          
          <label className="block">
            <span className="text-gray-700">Status</span>
            <select
              name="status"
              value={bundleData.status}
              onChange={handleInputChange}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
          
          <div className="block">
            <span className="text-gray-700 block mb-2">Gambar Bundle (Opsional)</span>
            
            {/* Image Preview */}
            {(imagePreview || bundleData.image_url) && (
              <div className="mb-4 relative inline-block">
                <img
                  src={imagePreview || bundleData.image_url}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Upload Button */}
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border transition-colors">
                <Upload className="w-4 h-4" />
                <span>{uploadingImage ? 'Mengupload...' : 'Upload Gambar'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
              
              {uploadingImage && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Upload gambar langsung. Kosongkan untuk menggunakan gambar produk pertama secara otomatis. Format: JPG, PNG. Maksimal 5MB.
            </p>
          </div>
          <div className="block">
            <span className="text-gray-700 block mb-2">Pilih Produk untuk Bundle</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addProductToBundle(e.target.value);
                  e.target.value = ''; // Reset selection
                }
              }}
              className="w-full p-2 border rounded mb-4"
              disabled={loading}
            >
              <option value="">Pilih produk...</option>
              {availableProducts
                .filter(product => !selectedProducts.some(sp => sp.product_id === product.id))
                .map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ¥{product.price.toLocaleString()}
                  </option>
                ))
              }
            </select>
            
            {/* Selected Products List */}
            {selectedProducts.length > 0 && (
              <div className="border rounded p-3 bg-gray-50">
                <h4 className="text-sm font-semibold mb-2">Produk Terpilih:</h4>
                <div className="space-y-2">
                  {selectedProducts.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.product.image_url || '/placeholder.svg'}
                          alt={item.product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div>
                          <p className="text-sm font-medium">{item.product.name}</p>
                          <p className="text-xs text-gray-500">¥{item.product.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-16 p-1 border rounded text-center"
                        />
                        <button
                          type="button"
                          onClick={() => removeProductFromBundle(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    Total Harga Asli: ¥{calculateOriginalPrice().toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end mt-4 space-x-2">
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBundleModal;

