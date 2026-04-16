import React, { useEffect, useState, useRef } from 'react';
import { useDebounce } from 'use-debounce';
// @ts-ignore
import InnerHTML from 'dangerously-set-html-content';
//@ts-ignore
import { compileSingleSection } from 'liquid-compiler/liquid_renderer/liquidService';


interface LiquidPreviewProps {
    liquid_section_id: string;  
    liquid_section_name: string;
    liquid_section: string;
    liquid_section_compiler_dependencies: string;
    compiledHtml?: string;
}

const LiquidPreview: React.FC<LiquidPreviewProps> = ({
    liquid_section_id, 
    liquid_section_name, 
    liquid_section, 
    liquid_section_compiler_dependencies,
    compiledHtml: initialCompiledHtml
}) => {
    const [debouncedLiquidSection] = useDebounce(liquid_section, 500);
    const [debouncedLiquidSectionCompilerDependencies] = useDebounce(liquid_section_compiler_dependencies, 500);
    const [compiledHTML, setCompiledHTML] = useState(initialCompiledHtml || '');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(!initialCompiledHtml);
    const [frameKey, setFrameKey] = useState(Date.now());
    const latestExpandedJSONRef = useRef<any>(null);

    const compileSection = async () => {
        try {
          let parsed_section = JSON.parse(liquid_section);
          let parsed_section_compiler_dependencies = JSON.parse(liquid_section_compiler_dependencies);
          
          // Call compileSingleSection with the parsed data
          const result = await compileSingleSection(
            liquid_section_id,
            parsed_section,
            parsed_section_compiler_dependencies
          );
          
          return result;
        } catch (error) {
            console.error('Error rendering template:', error);
            throw error;
        }
    };

    const renderAndGenerateHTML = async () => {
        try {
            setLoading(true);
            setError(null);
            const templateResult = await compileSection();
            
            if (!templateResult.success) {
                throw new Error(templateResult.error_message || 'Section compilation failed');
            }
            
            if (!templateResult.html) {
                throw new Error('No HTML was returned from the renderer');
            }
            
            setCompiledHTML(templateResult.html);
            setFrameKey(Date.now());
        } catch (err: any) {
            console.error('Error in renderAndGenerateHTML:', err);
            setError('Failed to render template: ' + (err.message || 'Unknown error'));
            setCompiledHTML('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialCompiledHtml) {
            renderAndGenerateHTML();
        } else {
            setCompiledHTML(initialCompiledHtml);
            setLoading(false);
        }
    }, [debouncedLiquidSection, debouncedLiquidSectionCompilerDependencies, initialCompiledHtml]);

    if (loading) {
        return <div className="loading-indicator" style={{height: '200px'}}>Rendering section...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return compiledHTML ? <InnerHTML key={frameKey} html={compiledHTML} /> : <div />;
};

export default LiquidPreview;