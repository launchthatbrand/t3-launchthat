import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "edge";

function clampTitle(input: string): string {
  const value = input.trim().replace(/\s+/g, " ");
  if (!value) return "Untitled";
  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
}

function clampSite(input: string): string {
  const value = input.trim().replace(/\s+/g, " ");
  if (!value) return "LaunchThat";
  return value.length > 40 ? `${value.slice(0, 37)}...` : value;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const title = clampTitle(url.searchParams.get("title") ?? "");
    const site = clampSite(url.searchParams.get("site") ?? "");
    const label = (url.searchParams.get("label") ?? "").trim();
    const bg = (url.searchParams.get("bg") ?? "").trim();
    const bgUrl = /^https?:\/\//i.test(bg) ? bg : "";

    const size = { width: 1200, height: 630 };

    let bgImageData: ArrayBuffer | null = null;
    if (bgUrl) {
      try {
        const bgParsed = new URL(bgUrl);
        const requestHost = req.headers.get("host") ?? "";

        // Local dev: *.localhost often doesn't resolve in server-side fetch.
        // Rewrite to 127.0.0.1 while preserving tenant routing via Host header.
        let fetchUrl = bgUrl;
        const headers = new Headers();
        headers.set("x-seo-inspector", "1");

        if (bgParsed.hostname.endsWith(".localhost")) {
          const port = bgParsed.port ? `:${bgParsed.port}` : "";
          fetchUrl = `${bgParsed.protocol}//127.0.0.1${port}${bgParsed.pathname}${bgParsed.search}`;
          if (requestHost) headers.set("Host", requestHost);
        }

        const response = await fetch(fetchUrl, { headers });
        if (response.ok) {
          bgImageData = await response.arrayBuffer();
        }
      } catch {
        bgImageData = null;
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            padding: 64,
            background:
              "radial-gradient(1200px 630px at 10% 10%, rgba(99,102,241,0.35), rgba(0,0,0,0)), radial-gradient(900px 630px at 90% 20%, rgba(236,72,153,0.25), rgba(0,0,0,0)), linear-gradient(135deg, #0b1020, #090814)",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              borderRadius: 48,
              padding: 40,
              position: "relative",
              overflow: "hidden",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
              border: "2px solid rgba(255,255,255,0.18)",
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            {bgImageData ? (
              <img
                src={bgImageData}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.82,
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.72))",
              }}
            />
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 24,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {label ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 24,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        background: "#a78bfa",
                        boxShadow: "0 0 0 6px rgba(167,139,250,0.12)",
                      }}
                    />
                    <span>{label}</span>
                  </div>
                ) : null}

                <div
                  style={{
                    fontSize: 72,
                    lineHeight: 1.06,
                    letterSpacing: -1.5,
                    fontWeight: 800,
                    color: "white",
                  }}
                >
                  {title}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  paddingTop: 10,
                  borderTop: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background:
                        "linear-gradient(135deg, rgba(99,102,241,1), rgba(236,72,153,1))",
                      boxShadow:
                        "0 10px 30px rgba(99,102,241,0.25), 0 10px 30px rgba(236,72,153,0.22)",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.92)",
                      }}
                    >
                      {site}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        color: "rgba(255,255,255,0.72)",
                      }}
                    >
                      Powered by LaunchThat
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 16px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontSize: 18,
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  {new Date().getFullYear()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      size,
    );
  } catch {
    return new NextResponse("Failed to render OG image", { status: 500 });
  }
}


