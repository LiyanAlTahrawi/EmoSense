import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClockIcon } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { StatusScreen } from '../components/common/StatusScreen';

export function SessionExpiredPage() {
  useDocumentTitle('Session ended');
  const location = useLocation();
  const from = (location.state as {from?: string;} | null)?.from;
  return (
    <StatusScreen
      icon={ClockIcon}
      title="Your session has ended"
      description="For your privacy, you've been signed out. Your conversations are safely saved to your account — log in again to pick up where you left off."
      actions={
      <>
          <Link to="/login" state={{ from }} className="btn btn-primary btn-lg">Log in again</Link>
          <Link to="/" className="btn btn-secondary btn-lg">Go to home</Link>
        </>
      } />);


}