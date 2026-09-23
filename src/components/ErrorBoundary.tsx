import { Component, type ReactNode, type ErrorInfo } from "react";
import * as Sentry from "@sentry/react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Send to Sentry if initialised. No-op otherwise.
    try {
      Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
      });
    } catch {
      /* Sentry not initialised — safe to ignore */
    }
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  private reload = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#f4f6fb",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#fff",
            border: "1px solid #e6ebf2",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 20px 50px -20px rgba(15,23,42,.25)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#fef2f2",
              color: "#ef4444",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-.4px",
              marginBottom: 8,
              color: "#0f172a",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: 22,
            }}
          >
            An unexpected error occurred on this page. The issue has been logged
            and our team will look into it. You can try reloading or return to
            the dashboard.
          </p>

          {this.state.error && (
            <details
              style={{
                textAlign: "left",
                background: "#f8fafc",
                border: "1px solid #e6ebf2",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 11.5,
                color: "#64748b",
                marginBottom: 18,
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                Technical details
              </summary>
              <pre
                style={{
                  marginTop: 8,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 11,
                }}
              >
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={this.reload}
              style={{
                padding: "9px 16px",
                borderRadius: 9,
                border: "1px solid #e6ebf2",
                background: "#fff",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload page
            </button>
            <button
              onClick={this.goHome}
              style={{
                padding: "9px 16px",
                borderRadius: 9,
                border: "none",
                background: "#4f46e5",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}