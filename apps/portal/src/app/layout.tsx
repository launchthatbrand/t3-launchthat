// import "@acme/ui/globals.css";
import "./globals.css";

import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SupportChatWidget } from "launchthat-plugin-support";

import { cn } from "@acme/ui";
import StandardLayout from "@acme/ui/layout/StandardLayout";

import { AppSidebar } from "~/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { Providers } from "./providers";

// const fontSans = Geist({
//   subsets: ["latin"],
//   variable: "--font-sans",
// });

// const fontMono = Geist_Mono({
//   subsets: ["latin"],
//   variable: "--font-mono",
// });

export default async function RootLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
}) {
  const tenant = await getActiveTenantFromHeaders();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <Providers tenant={tenant}>
          <StandardLayout
            appName="Wall Street Academys"
            sidebar={props.sidebar}
            header={props.header}
            sidebarVariant="inset"
          >
            {props.children}
            <SupportChatWidget />
          </StandardLayout>
        </Providers>
      </body>
    </html>
  );
}
