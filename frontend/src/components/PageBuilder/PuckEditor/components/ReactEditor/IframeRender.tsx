import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Render } from '@measured/puck';
import type { Config, Data } from '@measured/puck';

interface IframeRenderWrapperProps<UserConfig extends Config = Config> {
  config: UserConfig;
  data: Data;
  onclickfn: () => void;
}

export const IframeRenderWrapper = <UserConfig extends Config = Config>({
  config,
  data,
  onclickfn
}: IframeRenderWrapperProps<UserConfig>) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  
  // Initialize the iframe document when the component mounts
  useEffect(() => {
    // Create iframe document and prepare it before mounting React
    const setupIframe = () => {
      if (!iframeRef.current) return;
      
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument;
      
      if (!iframeDoc) return;
      
      // Write initial HTML to ensure the document is properly initialized
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body, html {
                margin: 0;
                padding: 0;
                font-family: sans-serif;
                height: 100%;
                overflow-x: hidden;
                background-color: #FFFFFF;
                border: none;
              }
            </style>
          </head>
          <body>
            <div id="render-root"></div>
          </body>
        </html>
      `);
      iframeDoc.close();
      
      // Find all style tags in the parent document that we want to preserve
      const styleModules = Array.from(
        document.querySelectorAll('style[data-vite-dev-id*="DraggableComponent/styles.module.css"]')
      );
      
      // Copy over all the style module tags we want to preserve
      styleModules.forEach(style => {
        const clonedStyle = iframeDoc.createElement('style');
        clonedStyle.setAttribute('data-vite-dev-id', style.getAttribute('data-vite-dev-id') || '');
        clonedStyle.textContent = style.textContent;
        iframeDoc.head.appendChild(clonedStyle);
      });
      
      // Set the mount node for our React portal
      const renderRoot = iframeDoc.getElementById('render-root');
      if (renderRoot) {
        setMountNode(renderRoot);
      } else {
        console.error('Could not find render-root in iframe');
      }
      
      // Configure the iframe body
      iframeDoc.body.style.height = '100%';
      iframeDoc.body.style.overflow = 'auto';
    };
    
    // If the iframe is already loaded in the DOM, set it up
    if (iframeRef.current) {
      setupIframe();
      const domContentLoadedTimeoutId = setTimeout(() => {
      }, 1500);
      return () => {
        clearTimeout(domContentLoadedTimeoutId);
      };
    }
    
    // Use a timeout as a fallback to make sure it's initialized
    const timeoutId = setTimeout(setupIframe, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
  
  // Update iframe height to match content
  useEffect(() => {
    if (!iframeRef.current || !mountNode) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (iframeRef.current && iframeRef.current.contentDocument) {
        const height = iframeRef.current.contentDocument.documentElement.scrollHeight;
        iframeRef.current.style.height = `${height}px`;
      }
    });
    
    if (iframeRef.current.contentDocument) {
      resizeObserver.observe(iframeRef.current.contentDocument.documentElement);
    }
    
    return () => resizeObserver.disconnect();
  }, [mountNode]);
  
  // Add a special wrapper that preserves the edit button functionality
  const renderWithEditButton = () => {
    // We need to modify how the "Edit Page" button works in the iframe context
    const wrappedOnClickFn = () => {
      // This will be called from inside the iframe context
      window.parent.postMessage('edit-page-clicked', '*');
    };
    
    return <Render config={config} data={data} onclickfn={wrappedOnClickFn} />;
  };
  
  // Set up message listener for the edit button
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'edit-page-clicked') {
        // Call the original onclickfn when we receive the message from iframe
        onclickfn();
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onclickfn]);

  return (
    <div className="iframe-render-container" style={{ width: '100%', height: '100%' }}>
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          border: 'none',
          display: 'block',
          minHeight: '100vh'
        }}
        title="Page Render Preview"
        id="render-preview-frame"
      />
      
      {mountNode && createPortal(
        renderWithEditButton(),
        mountNode
      )}
    </div>
  );
};

export default IframeRenderWrapper;
