"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: "#f9fafb",
          color: "#001c34",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "28rem" }}>
            <div
              style={{
                fontSize: "3.75rem",
                fontWeight: 700,
                color: "#001c34",
                marginBottom: "1.5rem",
              }}
            >
              Oops!
            </div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "#001c34",
                marginBottom: "1rem",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: "#4b5563",
                marginBottom: "2rem",
                lineHeight: 1.6,
              }}
            >
              We encountered an unexpected error. Please try again, or return to
              the homepage if the problem persists.
            </p>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={reset}
                style={{
                  backgroundColor: "#00a85b",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  padding: "0.75rem 2rem",
                  fontSize: "1rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "2px solid #00a85b",
                  color: "#00a85b",
                  backgroundColor: "transparent",
                  borderRadius: "0.375rem",
                  padding: "0.75rem 2rem",
                  fontSize: "1rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
