import { Route, Routes } from "react-router-dom";
import { Box } from "@mui/material";
import SharedAppShell, {
  authRouteElements,
  errorRouteElements,
} from "@/components/Shared/AppShell/SharedAppShell";
import { GenerationStateProvider } from "@/context/generation_state/GenerationStateContext";
import MainLayout from "@/components/Shared/Layouts/MainLayout";
import ProtectedRoute from "@/components/Shared/Guards/ProtectedRoute";
import Home from "@/pages/PageBuilder/Home/Home";
import CreateSite from "@/pages/PageBuilder/CreateSite/CreateSite";
import NotFound from "@/pages/Shared/Errors/NotFound";
import PaymentSuccess from "@/pages/Shared/Billing/PaymentSuccess";
import PaymentCancel from "@/pages/Shared/Billing/PaymentCancel";
import MyArticles from "@/pages/Shared/Article/MyArticles";
import CreateArticle from "@/pages/Shared/Article/CreateArticle";
import EditArticle from "@/pages/Shared/Article/EditArticle";
import ViewArticle from "@/pages/Shared/Article/ViewArticle";
import EditProfile from "@/pages/Shared/Profile/EditProfile";
import Dashboard from "@/pages/Shared/Dashboard/Dashboard";
import DashboardV2 from "@/pages/PageBuilder/Dashboard/DashboardV2";
import MediaManagement from "@/pages/PageBuilder/Media/MediaManagement";
import UIGuidelines from "@/pages/Shared/Dev/UIGuidelines";
import Analytics from "@/pages/PageBuilder/Analytics/Analytics";
import Integrations from "@/pages/Shared/Integrations/Integrations";
import Billing from "@/pages/Shared/Billing/Billing";
import Usage from "@/pages/Shared/Billing/Usage";
import PuckEditor from "@/pages/PageBuilder/Editor/PuckEditor";
import { Editor as LiquidEditor } from "@/components/PageBuilder/PuckEditor/components/LiquidEditor";
import Websites from "@/pages/PageBuilder/Websites/Websites";
import PublishedWebsiteAnalytics from "@/pages/PageBuilder/Analytics/PublishedWebsiteAnalytics";
import FormsAndEnquiries from "@/pages/PageBuilder/Forms/FormsAndEnquiries";
import ProfileManagement from "@/pages/Shared/Profile/ProfileManagement";
import GenerationMetrics from "@/pages/PageBuilder/Analytics/GenerationMetrics";
import { HelpIcon } from "@/components/Shared/Common/HelpIcon";
import { useCurrentUser } from "@/hooks/api/Shared/Auth/useCurrentUser";

export { UserContext } from "@/components/Shared/AppShell/SharedAppShell";

function App(props: { disableCustomTheme?: boolean }) {
  const { data: currentUser } = useCurrentUser();

  return (
    <SharedAppShell disableCustomTheme={props.disableCustomTheme}>
      <GenerationStateProvider>
        <Routes>
          {authRouteElements}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/create-site" element={<CreateSite />} />

            {errorRouteElements}

            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<DashboardV2 />} />
              <Route path="old-dashboard-depr" element={<Dashboard />} />
              <Route path="dashboard/my-articles" element={<MyArticles />} />
              <Route path="dashboard/my-articles/new" element={<CreateArticle />} />
              <Route path="dashboard/my-articles/:id/edit" element={<EditArticle />} />
              <Route path="dashboard/my-articles/:id/view" element={<ViewArticle />} />
              <Route path="dashboard/profile" element={<EditProfile />} />
              <Route path="dashboard/ui-guidelines" element={<UIGuidelines />} />
              <Route path="dashboard/analytics" element={<Analytics />} />
              <Route path="dashboard/media" element={<MediaManagement />} />
              <Route path="dashboard/integrations" element={<Integrations />} />
              <Route path="dashboard/billing" element={<Billing />} />
              <Route path="dashboard/usage" element={<Usage />} />
              <Route path="dashboard/payment/success" element={<PaymentSuccess />} />
              <Route path="dashboard/payment/cancel" element={<PaymentCancel />} />
              <Route path="dashboard/websites" element={<Websites />} />
              <Route path="dashboard/published-website-analytics" element={<PublishedWebsiteAnalytics />} />
              <Route path="puck" element={<PuckEditor />} />
              <Route path="editor/:generationVersionId" element={<LiquidEditor />} />
              <Route path="dashboard/forms" element={<FormsAndEnquiries />} />
              <Route path="dashboard/generation-metrics" element={<GenerationMetrics />} />
              <Route path="dashboard/profile-management" element={<ProfileManagement />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Box
          sx={{
            position: "fixed",
            bottom: (theme) => theme.spacing(3),
            right: (theme) => theme.spacing(3),
            zIndex: 1000,
          }}
        >
          <HelpIcon size={48} clickable currentUser={currentUser} />
        </Box>
      </GenerationStateProvider>
    </SharedAppShell>
  );
}

export default App;
