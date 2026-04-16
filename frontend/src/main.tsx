import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { StyledEngineProvider } from "@mui/material/styles";
import { CircularProgress, Box } from "@mui/material";
import ScrollToTop from "@/components/Shared/Common/ScrollToTop";
import { initializeApiClient } from "@/config/api";

initializeApiClient();

const AppComponent = React.lazy(() => import('@/App'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <React.StrictMode>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ScrollToTop />
        <StyledEngineProvider injectFirst>
          <Suspense fallback={<LoadingFallback />}>
            <AppComponent />
          </Suspense>
        </StyledEngineProvider>
      </BrowserRouter>
    </React.StrictMode>
  </QueryClientProvider>
);
