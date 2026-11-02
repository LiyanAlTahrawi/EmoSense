import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FullScreenLoader } from '../common/FullScreenLoader';

export function ProtectedRoute() {
  const { status, sessionExpired } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader label="Restoring your session…" />;
  if (status !== 'authenticated') {
    return <Navigate to={sessionExpired ? '/session-expired' : '/login'} replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}