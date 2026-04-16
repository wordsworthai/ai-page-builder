/**
 * Contact Support Hook
 * 
 * Provides React hook for submitting contact support forms with optional screenshot upload.
 */
import { useMutation } from '@tanstack/react-query';
import { ContactSupportService } from '@/client';
import type { Body_submit_contact_support_api_contact_support_submit_post } from '@/client/models/Body_submit_contact_support_api_contact_support_submit_post';
import type { ContactSupportResponse } from '@/client/models/ContactSupportResponse';

interface ContactSupportData {
  name: string;
  email: string;
  category?: string;
  subject?: string;
  message: string;
  currentPage: string;
  currentUrl: string;
  userAgent: string;
  screenshot?: File;
}

/**
 * Hook for submitting contact support forms
 */
export const useContactSupport = () => {
  return useMutation<ContactSupportResponse, Error, ContactSupportData>({
    mutationFn: async (data: ContactSupportData) => {
      const formData: Body_submit_contact_support_api_contact_support_submit_post = {
        name: data.name,
        email: data.email,
        category: data.category || null,
        subject: data.subject || null,
        message: data.message,
        current_page: data.currentPage || null,
        current_url: data.currentUrl || null,
        user_agent: data.userAgent || null,
        device_type: null,
        screenshot: data.screenshot || null,
      };
      
      return await ContactSupportService.submitContactSupportApiContactSupportSubmitPost(formData);
    },
  });
};
