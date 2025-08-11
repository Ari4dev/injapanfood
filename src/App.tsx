import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useFirebaseAuth';
import OfflineNotice from '@/components/OfflineNotice';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import Index from '@/pages/Index';
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Auth from '@/pages/Auth';
import Orders from '@/pages/Orders';
import Referral from '@/pages/Referral';
import HowToBuy from '@/pages/HowToBuy';
import NotFound from '@/pages/NotFound';
import BundlesPage from '@/pages/bundles/index';
import BundleDetailPage from '@/pages/bundles/BundleDetail';
import CategoryPage from '@/pages/CategoryPage';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsConditions from '@/pages/TermsConditions';
import Help from '@/pages/Help';
import Profile from '@/pages/Profile';
import MyAddresses from '@/pages/MyAddresses';
import AddressForm from '@/pages/AddressForm';

// Admin pages
import Admin from '@/pages/Admin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import EnhancedAdminDashboard from '@/pages/admin/EnhancedAdminDashboard';
import ProductsList from '@/pages/admin/ProductsList';
import CategoryManagement from '@/pages/admin/CategoryManagement';
import BannerManagement from '@/pages/admin/BannerManagement';
import AddProduct from '@/pages/admin/AddProduct';
import EditProduct from '@/pages/admin/EditProduct';
import OrdersHistory from '@/pages/admin/OrdersHistory';
import OrderConfirmation from '@/pages/admin/OrderConfirmation';
import PaymentVerification from '@/pages/admin/PaymentVerification';
import UserManagement from '@/pages/admin/UserManagement';
import AdminLogs from '@/pages/admin/AdminLogs';
import ImportExport from '@/pages/admin/ImportExport';
import RecycleBin from '@/pages/admin/RecycleBin';
import ShippingRates from '@/pages/admin/ShippingRates';
import AffiliateManagement from '@/pages/admin/AffiliateManagement';
import EnhancedAffiliateManagement from '@/pages/admin/EnhancedAffiliateManagement';
import BitKodeAffiliateManagement from '@/pages/admin/ShopeeAffiliateManagement';
import FinancialReports from '@/pages/admin/FinancialReports';
import CODSettings from '@/pages/admin/CODSettings';
import BundleManagement from '@/pages/admin/BundleManagement';
import { CouponManagement } from '@/pages/admin/CouponManagement';
import BankInformationManagement from '@/pages/admin/BankInformationManagement';

// User affiliate pages
import AffiliateDashboard from '@/pages/affiliate/AffiliateDashboard';

import './App.css';
import { useEffect, useState } from 'react';
import { processReferralCode } from '@/utils/referralUtils';
import { ShopeeAffiliateProvider } from '@/components/affiliate/ShopeeIntegrationExamples';

function App() {
  // Create query client instance inside the component to ensure it's created after hydration
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 3,
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: false, // Don't refetch when component mounts if data is fresh
        // Add a retry delay to prevent hammering the server
        retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
      },
      mutations: {
        retry: 1,
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: false, // Don't refetch when component mounts if data is fresh
        // Add a retry delay to prevent hammering the server
        retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
      },
    },
  }));

  // Process referral code when app loads
  useEffect(() => {
    processReferralCode();
  }, []);

  // Configure online status management
  useEffect(() => {
    // React Query's online manager
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    onlineManager.setEventListener(setOnline => {
      // Listen to online/offline events
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Clean up
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ShopeeAffiliateProvider>
          <Router>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/how-to-buy" element={<HowToBuy />} />
            
            {/* Bundle routes */}
            <Route path="/bundles" element={<BundlesPage />} />
            <Route path="/bundles/:id" element={<BundleDetailPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/kebijakan-privasi" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/syarat-ketentuan" element={<TermsConditions />} />
            <Route path="/help" element={<Help />} />
            <Route path="/bantuan" element={<Help />} />
            
            {/* Profile and Address routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-addresses" element={<MyAddresses />} />
            <Route path="/add-address" element={<AddressForm />} />
            <Route path="/edit-address/:id" element={<AddressForm />} />
            
            {/* Affiliate route for users */}
            <Route path="/affiliate" element={<AffiliateDashboard />} />
            
            {/* Category routes */}
            <Route path="/kategori/:categorySlug" element={<CategoryPage />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/enhanced" element={<EnhancedAdminDashboard />} />
            <Route path="/admin/products" element={<ProductsList />} />
            <Route path="/admin/categories" element={<CategoryManagement />} />
            <Route path="/admin/banners" element={<BannerManagement />} />
            <Route path="/admin/add-product" element={<AddProduct />} />
            <Route path="/admin/edit-product/:id" element={<EditProduct />} />
            <Route path="/admin/products/edit/:id" element={<EditProduct />} />
            <Route path="/admin/orders-history" element={<OrdersHistory />} />
            <Route path="/admin/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/admin/payment-verification" element={<PaymentVerification />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/import-export" element={<ImportExport />} />
            <Route path="/admin/recycle-bin" element={<RecycleBin />} />
            <Route path="/admin/shipping-rates" element={<ShippingRates />} />
            <Route path="/admin/affiliate" element={<AffiliateManagement />} />
            <Route path="/admin/affiliate-enhanced" element={<EnhancedAffiliateManagement />} />
            <Route path="/admin/bitkode-affiliate-management" element={<BitKodeAffiliateManagement />} />
            <Route path="/admin/financial-reports" element={<FinancialReports />} />
            <Route path="/admin/cod-settings" element={<CODSettings />} />
            <Route path="/admin/bundle-management" element={<BundleManagement />} />
            <Route path="/admin/bundle-management/:id" element={<BundleManagement />} />
            <Route path="/admin/coupons" element={<CouponManagement />} />
            <Route path="/admin/bank-information" element={<BankInformationManagement />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <OfflineNotice />
          <PWAInstallPrompt />
          </Router>
        </ShopeeAffiliateProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;