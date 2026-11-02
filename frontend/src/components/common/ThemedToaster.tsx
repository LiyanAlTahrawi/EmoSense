import React from 'react';
import { Toaster } from 'sonner';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="bottom-center"
      toastOptions={{
        style: {
          background: 'rgb(var(--surface))',
          color: 'rgb(var(--ink))',
          border: '1px solid rgb(var(--line))',
          borderRadius: '0.875rem'
        }
      }} />);


}