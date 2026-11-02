import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Notice } from '../common/Notice';

/** Shown only when Supabase Auth isn't configured (e.g. in a design preview). */
export function AuthConfigNotice() {
  const { isConfigured, startDemo } = useAuth();
  const navigate = useNavigate();
  if (isConfigured) return null;
  return (
    <Notice
      tone="integration"
      title="Sign-in isn't connected in this preview"
      className="mb-6"
      action={
      <button
        type="button"
        className="btn btn-secondary h-9"
        onClick={() => {
          startDemo();
          navigate('/app');
        }}>
        
          Explore with sample data
        </button>
      }>
      
      Set <code className="font-mono text-xs">VITE_SUPABASE_URL</code> and <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> to enable real accounts. The preview uses clearly labeled sample data and never runs model inference.
    </Notice>);

}