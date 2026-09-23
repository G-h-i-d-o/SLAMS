import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      remove: (id: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string) => void;
  theme?: "light" | "dark" | "auto";
};

export default function TurnstileWidget({ onToken, theme = "light" }: Props) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;

    // Load the Turnstile script once
    if (!document.getElementById("cf-turnstile-script")) {
      const s = document.createElement("script");
      s.id = "cf-turnstile-script";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    function renderWidget() {
      if (!ref.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: siteKey!,
        callback: onToken,
        "error-callback": () => onToken(""),
        "expired-callback": () => onToken(""),
        theme,
      });
    }

    // If the script already loaded, render now; otherwise wait for load
    if (window.turnstile) {
      renderWidget();
    } else {
      const script = document.getElementById("cf-turnstile-script");
      script?.addEventListener("load", renderWidget);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* widget already removed */
        }
      }
    };
  }, [siteKey, onToken, theme]);

  if (!siteKey) return null;

  return <div ref={ref} style={{ marginTop: 4, marginBottom: 14 }} />;
}