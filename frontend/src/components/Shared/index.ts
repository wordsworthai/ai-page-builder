// Layout Components (generic shells, reusable across any app)
export {
  PageLayout,
  CenteredPageLayout,
  HeroSection,
} from "./Layouts/PageLayout";
export { default as MainLayout } from "./Layouts/MainLayout";
export { default as AuthLayout } from "./Layouts/AuthLayout";

// Navigation Components (generic header/footer)
export { default as Header } from "./Navigation/Header";
export { default as Footer } from "./Navigation/Footer";

// Card Components
export {
  UniversalCard,
  ModernCard,
  ErrorCard,
  AuthCard,
} from "./Cards/UniversalCard";

// Button Components
export {
  StandardButton,
  StandardIconButton,
  StandardFab,
  CTAButton,
  BackButton,
} from "./Common/StandardButton";

// Branding Components
export {
  Logo,
  LogoIcon,
  LogoText,
  LogoSection,
  HeaderLogo,
  FooterLogo,
  MobileLogo,
  SidebarLogo,
  AuthPageLogo,
} from "./Branding/LogoComponents";

// Auth Components
export { AuthFeatureChip } from "./Auth/AuthFeatureChip";
export {
  AuthFormCard,
  AuthInput,
  AuthPrimaryButton,
  AuthGoogleButton,
  GoogleIcon,
  PasswordInput,
  AuthFormField,
  AuthLink,
  AuthPageTitle,
  AuthHelperText,
} from "./Auth/AuthComponents";

// Form Components
export {
  FormInput,
  FormSection,
  FormField,
  FormGrid,
  InputText,
} from "./Forms/FormComponents";

// Common UI Patterns
export {
  LoadingState,
  EmptyState,
  StatusBadge,
  SectionHeader,
  PageHeader,
  FeatureChip,
} from "./Patterns/CommonPatterns";

// Common Utility Components
export { default as Loader } from "./Common/Loader";
export { default as BackgroundImage } from "./Common/BackgroundImage";
export { HelpIcon, default as HelpIconDefault } from "./Common/HelpIcon";
export { default as NotificationBar } from "./Common/NotificationBar";
export { default as ScrollToTop } from "./Common/ScrollToTop";

// Shared Dialogs (generic support/billing dialogs)
export { default as ContactDialog } from "./Dialogs/ContactDialog";
export { default as CancelSubscriptionDialog } from "./Dialogs/CancelSubscriptionDialog";
export { default as SupportTicketsModal } from "./Dialogs/SupportTicketsModal";

// Guards
export { default as ErrorBoundary } from "./Guards/ErrorBoundary";
export { default as ProtectedRoute } from "./Guards/ProtectedRoute";
export { PermissionGuard, usePermission, withPermission } from "./Guards/PermissionGuard";

// Billing (shared Stripe subscription model)
export { default as PlanStatus } from "./Billing/PlanStatus";
export { default as UpgradeDialog } from "./Billing/UpgradeDialog";

// Profile
export { EditProfileForm } from "./Profile/EditProfileForm";

// SignUp
export { default as SignUpDialog } from "./SignUp/SignUpDialog";
