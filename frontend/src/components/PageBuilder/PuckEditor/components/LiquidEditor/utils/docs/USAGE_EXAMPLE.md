# New Editor Data Provider Usage Example

This document shows how to use the new `useNewEditorDataProvider` hook that integrates with the new API.

## 🆕 **New Hook vs Old Hook**

### **Old Hook (Existing)**
```typescript
import { useEditorDataProvider } from './utils';

const { fetchTemplateData } = useEditorDataProvider();

// Old usage - only templateId
const result = await fetchTemplateData('template-id-123');
```

### **New Hook (New API Integration)**
```typescript
import { useNewEditorDataProvider } from './utils';

const { fetchTemplateData } = useNewEditorDataProvider();

// New usage - templateId + targetStoreUrl
const result = await fetchTemplateData('template-id-123', 'https://mystore.myshopify.com');
```

## 🚀 **Complete Usage Example**

```typescript
import React, { useEffect, useState } from 'react';
import { useNewEditorDataProvider } from './utils';

const TemplateEditor = () => {
    const [templateData, setTemplateData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { fetchTemplateData } = useNewEditorDataProvider();
    
    const loadTemplate = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await fetchTemplateData(
                '6899cf17382c88fe50661b65', // template ID
                'https://mystore.myshopify.com' // target store URL
            );
            
            setTemplateData(result);
            console.log('Template loaded successfully:', result);
            
        } catch (err) {
            setError(err.message);
            console.error('Failed to load template:', err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        loadTemplate();
    }, []);
    
    if (loading) return <div>Loading template...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!templateData) return <div>No template data</div>;
    
    return (
        <div>
            <h1>Template Editor</h1>
            <p>Brand URL: {templateData.brandUrl}</p>
            <p>Sections: {templateData.data.content.length}</p>
            <p>Components: {Object.keys(templateData.config.components).length}</p>
            
            {/* Your editor UI here */}
        </div>
    );
};

export default TemplateEditor;
```

## 🔄 **Migration Path**

### **Step 1: Test New Hook**
```typescript
// In your component, import both hooks
import { useEditorDataProvider, useNewEditorDataProvider } from './utils';

// Use new hook for testing
const { fetchTemplateData: fetchTemplateDataNew } = useNewEditorDataProvider();
```

### **Step 2: Compare Results**
```typescript
// Test both hooks side by side
const testBothHooks = async () => {
    const oldResult = await fetchTemplateDataOld('template-id');
    const newResult = await fetchTemplateDataNew('template-id', 'store-url');
    
    console.log('Old result:', oldResult);
    console.log('New result:', newResult);
    
    // Verify they return the same structure
    console.log('Same structure?', 
        JSON.stringify(oldResult.config) === JSON.stringify(newResult.config)
    );
};
```

### **Step 3: Switch Over**
```typescript
// Once verified, switch to new hook
const { fetchTemplateData } = useNewEditorDataProvider();
```

## 📊 **Data Structure Comparison**

Both hooks return the **exact same structure**:

```typescript
{
    config: {
        root: { render: Root },
        categories: { /* section sets */ },
        components: { /* component configs */ }
    },
    data: {
        content: [ /* section components */ ],
        root: { props: { title: "Template Builder" } },
        zones: {}
    },
    brandUrl: string | null
}
```

## ⚠️ **Important Notes**

1. **New hook requires `targetStoreUrl`** - this is the main difference
2. **Same return structure** - existing code will work unchanged
3. **Better error handling** - more descriptive error messages
4. **New API integration** - uses `fetchAndProcessTemplateForPuck` internally
5. **Backward compatible** - can be used alongside existing hook during migration

## 🧪 **Testing**

Test the new hook with:
- Valid template IDs
- Valid store URLs
- Invalid inputs (should throw descriptive errors)
- Network failures (should handle gracefully)
