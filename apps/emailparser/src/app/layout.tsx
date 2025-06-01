import "~/app/globals.css";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { cn } from "@acme/ui";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { Providers as ConvexProviders } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://turbo.t3.gg"
      : "http://localhost:3000",
  ),
  title: "Email Parser",
  description: "Parse email content into structured data with AI",
  openGraph: {
    title: "Email Parser",
    description: "Parse email content into structured data with AI",
    url: "https://create-t3-turbo.vercel.app",
    siteName: "Email Parser",
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

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          defer
          src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.5/purify.min.js"
          integrity="sha512-KqUc2WMPF/bQ5+TdYaRKGOFgCCA/CAIJzNZBJGJiVVHHdnzXy7jyYNxxAWUScFywCYZCXDxSr3O/STgWcag2nQ=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        ></script>
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          GeistSans.variable,
          GeistMono.variable,
          inter.className,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ConvexProviders>
            <ClerkLoading>
              <div className="flex h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            </ClerkLoading>
            <ClerkLoaded>
              <TRPCReactProvider>{props.children}</TRPCReactProvider>
            </ClerkLoaded>
          </ConvexProviders>
          <div className="absolute bottom-4 right-4">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
