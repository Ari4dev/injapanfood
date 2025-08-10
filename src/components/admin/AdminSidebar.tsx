import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package,
  Tags,
  Image,
  ShoppingCart, 
  Users, 
  CheckCircle,
  Upload,
  Trash2,
  Truck,
  CreditCard,
  Percent,
  DollarSign,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { getCategoryTranslation } from '@/utils/categoryVariants';

const AdminSidebar = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: t('admin.orderConfirmation', 'Konfirmasi Pesanan'),
      href: '/admin/order-confirmation',
      icon: CheckCircle,
      description: t('admin.pendingOrders', 'Pending orders')
    },
    {
      title: t('admin.paymentVerification', 'Verifikasi Pembayaran'),
      href: '/admin/payment-verification',
      icon: CreditCard,
      description: t('admin.paymentVerificationDesc', 'Payment verification')
    },
    {
      title: t('admin.products', 'Produk'),
      href: '/admin/products',
      icon: Package,
    },
    {
      title: t('admin.addProduct', 'Tambah Produk'),
      href: '/admin/add-product',
      icon: Package,
    },
    {
      title: t('admin.categoryManagement', 'Manajemen Kategori'),
      href: '/admin/categories',
      icon: Tags,
      description: t('admin.manageCategoryDesc', 'Kelola kategori produk')
    },
    {
      title: t('admin.bannerManagement', 'Manajemen Banner'),
      href: '/admin/banners',
      icon: Image,
      description: t('admin.manageBannerDesc', 'Kelola banner beranda')
    },
    {
      title: t('admin.bundleManagement', 'Manajemen Bundle'),
      href: '/admin/bundle-management',
      icon: ShoppingBag,
      description: t('admin.manageBundleDesc', 'Kelola paket bundle')
    },
    {
      title: t('profile.orderHistory', 'Riwayat Pesanan'),
      href: '/admin/orders-history',
      icon: ShoppingCart,
    },
    {
      title: t('admin.userManagement', 'Manajemen User'),
      href: '/admin/users',
      icon: Users,
    },
    {
      title: t('admin.shippingSettings', 'Pengaturan Ongkir'),
      href: '/admin/shipping-rates',
      icon: Truck,
    },
    {
      title: t('admin.codSettings', 'Pengaturan COD'),
      href: '/admin/cod-settings',
      icon: CreditCard,
      description: t('admin.codFeeDesc', 'Biaya tambahan COD')
    },
    {
      title: 'BitKode Affiliate',
      href: '/admin/affiliate-enhanced',
      icon: Percent,
      description: 'BitKode Affiliate System'
    },
    {
      title: t('admin.financialReports', 'Laporan Keuangan'),
      href: '/admin/financial-reports',
      icon: DollarSign,
      description: t('admin.financialReportsDesc', 'Financial reports')
    },
    {
      title: t('admin.couponManagement', 'Manajemen Kupon'),
      href: '/admin/coupons',
      icon: Percent,
      description: t('admin.manageCouponDesc', 'Kelola kupon & promo')
    },
    {
      title: 'Import/Export',
      href: '/admin/import-export',
      icon: Upload,
    },
    {
      title: 'Recycle Bin',
      href: '/admin/recycle-bin',
      icon: Trash2,
    }
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen overflow-y-auto">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Injapan Food Logo" 
              className="w-full h-full object-contain bg-white p-1"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('profile.adminPanel', 'Admin Panel')}</h1>
            <p className="text-sm text-gray-600">Injapan Food</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-red-50 text-red-700 border-r-2 border-red-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.title}</span>
                  {item.description && (
                    <span className="text-xs text-gray-500 ml-auto">
                      {item.description}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;