import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * SioLogic/Donjo themed Error Boundary.
 * Catches React render errors and shows a styled fallback instead of white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-[hsl(210,40%,98%)] p-4">
          <div className="neo-pressed rounded-[2px] p-6 lg:p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="neo-subtle rounded-[2px] p-3">
                <AlertTriangle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-charcoal mb-2">Something went wrong</h2>
            <p className="text-sm text-cool-grey mb-6">
              We hit a snag loading this page. Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              className="neo-extruded px-6 py-3 rounded-[2px] font-medium text-charcoal hover:shadow-neo-pressed transition-all duration-300 pointer-events-auto"
            >
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try again
              </span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
