import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AuthConfigNotice } from '../components/auth/AuthConfigNotice';
import { AuthLayout } from '../components/auth/AuthLayout';
import { SignupForm } from '../components/auth/SignupForm';

export function SignupPage() {
  useDocumentTitle('Create your account');
  return (
    <AuthLayout
      title="Create your EmoSense account"
      subtitle="A private space to express yourself and be heard."
      footer={
      <>
          Already have an account? <Link to="/login" className="font-medium text-accent hover:underline">Log in</Link>
        </>
      }>
      
      <AuthConfigNotice />
      <SignupForm />
    </AuthLayout>);

}