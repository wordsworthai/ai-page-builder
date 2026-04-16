import type { UserWebsiteData } from '@/hooks/api/PageBuilder/Websites/useWebsiteData';

/**
 * Get the last successful generation ID from website data.
 * A generation is considered successful if it has a preview_link.
 */
export function getLastSuccessfulGenerationId(
  websiteData: UserWebsiteData | null | undefined
): string | null {
  return websiteData?.homepage?.preview_link && websiteData?.homepage?.current_generation_id
    ? websiteData.homepage.current_generation_id
    : null;
}
