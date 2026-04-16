/**
 * Formats technical error messages into user-friendly messages
 * @param errorMessage - The raw technical error message
 * @returns Object with user-friendly message and optional technical details
 */
export function formatUserFriendlyError(errorMessage: string | null | undefined): { 
  userMessage: string; 
  technicalDetails?: string;
  suggestions?: string[];
} {
  if (!errorMessage) {
    return {
      userMessage: "Something went wrong while generating your website. Don't worry, you can try again.",
      suggestions: [
        "Try retrying the generation - this often resolves temporary issues",
        "If the problem persists, start over with a fresh generation"
      ]
    };
  }

  const lowerMessage = errorMessage.toLowerCase();

  // Pattern matching for common errors
  if (lowerMessage.includes('last_label is missing') || lowerMessage.includes('snapshot document')) {
    return {
      userMessage: "We couldn't complete the generation. This usually happens when the generation process was interrupted.",
      technicalDetails: errorMessage,
      suggestions: [
        "Try retrying the generation - it will continue from where it left off",
        "If retrying doesn't work, start over with a fresh generation"
      ]
    };
  }

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return {
      userMessage: "The generation took too long to complete. This can happen with complex websites.",
      technicalDetails: errorMessage,
      suggestions: [
        "Try retrying - sometimes the second attempt is faster",
        "Consider simplifying your website requirements if this keeps happening"
      ]
    };
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return {
      userMessage: "We couldn't connect to our servers. Please check your internet connection.",
      technicalDetails: errorMessage,
      suggestions: [
        "Check your internet connection and try again",
        "If you're on a VPN, try disconnecting it"
      ]
    };
  }

  if (lowerMessage.includes('credits') || lowerMessage.includes('insufficient')) {
    return {
      userMessage: "You don't have enough credits to complete this generation.",
      technicalDetails: errorMessage,
      suggestions: [
        "Purchase more credits to continue",
        "Contact support if you believe this is an error"
      ]
    };
  }

  if (lowerMessage.includes('permission') || lowerMessage.includes('unauthorized')) {
    return {
      userMessage: "You don't have permission to perform this action.",
      technicalDetails: errorMessage,
      suggestions: [
        "Make sure you're logged in with the correct account",
        "Contact support if you believe this is an error"
      ]
    };
  }

  // Generic fallback
  return {
    userMessage: "Something went wrong while generating your website. Don't worry, you can try again.",
    technicalDetails: errorMessage,
    suggestions: [
      "Try retrying the generation - this often resolves temporary issues",
      "If the problem persists, start over with a fresh generation",
      "Contact support if the issue continues"
    ]
  };
}
