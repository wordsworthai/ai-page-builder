# Liquid Data Processing Utils

This directory contains utility functions for processing liquid data and integrating with the wwai-compiler-service API to create puck-compatible data structures.

## Overview

The utilities provide a complete pipeline for:

1. **Fetching templates** from the wwai-compiler-service API
2. **Processing liquid schemas** into puck-compatible formats
3. **Creating puck data structures** from template information
4. **Integrating external API calls** with local data processing

## Main Functions

### API Integration

#### `fetchAndProcessTemplateForPuck(templateId, targetStoreUrl)`

Fetches a template from the API and processes it into puck data format.

**Parameters:**

- `templateId` (string): The ID of the template to fetch
- `targetStoreUrl` (string): The target store URL for processing

**Returns:** Promise<Array> - Processed puck data array

**Example:**

```typescript
import { fetchAndProcessTemplateForPuck } from './liquidDataProcessUtils/api_integration';

const puckData = await fetchAndProcessTemplateForPuck('6899cf17382c88fe50661b65', 'https://mystore.myshopify.com');

console.log('Processed sections:', puckData.length);
```
### Data Processing

#### `processDataForPuck(templateFileAndAssetsOutput, sectionCompilerDependencies, targetStoreUrl)`

Processes template data into puck format.

#### `constructLiquidDataSchema(liquidSchema, brandUrl)`

Creates puck-compatible schema from liquid schema definitions.

#### `constructLiquidDataPuck(sectionExpandedTemplateJson)`

Constructs puck data structure from template JSON.

## Usage Workflow

### 1. Single Template Processing

```typescript
import { fetchAndProcessTemplateForPuck } from './liquidDataProcessUtils/api_integration';

try {
  const puckData = await fetchAndProcessTemplateForPuck('your-template-id', 'https://yourstore.myshopify.com');

  // Use the processed puck data
  console.log('Template processed successfully:', puckData);
} catch (error) {
  console.error('Failed to process template:', error);
}
```

### 2. Direct Data Processing (without API call)

```typescript
import { processDataForPuck } from './liquidDataProcessUtils/process_data_for_puck';

// If you already have the template data
const puckData = processDataForPuck(templateFileAndAssetsOutput, sectionCompilerDependencies, targetStoreUrl);
```

## Data Flow

```
Template ID + Store URL
         ↓
   API Call (fetchTemplateFromAPI)
         ↓
   Template Response
         ↓
   Data Extraction
         ↓
   Puck Data Processing (processDataForPuck)
         ↓
   Final Puck Data Structure
```

## Error Handling

All functions include comprehensive error handling:

- API call failures
- Invalid response structures
- Missing required data
- Processing errors

Errors are logged with context and re-thrown with descriptive messages.

## Dependencies

- **wwai-compiler-service**: External submodule providing the API integration
- **TypeScript**: Full type safety and IntelliSense support
- **ES6 Modules**: Modern import/export syntax

## Notes

- The API base URL is configurable in the liquid service
- Templates are processed sequentially to avoid overwhelming the API
- Failed template processing doesn't stop the entire batch operation
- All functions are fully typed for better development experience
