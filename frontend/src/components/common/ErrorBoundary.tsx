import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{children: React.ReactNode;}, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-canvas px-6" role="alert">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold text-ink">EmoSense hit an unexpected problem</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your saved conversations are safe in your account. Reloading the page usually fixes this.
          </p>
          <button type="button" className="btn btn-primary mt-6" onClick={() => window.location.reload()}>
            Reload EmoSense
          </button>
        </div>
      </div>);

  }
}