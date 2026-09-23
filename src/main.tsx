import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { LookupsProvider } from "./contexts/LookupsContext";
import { ToastProvider } from "./contexts/ToastContext";
import { queryClient } from "./lib/queryClient";
import { initSentry } from "./lib/sentry";
import "./index.css";

// Init Sentry first so it can capture errors from the whole app.
initSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <LookupsProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </LookupsProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);