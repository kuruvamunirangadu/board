'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorCorrelationId: string;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
    errorCorrelationId: '',
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const correlationId = `ERR-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
      errorCorrelationId: correlationId,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log structured error without exposing secrets
    console.error(`[VisiOS ErrorBoundary] CorrelationID: ${this.state.errorCorrelationId}`, {
      message: error.message,
      componentStack: errorInfo.componentStack?.slice(0, 500),
    });
  }

  private handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      errorMessage: '',
      errorCorrelationId: '',
      showDetails: false,
    });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-slate-950/90 p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/40 bg-red-950/60 shadow-[0_0_20px_rgba(239,68,68,0.25)] mb-4">
            <AlertOctagon className="h-7 w-7 text-red-400" />
          </div>

          <h2 className="text-lg font-bold tracking-wide text-white">
            {this.props.fallbackTitle || 'VisiOS Workspace Encountered an Issue'}
          </h2>

          <p className="mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
            The visual operating environment protected your saved records and isolated the component error.
          </p>

          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-[11px] font-mono text-slate-400">
            Correlation ID: <span className="text-red-300 font-bold">{this.state.errorCorrelationId}</span>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/30 px-4 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-600/50 transition-colors shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Workspace Safely
            </button>

            <button
              onClick={this.handleReload}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              Reload Application
            </button>
          </div>

          {/* Collapsible diagnostic details for dev mode */}
          <div className="mt-6">
            <button
              onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              className="text-[10px] text-slate-500 hover:text-slate-400 underline"
            >
              {this.state.showDetails ? 'Hide Diagnostics' : 'Show Diagnostic Details'}
            </button>

            {this.state.showDetails && (
              <div className="mt-2 max-w-lg rounded-lg border border-slate-800 bg-slate-950 p-3 text-left font-mono text-[10px] text-slate-400 break-words">
                <div className="text-red-400 font-bold mb-1">Error Message:</div>
                <div>{this.state.errorMessage}</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

