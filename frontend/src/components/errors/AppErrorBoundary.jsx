import { Component } from 'react';
import { AppErrorFallback } from './AppErrorFallback';

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AppErrorBoundary]', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    const { resetKey } = this.props;
    if (resetKey !== undefined && prevProps.resetKey !== resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <AppErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          compact={this.props.compact}
          showLogo={this.props.showLogo}
        />
      );
    }
    return this.props.children;
  }
}
