// frontend/src/utils/smbTestStorage.ts

/**
 * LocalStorage utilities for SMB test data
 * Uses separate keys from login flow to avoid conflicts
 */

import { SMB_TEST_STORAGE_KEY } from '@/config/smbConfig';
import type { SMBFormData, GooglePlacesData } from '@/types/smbRecommendation';

const defaultFormData: SMBFormData = {
  businessName: '',
  googlePlacesData: undefined,
  yelpUrl: '',
  purpose: '',
  tone: '',
  colorPalette: {
    id: 'minimal-1',
    colors: {
      primary: '#000000',
      secondary: '#424242',
      accent: '#9E9E9E',
      background: '#FFFFFF',
    },
  },
};

export const getSMBTestData = (): SMBFormData => {
  try {
    const data = localStorage.getItem(SMB_TEST_STORAGE_KEY);
    if (!data) return defaultFormData;
    
    const parsed = JSON.parse(data);
    return { ...defaultFormData, ...parsed };
  } catch (error) {
    console.error('Failed to load SMB test data:', error);
    return defaultFormData;
  }
};

export const saveSMBTestData = (data: Partial<SMBFormData>): void => {
  try {
    const currentData = getSMBTestData();
    const updatedData = { ...currentData, ...data };
    localStorage.setItem(SMB_TEST_STORAGE_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Failed to save SMB test data:', error);
  }
};

export const clearSMBTestData = (): void => {
  try {
    localStorage.removeItem(SMB_TEST_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear SMB test data:', error);
  }
};