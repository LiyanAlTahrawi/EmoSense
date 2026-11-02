import React from 'react';
import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { StatusScreen } from '../components/common/StatusScreen';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <StatusScreen
      icon={CompassIcon}
      eyebrow="404"
      title="We couldn't find that page"
      description="The link may be broken, or the page may have moved. Let's get you back somewhere familiar."
      actions={
      <>
          <Link to="/app" className="btn btn-primary btn-lg">Open EmoSense</Link>
          <Link to="/" className="btn btn-secondary btn-lg">Go to home</Link>
        </>
      } />);


}