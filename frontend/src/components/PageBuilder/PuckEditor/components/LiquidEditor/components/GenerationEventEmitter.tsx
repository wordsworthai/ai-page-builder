import { useGenerationEventEmitter } from '../hooks';
import type { GenerationStatus } from '@/streaming/types/generation';

/**
 * Component that handles generation event emission.
 * 
 * This component watches generation status and emits events to the event context.
 */
interface GenerationEventEmitterProps {
  generationStatus: GenerationStatus | undefined;
}

export const GenerationEventEmitter: React.FC<GenerationEventEmitterProps> = ({
  generationStatus,
}) => {
  // Convert generation status changes to events
  useGenerationEventEmitter(generationStatus);
  
  // This component doesn't render anything
  return null;
};
