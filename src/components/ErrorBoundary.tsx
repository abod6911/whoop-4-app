import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WHOOP App Uncaught Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0D10] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#16191E] border border-white/10 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#351515] border border-[#FF453A]/30 text-[#FF453A] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-xl font-black font-condensed tracking-wide uppercase text-white">
                WHOOP System Alert
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                An unexpected runtime error occurred while rendering the interface.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#0B0D10] p-3 rounded-xl border border-white/5 text-left overflow-auto max-h-36">
                <p className="text-[11px] font-mono text-[#FF453A] break-words whitespace-pre-wrap">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-white text-black font-condensed font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all hover:bg-zinc-200 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
              <button
                onClick={this.handleHardReset}
                className="py-3 px-4 rounded-xl bg-[#222730] border border-white/10 text-zinc-300 font-condensed font-bold text-xs uppercase tracking-wider hover:bg-[#2c333f] active:scale-95 transition-all"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
