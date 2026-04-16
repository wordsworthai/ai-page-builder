import React, { createContext, ReactNode } from "react";
import { Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@/App.css";
import { CurrentUserResponse } from "@/client";
import { useCurrentUser } from "@/hooks/api/Shared/Auth/useCurrentUser";
import AuthLayout from "@/components/Shared/Layouts/AuthLayout";
import Login from "@/pages/Shared/Auth/Login";
import SignUp from "@/pages/Shared/Auth/SignUp";
import ForgotPassword from "@/pages/Shared/Auth/ForgotPassword";
import CheckEmail from "@/pages/Shared/Auth/CheckEmail";
import ResetPassword from "@/pages/Shared/Auth/ResetPassword";
import PasswordResetSuccess from "@/pages/Shared/Auth/PasswordResetSuccess";
import VerifyEmail from "@/pages/Shared/Auth/VerifyEmail";
import NotFound from "@/pages/Shared/Errors/NotFound";
import ServerError from "@/pages/Shared/Errors/ServerError";
import ErrorBoundary from "@/components/Shared/Guards/ErrorBoundary";
import { ConfirmProvider } from "material-ui-confirm";
import { SignUpDialogProvider } from "@/context/SignUpDialogContext";
import { CssBaseline } from "@mui/material";
import AppTheme from "@/theme/AppTheme";

export const UserContext = createContext<CurrentUserResponse | undefined>(
  undefined
);

export const authRouteElements = (
  <Route element={<AuthLayout />}>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/check-email" element={<CheckEmail />} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/password-reset-success" element={<PasswordResetSuccess />} />
  </Route>
);

export const errorRouteElements = (
  <>
    <Route path="/404" element={<NotFound />} />
    <Route path="/500" element={<ServerError />} />
    <Route path="/error" element={<ServerError errorCode={500} message="An unexpected error occurred" />} />
  </>
);

interface SharedAppShellProps {
  children: ReactNode;
  disableCustomTheme?: boolean;
}

export default function SharedAppShell({ children, disableCustomTheme }: SharedAppShellProps) {
  const { data: currentUser } = useCurrentUser();

  return (
    <AppTheme disableCustomTheme={disableCustomTheme}>
      <CssBaseline enableColorScheme />
      <ErrorBoundary>
        <UserContext.Provider value={currentUser}>
          <ConfirmProvider>
            <SignUpDialogProvider>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                style={{ zIndex: 10001 }}
              />
              {children}
            </SignUpDialogProvider>
          </ConfirmProvider>
        </UserContext.Provider>
      </ErrorBoundary>
    </AppTheme>
  );
}
