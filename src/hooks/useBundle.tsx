import { useState, useEffect } from 'react';
import { BundleService } from '@/services/bundleService';
import {
  Bundle,
  BundleWithItems,
  BundleRecommendation,
  CreateBundleData,
  UpdateBundleData,
  BundleAnalytics
} from '@/types/bundle';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useToast } from '@/hooks/use-toast';

export const useBundle = () => {
  const [bundles, setBundles] = useState<BundleWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all active bundles
  const fetchActiveBundles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await BundleService.getActiveBundles();
      setBundles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bundles';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch bundle by ID
  const fetchBundleById = async (bundleId: string): Promise<BundleWithItems | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await BundleService.getBundleById(bundleId);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bundle';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create new bundle
  const createBundle = async (bundleData: CreateBundleData): Promise<Bundle | null> => {
    setLoading(true);
    setError(null);
    try {
      const newBundle = await BundleService.createBundle(bundleData);
      toast({
        title: 'Success',
        description: 'Bundle created successfully!',
      });
      // Refresh bundles list
      await fetchActiveBundles();
      return newBundle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bundle';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update bundle
  const updateBundle = async (bundleData: UpdateBundleData): Promise<Bundle | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedBundle = await BundleService.updateBundle(bundleData);
      toast({
        title: 'Success',
        description: 'Bundle updated successfully!',
      });
      // Refresh bundles list
      await fetchActiveBundles();
      return updatedBundle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update bundle';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete bundle
  const deleteBundle = async (bundleId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await BundleService.deleteBundle(bundleId);
      toast({
        title: 'Success',
        description: 'Bundle deleted successfully!',
      });
      // Refresh bundles list
      await fetchActiveBundles();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bundle';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get bundle recommendations
  const getBundleRecommendations = async (limit = 5): Promise<BundleRecommendation[]> => {
    try {
      const userId = user?.uid;
      return await BundleService.getBundleRecommendations(userId, limit);
    } catch (err) {
      console.error('Error getting bundle recommendations:', err);
      return [];
    }
  };

  // Track bundle view
  const trackBundleView = async (bundleId: string) => {
    try {
      await BundleService.trackBundleView(bundleId);
    } catch (err) {
      console.warn('Error tracking bundle view:', err);
    }
  };

  // Track bundle purchase
  const trackBundlePurchase = async (bundleId: string, revenue: number) => {
    try {
      await BundleService.trackBundlePurchase(bundleId, revenue);
      
      if (user?.uid) {
        await BundleService.markBundlePurchased(user.uid, bundleId);
      }
    } catch (err) {
      console.warn('Error tracking bundle purchase:', err);
    }
  };

  // Save bundle preference
  const saveBundlePreference = async (bundleId: string, score: number) => {
    try {
      if (user?.uid) {
        await BundleService.saveBundlePreference(user.uid, bundleId, score);
      }
    } catch (err) {
      console.warn('Error saving bundle preference:', err);
    }
  };

  // Get bundles by category
  const getBundlesByCategory = async (category: string): Promise<BundleWithItems[]> => {
    try {
      return await BundleService.getBundlesByCategory(category);
    } catch (err) {
      console.error('Error getting bundles by category:', err);
      return [];
    }
  };

  // Load bundles on mount
  useEffect(() => {
    fetchActiveBundles();
  }, []);

  return {
    bundles,
    loading,
    error,
    fetchActiveBundles,
    fetchBundleById,
    createBundle,
    updateBundle,
    deleteBundle,
    getBundleRecommendations,
    trackBundleView,
    trackBundlePurchase,
    saveBundlePreference,
    getBundlesByCategory,
  };
};

// Hook for bundle analytics (admin only)
export const useBundleAnalytics = () => {
  const [analytics, setAnalytics] = useState<BundleAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBundleAnalytics = async (
    bundleId: string,
    startDate?: string,
    endDate?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await BundleService.getBundleAnalytics(bundleId, startDate, endDate);
      setAnalytics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    analytics,
    loading,
    error,
    fetchBundleAnalytics,
  };
};

// Hook for bundle configuration and cart integration
export const useBundleCart = () => {
  const [selectedBundles, setSelectedBundles] = useState<any[]>([]);

  const addBundleToCart = (bundle: BundleWithItems, selectedItems: any[]) => {
    const bundleConfiguration = {
      type: 'bundle',
      bundle_id: bundle.id,
      bundle_name: bundle.name,
      bundle_price: bundle.bundle_price,
      selected_items: selectedItems,
      total_savings: bundle.savings,
    };

    setSelectedBundles(prev => [...prev, bundleConfiguration]);
  };

  const removeBundleFromCart = (bundleId: string) => {
    setSelectedBundles(prev => prev.filter(item => item.bundle_id !== bundleId));
  };

  const clearBundleCart = () => {
    setSelectedBundles([]);
  };

  const getBundleCartTotal = () => {
    return selectedBundles.reduce((total, bundle) => total + bundle.bundle_price, 0);
  };

  const getBundleCartSavings = () => {
    return selectedBundles.reduce((total, bundle) => total + bundle.total_savings, 0);
  };

  return {
    selectedBundles,
    addBundleToCart,
    removeBundleFromCart,
    clearBundleCart,
    getBundleCartTotal,
    getBundleCartSavings,
  };
};
