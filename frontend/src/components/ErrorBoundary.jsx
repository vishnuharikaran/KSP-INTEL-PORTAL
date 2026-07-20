import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px',
          textAlign: 'center',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '32px 40px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--red)',
            borderRadius: '10px',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px',
              letterSpacing: '2px',
              color: 'var(--red)',
              marginBottom: '12px'
            }}>
              ⚠ PAGE ERROR
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              marginBottom: '20px'
            }}>
              Component failed to render.
              {this.state.error && (
                <div style={{
                  marginTop: '12px',
                  color: 'var(--red)',
                  fontSize: '11px',
                  textAlign: 'left',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  background: '#070a12',
                  padding: '10px',
                  border: '1px solid rgba(255, 45, 85, 0.25)',
                  borderRadius: '6px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'JetBrains Mono, monospace',
                  wordBreak: 'break-all'
                }}>
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.error.stack && "\n\nStack:\n" + this.state.error.stack.split("\n").slice(0, 4).join("\n")}
                </div>
              )}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: '8px 20px',
                background: 'transparent',
                border: '1px solid var(--cyan)',
                color: 'var(--cyan)',
                cursor: 'pointer',
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
                letterSpacing: '1px'
              }}
            >
              RETRY
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
