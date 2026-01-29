import * as React from "react";

const DEFAULT_NEWS_BASE = "https://traderlaunchpad.com";

export const useTdrLpWidgetTheme = () => {
  // Avoid hydration mismatch: keep initial SSR + client render identical,
  // then update to the real origin after mount.
  const [newsBase, setNewsBase] = React.useState(DEFAULT_NEWS_BASE);

  const [widgetStyle, setWidgetStyle] = React.useState<Record<string, string>>(() => ({
    "--tdrlp-bg": "#ffffff",
    "--tdrlp-fg": "#0f172a",
    "--tdrlp-muted": "#475569",
    "--tdrlp-border": "#e2e8f0",
    "--tdrlp-accent": "#2563eb",
    "--tdrlp-radius": "12px",
    "--tdrlp-font":
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  }));

  React.useEffect(() => {
    setNewsBase(window.location.origin);

    const root = document.documentElement;

    const computeWidgetStyleFromTheme = () => {
      const cs = getComputedStyle(root);
      const colorFromVar = (varName: string, fallback: string) => {
        const v = cs.getPropertyValue(varName).trim();
        if (!v) return fallback;
        // Tailwind themes may store colors as raw HSL components ("0 0% 100%")
        // OR as a full color function ("oklch(...)", "lab(...)", "rgb(...)") or hex.
        if (v.includes("(") || v.startsWith("#")) return v;
        return `hsl(${v})`;
      };
      const pxOr = (varName: string, fallback: string) => {
        const v = cs.getPropertyValue(varName).trim();
        return v || fallback;
      };

      setWidgetStyle({
        "--tdrlp-bg": colorFromVar("--background", "#ffffff"),
        "--tdrlp-fg": colorFromVar("--foreground", "#0f172a"),
        "--tdrlp-muted": colorFromVar("--muted-foreground", "#475569"),
        "--tdrlp-border": colorFromVar("--border", "#e2e8f0"),
        "--tdrlp-accent": colorFromVar("--primary", "#2563eb"),
        "--tdrlp-radius": pxOr("--radius", "12px"),
        "--tdrlp-font":
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      });
    };

    // Initial compute (after mount).
    computeWidgetStyleFromTheme();

    // Recompute when theme toggles (typically `html.classList` changes to include/remove `dark`).
    let raf = 0;
    const schedule = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        computeWidgetStyleFromTheme();
      });
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes") {
          schedule();
          return;
        }
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return { newsBase, widgetStyle };
};

