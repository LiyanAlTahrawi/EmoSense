import React from 'react';
import { Link } from 'react-router-dom';
import { LockKeyholeIcon } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { StatusScreen } from '../components/common/StatusScreen';

export function UnauthorizedPage() {
  useDocumentTitle('Access denied');
  return (
    <StatusScreen
      icon={LockKeyholeIcon}
      title="You don't have access to this"
      description="This content belongs to a different account, or you don't have permission to view it. Only your own conversations are ever shown to you."
      actions={
      <>
          <Link to="/app" className="btn btn-primary btn-lg">Go to my conversations</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Switch account</Link>
        </>
      } />);


}