import axios from 'axios';

/**
 * External API service for inspiration-repo
 */
const UI_UX_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface CreateSiteSpecResponse {
  status: string;
  message: string;
  dev_task_id: string;
  design_id: string;
}

/**
 * Create site spec JSON by calling external inspiration-repo API
 * @param identifier - Either query_hash or template_id
 * @param useQueryHash - If true, sends query_hash; otherwise sends template_id
 * @returns Response with dev_task_id and design_id
 */
export const createSiteSpecJson = async (
  identifier: string,
  useQueryHash: boolean = false
): Promise<CreateSiteSpecResponse> => {
  const url = `${UI_UX_API_BASE_URL}/inspiration-repo/create-site-spec-json`;
  
  try {
    const requestBody = useQueryHash 
      ? { query_hash: identifier }
      : { template_id: identifier };
    
    const response = await axios.post<CreateSiteSpecResponse>(
      url,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 300000, // 300 seconds timeout
      }
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create site spec';
      throw new Error(errorMessage);
    }
    throw error;
  }
};

