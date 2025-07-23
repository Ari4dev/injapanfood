import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllBanners, 
  getActiveBanners, 
  addBanner, 
  updateBanner, 
  deleteBanner,
  uploadBannerImage,
  getActiveBannersCount
} from '@/services/bannerService';
import { Banner } from '@/types';

// Hook for getting all banners (admin)
export const useBanners = () => {
  return useQuery({
    queryKey: ['banners'],
    queryFn: getAllBanners,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for getting active banners (public)
export const useActiveBanners = () => {
  return useQuery({
    queryKey: ['banners', 'active'],
    queryFn: getActiveBanners,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for getting active banners count
export const useActiveBannersCount = () => {
  return useQuery({
    queryKey: ['banners', 'active', 'count'],
    queryFn: getActiveBannersCount,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for adding banner
export const useAddBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bannerData: Omit<Banner, 'id' | 'created_at' | 'updated_at'>) => 
      addBanner(bannerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
};

// Hook for updating banner
export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Banner> }) => 
      updateBanner(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
};

// Hook for deleting banner
export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
};

// Hook for uploading banner image
export const useUploadBannerImage = () => {
  return useMutation({
    mutationFn: (file: File) => uploadBannerImage(file),
  });
};