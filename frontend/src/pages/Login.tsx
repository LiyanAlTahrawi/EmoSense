import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AuthConfigNotice } from '../components/auth/AuthConfigNotice';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { FullScreenLoader } from '../components/common/FullScreenLoader';

export function LoginPage() {
  useDocumentTitle('Log in');
  const { status } = useAuth();
  if (status === 'loading') return <FullScreenLoader label="Checking your session…" />;
  if (status === 'authenticated') return <Navigate to="/app" replace />;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue your conversations."
      footer={
      <>
          New to EmoSense? <Link to="/signup" className="font-medium text-accent hover:underline">Create an account</Link>
        </>
      }>
      
      <AuthConfigNotice />
      <LoginForm />
    </AuthLayout>);

}