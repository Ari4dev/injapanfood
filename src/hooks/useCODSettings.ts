import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCODSettings, updateCODSettings, CODSettings } from '@/services/codSurchargeService';

export const useCODSettings = () => {
  return useQuery({
    queryKey: ['cod-settings'],
    queryFn: getCODSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateCODSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: {
      surchargeAmount?: number;
      isEnabled?: boolean;
      description?: string;
    }) => updateCODSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cod-settings'] });
    },
  });
};