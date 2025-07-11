// import "@acme/ui/globals.css";
import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { Button, cn } from "@acme/ui";
import StandardLayout from "@acme/ui/layout/StandardLayout";

import { Providers } from "./providers";

// const fontSans = Geist({
//   subsets: ["latin"],
//   variable: "--font-sans",
// });

// const fontMono = Geist_Mono({
//   subsets: ["latin"],
//   variable: "--font-mono",
// });

export default function RootLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background py-2 font-sans text-foreground antialiased",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <Providers>
          <StandardLayout
            appName="Wall Street Academy"
            sidebar={props.sidebar}
            header={props.header}
            sidebarVariant="inset"
          >
            {props.children}
          </StandardLayout>
        </Providers>
      </body>
    </html>
  );
}
