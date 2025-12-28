// import "@acme/ui/globals.css";
import "./globals.css";

import { headers } from "next/headers";
import { api } from "@/convex/_generated/api";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { fetchQuery } from "convex/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { cn } from "@acme/ui";
import StandardLayout from "@acme/ui/layout/StandardLayout";

import { NotificationIcon } from "~/components/notifications/NotificationIcon";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
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
  footer: React.ReactNode;
}) {
  const headerList = await headers();
  const pathnameHeader = headerList.get("x-pathname");
  const pathname =
    typeof pathnameHeader === "string" && pathnameHeader.length > 0
      ? pathnameHeader
      : "/";
  const firstSegment = pathname.replace(/^\/+/, "").split("/")[0] ?? "";

  const tenant = await getActiveTenantFromHeaders();
  const appName = tenant?.name ?? "Portal";
  const organizationId = getTenantOrganizationId(tenant);

  const postTypeBySingleSlug =
    firstSegment.length > 0
      ? await fetchQuery(api.core.postTypes.queries.getBySingleSlugKey, {
          singleSlugKey: firstSegment,
          ...(organizationId ? { organizationId } : {}),
        })
      : null;

  const pageTemplateSlug =
    postTypeBySingleSlug &&
    typeof (postTypeBySingleSlug as { pageTemplateSlug?: unknown })
      .pageTemplateSlug === "string"
      ? (postTypeBySingleSlug as { pageTemplateSlug: string }).pageTemplateSlug
      : "default";

  const isCanvas = pageTemplateSlug === "canvas";

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
            sidebar={isCanvas ? undefined : props.sidebar}
            header={isCanvas ? null : props.header}
            footer={isCanvas ? null : props.footer}
            sidebarVariant="inset"
            showSidebar={!isCanvas}
            headerRightSlot={<NotificationIcon />}
          >
            {props.children}
          </StandardLayout>
        </Providers>
      </body>
    </html>
  );
}
