// import "@acme/ui/globals.css";
import "./globals.css";

import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { cn } from "@acme/ui";
import StandardLayout from "@acme/ui/layout/StandardLayout";

import { Providers } from "./providers";
import { NotificationIcon } from "~/components/notifications/NotificationIcon";

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
  const appName = tenant?.name ?? "Portal";

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
            appName={appName}
            sidebar={props.sidebar}
            header={props.header}
            sidebarVariant="inset"
            headerRightSlot={<NotificationIcon />}
          >
            {props.children}
          </StandardLayout>
        </Providers>
      </body>
    </html>
  );
}
