import React from 'react';
import { Puck } from '@measured/puck';
import { generatingConfig, generatingData } from './generatingConfig';

interface ErrorStatePuckViewProps {
  overrides: any;
  errorType: 'invalid-generation-id' | 'no-template-data';
}

/**
 * Component to render error state inside Puck.
 * 
 * Shows error message in iframe override based on error type:
 * - invalid-generation-id: Invalid generation ID in URL
 * - no-template-data: Template data could not be loaded
 */
export const ErrorStatePuckView: React.FC<ErrorStatePuckViewProps> = ({
  overrides,
  errorType,
}) => {
  const key = errorType === 'invalid-generation-id' ? 'error-state' : 'error-state-no-data';
  
  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="h-full puck-editor-container">
        <Puck
          key={key}
          config={generatingConfig}
          data={generatingData}
          onPublish={() => {}}
          plugins={[]}
          iframe={{ enabled: true }}
          overrides={overrides}
          metadata={{
            title: "Error",
            description: "Built with Weditor"
          }}
        />
      </div>
    </div>
  );
};
