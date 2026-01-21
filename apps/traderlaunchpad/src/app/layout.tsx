import "~/app/styles.css";

import { DottedGlowBackground, cn } from "@acme/ui";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata, Viewport } from "next";

import { AdminFloatingDock } from "~/components/admin/AdminFloatingDock";
import { Providers } from "./providers";
import StandardLayout from "@acme/ui/layout/StandardLayout";
import { ThemeProvider } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";
import { env } from "~/env";
import { headers } from "next/headers";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://traderlaunchpad.com"
      : "http://localhost:3000",
  ),
  title: "Trader Launchpad",
  description: "Trader Launchpad - Mission Control for serious traders",
  openGraph: {
    title: "Trader Launchpad",
    description: "Trader Launchpad - Mission Control for serious traders",
    url: "https://traderlaunchpad.vercel.app",
    siteName: "Trader Launchpad",
  },
  twitter: {
    card: "summary_large_image",
    site: "@launchthat",
    creator: "@launchthat",
  },
  icons: {
    icon: '/icon.png', // Reference to the file in the public directory
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default async function RootLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
}) {
  const headerList = await headers();
  const pathnameHeader = headerList.get("x-pathname");
  const pathname =
    typeof pathnameHeader === "string" && pathnameHeader.length > 0
      ? pathnameHeader
      : "/";

  const segments = pathname
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const firstSegment = segments[0] ?? "";

  // Portal-style: decide when to show chrome.
  let showHeader = true;
  let showSidebar =
    firstSegment === "admin" || firstSegment === "platform" || firstSegment === "journal";
  const showAdminDock = firstSegment === "admin";

  // Auth routes should render as a full-screen canvas (no chrome).
  if (
    firstSegment === "sign-in" ||
    firstSegment === "sign-up" ||
    firstSegment === "sso-callback" ||
    firstSegment === "sign-out" ||
    firstSegment === "sign-in-token"
  ) {
    showHeader = false;
    showSidebar = false;
  }

  return (
    <html lang="en" suppressHydrationWarning className="bg-[#0A0A0A]">
      <body
        className={cn(
          "bg-[#0A0A0A] text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <Providers>
          <ThemeProvider>
            {/* Background */}
            <div className="pointer-events-none fixed inset-0 z-0">
              <DottedGlowBackground
                color="rgba(255, 100, 0, 0.15)"
                glowColor="rgba(255, 120, 0, 0.6)"
                gap={24}
                radius={1.5}
                speedMin={0.2}
                speedMax={0.8}
              />

              <div className="absolute top-1/4 left-1/4 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/20 blur-[140px]" />
              <div className="absolute right-0 bottom-0 h-[720px] w-[720px] translate-x-1/3 translate-y-1/3 rounded-full bg-orange-500/10 blur-[160px]" />

              <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
                preserveAspectRatio="none"
              >
                <path
                  // Upward arc (top-left → top-right), keep it subtle
                  d="M-100,1200 C200,780 620,1200 1200,380 S1780,780 2200,0"
                  fill="none"
                  stroke="url(#adminCurveGradient)"
                  strokeWidth="1"
                />
                <path
                  d="M-100,1240 C200,820 620,1240 1200,420 S1780,820 2200,40"
                  fill="none"
                  stroke="url(#adminCurveGradient)"
                  strokeWidth="1"
                  opacity="0.35"
                />
                <path
                  d="M-100,1160 C200,740 620,1160 1200,340 S1780,740 2200,-40"
                  fill="none"
                  stroke="url(#adminCurveGradient)"
                  strokeWidth="1"
                  opacity="0.2"
                />
                <defs>
                  <linearGradient
                    id="adminCurveGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="50%" stopColor="rgba(249,115,22,0.5)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                </defs>
              </svg>

            </div>

            <div className="relative z-10 min-h-screen">
              <StandardLayout
                appName="Trader Launchpad"
                sidebar={showSidebar ? props.sidebar : undefined}
                header={showHeader ? props.header : null}
                footer={null}
                sidebarVariant="inset"
                showSidebar={showSidebar}
                className="bg-transparent"
                sidebarOpenOnHover={true}
                // Admin should start collapsed on initial load.
                sidebarDefaultOpen={false}

              >
                <div className="container py-6">
                  {props.children}
                </div>
              </StandardLayout>

              {showAdminDock ? <AdminFloatingDock /> : null}
            </div>

            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
