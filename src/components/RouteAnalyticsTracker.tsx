import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/utils/analyticsCollector';

const RouteAnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Track page view setiap kali route berubah
    const pagePath = location.pathname + location.search;
    const pageTitle = getPageTitle(location.pathname);
    
    trackPageView(pagePath, pageTitle);
    
    // Update document title
    document.title = pageTitle;
  }, [location, trackPageView]);

  return null; // Komponen ini tidak render apa-apa
};

// Helper function untuk mendapatkan title berdasarkan path
const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/': 'InJapanFood - Home',
    '/products': 'Products - InJapanFood',
    '/cart': 'Shopping Cart - InJapanFood',
    '/auth': 'Login/Register - InJapanFood',
    '/orders': 'My Orders - InJapanFood',
    '/bundles': 'Bundles - InJapanFood',
    '/referral': 'Referral Program - InJapanFood',
    '/how-to-buy': 'How to Buy - InJapanFood',
    '/profile': 'My Profile - InJapanFood',
    '/my-addresses': 'My Addresses - InJapanFood',
    '/admin': 'Admin Panel - InJapanFood',
    '/admin/dashboard': 'Admin Dashboard - InJapanFood',
    '/admin/products': 'Product Management - InJapanFood',
    '/admin/orders-history': 'Orders History - InJapanFood',
    '/admin/traffic-analytics': 'Traffic Analytics - InJapanFood',
    '/admin/coupons': 'Coupon Management - InJapanFood',
  };

  // Check for dynamic routes
  if (pathname.startsWith('/products/')) {
    return 'Product Detail - InJapanFood';
  }
  if (pathname.startsWith('/bundles/')) {
    return 'Bundle Detail - InJapanFood';
  }
  if (pathname.startsWith('/kategori/')) {
    return 'Category - InJapanFood';
  }
  if (pathname.startsWith('/admin/')) {
    return 'Admin Panel - InJapanFood';
  }

  return routes[pathname] || 'InJapanFood';
};

export default RouteAnalyticsTracker;
