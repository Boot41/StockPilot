import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    console.error('ErrorBoundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="error-message">Something went wrong! Please try again later.</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
