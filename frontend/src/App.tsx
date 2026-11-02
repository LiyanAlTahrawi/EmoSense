import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ThemedToaster } from './components/common/ThemedToaster';
import { AppShell } from './components/layout/AppShell';
import { ChatPage } from './pages/Chat';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { NotFoundPage } from './pages/NotFound';
import { ReflectionsPage } from './pages/Reflections';
import { ResetPasswordPage } from './pages/ResetPassword';
import { SessionExpiredPage } from './pages/SessionExpired';
import { SettingsPage } from './pages/Settings';
import { SignupPage } from './pages/Signup';
import { UnauthorizedPage } from './pages/Unauthorized';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/session-expired" element={<SessionExpiredPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<AppShell />}>
                  <Route index element={<ChatPage />} />
                  <Route path="c/:conversationId" element={<ChatPage />} />
                  <Route path="reflections" element={<ReflectionsPage />} />
                  <Route path="settings/:section?" element={<SettingsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>);

}