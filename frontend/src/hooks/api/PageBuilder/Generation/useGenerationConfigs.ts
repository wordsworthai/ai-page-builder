/**
 * Hook to fetch generation configs from MongoDB for the current user's business.
 * Used by Change Active Site modal to list selectable generations.
 */
import { useQuery } from '@tanstack/react-query';
import { PageGenerationService } from '@/client';
import type { GenerationConfigListResponse } from '@/client';
import { useCurrentUser } from '@/hooks/api/Shared/Auth/useCurrentUser';

export type { GenerationConfigItem, GenerationConfigItemConfig } from '@/client';

/**
 * Hook to get list of generation configs for the current user's business.
 * Query key: ['generation-configs', user_id, pageId]. Enabled when user exists.
 *
 * @param pageId Optional page ID to filter configs by. When provided, only
 *               configs for that page are returned.
 */
export const useGenerationConfigs = (pageId?: string) => {
  const { data: currentUser } = useCurrentUser();

  return useQuery<GenerationConfigListResponse>({
    queryKey: ['generation-configs', currentUser?.user_id, pageId],

    queryFn: async () => {
      const response = await PageGenerationService.listGenerationConfigsApiGenerationsConfigsGet(pageId);
      return response;
    },

    enabled: !!currentUser,

    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
};
