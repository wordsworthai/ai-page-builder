// Shared/Auth hooks
export { useCurrentUser } from "./Shared/Auth/useCurrentUser";
export { useForgotPassword } from "./Shared/Auth/useForgotPassword";
export { useResetPassword } from "./Shared/Auth/useResetPassword";
export { useResendVerification } from "./Shared/Auth/useResendVerification";

// Shared/Profile hooks
export { useUpdateProfile } from "./Shared/Profile/useUpdateProfile";
export { useDeleteAccount } from "./Shared/Profile/useDeleteAccount";

// Shared/Article hooks
export { useArticles } from "./Shared/Article/useArticles";
export { useArticleDetail } from "./Shared/Article/useArticleDetail";
export { useCreateArticle } from "./Shared/Article/useCreateArticle";
export { useUpdateArticle } from "./Shared/Article/useUpdateArticle";
export { useDeleteArticle } from "./Shared/Article/useDeleteArticle";

// PageBuilder/Generation hooks
export * from './PageBuilder/Generation/useGenerationTrigger';
// useGenerationStatus moved to @/streaming/hooks - use usePageGenerationStatus instead
export { usePageGenerationStatus, useExecutionLog } from '@/streaming/hooks';
export * from './PageBuilder/Generation/useGenerationConfigs';
export * from './PageBuilder/Generation/useGenerationCount';
export { useGenerationTemplates } from "./PageBuilder/Generation/useGenerationTemplates";
export type { TemplateOption, GenerationTemplatesResponse } from "./PageBuilder/Generation/useGenerationTemplates";
export { useGenerationMetrics, useGenerationMetricsList } from "./PageBuilder/Analytics/useGenerationMetrics";

// PageBuilder/Editor hooks
export * from './PageBuilder/Editor/usePreviewCompilation';
export * from './PageBuilder/Editor/useSetActiveGeneration';
export { useSelectedTemplate } from "./PageBuilder/Editor/useSelectedTemplate";
export type { UseSectionIdsRequest } from "./PageBuilder/Editor/useSelectedTemplate";
export { useBatchSectionTemplates } from "./PageBuilder/Editor/useBatchSectionTemplates";

// PageBuilder/Websites hooks
export * from './PageBuilder/Websites/useWebsiteData';
export { useWebsitePages } from './PageBuilder/Websites/useWebsitePages';
export type { WebsitePageRead_Output } from './PageBuilder/Websites/useWebsitePages';

// Shared/Billing - Payment hooks
export {
  useProducts,
  useProduct,
  useCreateCheckoutSession,
  useHandleCheckoutSuccess,
  useCancelSubscription,
  useCreateCustomerPortal,
  useUserPaymentInfo,
  useCheckoutWithProduct,
  useSubscriptionStatus,
} from "./Shared/Billing/usePayments";

// Shared/Billing - Credits hooks
export {
  useCreditsBalance,
  useCreditsInfo,
  useCreditCostForAction,
  useCreditsForAction,
  useCreditTransactions,
  usePurchaseCredits,
  useCanGenerate,
  formatCredits,
  getCreditCostDescription,
} from "./Shared/Billing/useCredits";

// Shared/Billing - Upgrade hooks
export {
  useUpgradeOptions,
  useCreateUpgradeCheckout,
  usePurchaseCreditPack,
} from "./Shared/Billing/useUpgrades";

// Shared/Billing - Plan hooks
export {
  useUserPlan,
  useFeatureAccess,
  useAvailableUpgrades,
  useAllFeatures,
  usePlanComparison,
  useMultipleFeatureAccess,
} from "./Shared/Billing/usePlans";

// PageBuilder/Media hooks
export { useMediaOverview, useMediaDetails } from "./PageBuilder/Media/useMedia";
export type { MediaItem, MediaResponse } from "./PageBuilder/Media/useMedia";
