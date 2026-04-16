import { useQuery } from '@tanstack/react-query';
import { ContactSupportService } from '@/client';

export interface SupportTicket {
  ticket_id: string;
  subject?: string;
  category?: string;
  message: string;
  status: string;
  created_at: string;
  screenshot_url?: string;
}

export interface SupportTicketsResponse {
  tickets: SupportTicket[];
  total_count: number;
  average_response_time: string;
}

/**
 * Hook to fetch support tickets for the current user
 */
export const useSupportTickets = () => {
  return useQuery<SupportTicketsResponse>({
    queryKey: ['supportTickets'],
    queryFn: async () => {
      const response = await ContactSupportService.getMyTicketsApiContactSupportMyTicketsGet();
      return response;
    },
  });
};
