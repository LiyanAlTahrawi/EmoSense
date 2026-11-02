import { useOutletContext } from 'react-router-dom';

export interface ShellContext {
  openNav: () => void;
}

export function useShell(): ShellContext {
  return useOutletContext<ShellContext>();
}