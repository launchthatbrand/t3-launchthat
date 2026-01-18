import "~/app/styles.css";

import { DottedGlowBackground, cn } from "@acme/ui";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";

import { GridLines } from "~/components/background/GridLines";
import { Providers } from "./providers";
import { Toaster } from "@acme/ui/toast";
import { env } from "~/env";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://turbo.t3.gg"
      : "http://localhost:3000",
  ),
  title: "Create T3 Turbo",
  description: "Simple monorepo with shared backend for web & mobile apps",
  openGraph: {
    title: "Create T3 Turbo",
    description: "Simple monorepo with shared backend for web & mobile apps",
    url: "https://create-t3-turbo.vercel.app",
    siteName: "Create T3 Turbo",
  },
  twitter: {
    card: "summary_large_image",
    site: "@jullerino",
    creator: "@jullerino",
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

export default function RootLayout(props: { children: React.ReactNode }) {
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

              {/* Architectural Curve */}
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
              <GridLines />
            </div>
            <div className="flex-1 flex w-full">{props.children}</div>
            <div className="absolute right-4 bottom-4">
              <ThemeToggle />
            </div>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
