import React from 'react';
import { Button } from '@measured/puck';

/**
 * ErrorStateView: Shows error when template data cannot be loaded
 */
export interface ErrorStateViewProps {
  onBackToDashboard: () => void;
}

export const ErrorStateView: React.FC<ErrorStateViewProps> = ({ onBackToDashboard }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-700 mb-2">No Template Data</h1>
        <p className="text-gray-500 mb-4">Unable to load template configuration</p>
        <Button onClick={onBackToDashboard} variant="secondary">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
