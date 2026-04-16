// Dont import config from wwai_puck/apps/demo/config
// Dont import useDemoData from wwai_puck/apps/demo/lib/use-demo-data
// Adding this will add a lot of dependencies to the project and will
// make the project too heavy. Lets just stick to using core.

import React, { useState, useEffect } from 'react';
import { Puck, Render, AutoField, Button, FieldLabel } from '@measured/puck';
import { puckConfig } from '../../config/puck.config';
import { Type } from 'lucide-react';
import { IframeRenderWrapper } from './IframeRender';
import './Editor.styles.css';

export interface EditorProps {
  // Add any props you need here
}

export const Editor: React.FC<EditorProps> = () => {
  const [isEditMode, setIsEditMode] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [currentData, setCurrentData] = useState<any>(null);
  
  // Temporarily simplified data management without useDemoData hook
  useEffect(() => {
    setIsClient(true);
    // Set some initial data for testing
    setCurrentData({
      content: []
    });
  }, []);

  if (!isClient) return null;

  const handlePublish = async (newData: any) => {
    console.log('Published:', newData);
    setCurrentData(newData);
  };

  const handleChange = (updatedData: any) => {
    setCurrentData(updatedData);
  };

  return (
    <div className="w-full h-screen bg-gray-50">

      
      {/* Editor/Preview Content */}
      <div className="h-full">
        {isEditMode ? (
          <div className="puck-editor-container" style={{ 
            isolation: 'isolate',
            all: 'initial'
          }}>
            <Puck
              config={puckConfig}
              data={currentData}
              onPublish={handlePublish}
              onChange={handleChange}
              plugins={[]}
              iframe={{ enabled: false }}
              fieldTransforms={{
                userField: ({ value }) => value,
              }}
              overrides={{
                fieldTypes: {
                  userField: ({ readOnly, field, name, value, onChange }) => (
                    <FieldLabel
                      label={field.label || name}
                      readOnly={readOnly}
                      icon={<Type size={16} />}
                    >
                      <AutoField
                        field={{ type: "text" }}
                        onChange={onChange}
                        value={value}
                      />
                    </FieldLabel>
                  ),
                },
                headerActions: ({ children }) => (
                  <>
                    <div>
                      <Button 
                        onClick={() => setIsEditMode(false)} 
                        variant="secondary"
                      >
                        Preview
                      </Button>
                    </div>
                    {children}
                  </>
                ),
              }}
              metadata={{
                title: "Weditor Page",
                description: "Built with Weditor"
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full relative">
            {currentData?.content ? (
              <div className="w-full h-full">
                {/* Floating Return Button */}
                <button
                  onClick={() => setIsEditMode(true)}
                  className="fixed top-6 right-6 z-50 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl"
                  title="Back to Edit Mode"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                
                {/* Preview Content - Full Screen with CSS Isolation */}
                <div className="w-full h-full">
                  <IframeRenderWrapper
                    config={puckConfig}
                    data={currentData}
                    onclickfn={() => setIsEditMode(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h1 className="text-xl font-semibold text-gray-700 mb-2">No Content</h1>
                  <p className="text-gray-500 mb-4">Switch to edit mode to add content</p>
                  <Button 
                    onClick={() => setIsEditMode(true)} 
                    variant="secondary"
                  >
                    Go to Edit Mode
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
