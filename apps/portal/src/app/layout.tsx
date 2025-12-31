// import "@acme/ui/globals.css";
import "./globals.css";

import type { Doc } from "@/convex/_generated/dataModel";
import { headers } from "next/headers";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { fetchQuery } from "convex/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { cn } from "@acme/ui";
import StandardLayout from "@acme/ui/layout/StandardLayout";

import { NotificationIcon } from "~/components/notifications/NotificationIcon";
import { registerPluginPageTemplates } from "~/lib/pageTemplates/registerPluginPageTemplates";
import { getPageTemplate } from "~/lib/pageTemplates/registry";
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
  // Ensure plugin-provided page templates are registered on the server.
  registerPluginPageTemplates();

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

  const tenant = await getActiveTenantFromHeaders();
  const appName = tenant?.name ?? "Portal";
  const organizationId = getTenantOrganizationId(tenant);

  // Import Convex API dynamically (typed as any) to avoid TS deep-instantiation issues
  // in this layout file.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const apiAny = ((await import("@/convex/_generated/api")) as any).api;
  // NOTE: Keep this call in an `any`-typed variable to avoid TS deep-instantiation
  // issues in this file.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const postTypeBySingleSlug: any =
    firstSegment.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        await fetchQuery(apiAny.core.postTypes.queries.getBySingleSlugKey, {
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

  const isCanvasFromPostType = pageTemplateSlug === "canvas";

  // For single-segment "pages" routes like /checkout, hide portal chrome when a page template
  // is configured that requests no header/sidebar (e.g. ecommerce checkout/cart).
  const isCanvasFromPageTemplate = (() => {
    if (segments.length !== 1) return false;
    if (!firstSegment) return false;
    // Don't interfere with admin/app routes.
    if (firstSegment === "admin") return false;
    if (firstSegment === "dashboard") return false;
    if (firstSegment === "api") return false;
    if (firstSegment === "puck") return false;

    return true;
  })();

  let showHeader = !isCanvasFromPostType;
  let showSidebar = !isCanvasFromPostType;
  let showFooter = !isCanvasFromPostType;

  if (!isCanvasFromPostType && isCanvasFromPageTemplate) {
    const slug = firstSegment;
    const pagePost = (await fetchQuery(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      apiAny.core.posts.queries.getPostBySlug,
      {
        slug,
        ...(organizationId ? { organizationId } : {}),
      },
    )) as Doc<"posts"> | null;
    if (pagePost?.postTypeSlug === "pages") {
      const meta = (await fetchQuery(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        apiAny.core.posts.postMeta.getPostMeta,
        {
          postId: pagePost._id,
          ...(organizationId ? { organizationId } : {}),
          postTypeSlug: "pages",
        },
      )) as { key: string; value?: unknown }[];

      const templateSlugRaw = meta.find(
        (entry) => entry.key === "page_template",
      )?.value;
      const templateSlug =
        typeof templateSlugRaw === "string" ? templateSlugRaw.trim() : "";

      if (templateSlug) {
        const template = getPageTemplate(templateSlug, organizationId ?? null);
        const layout = template?.layout;
        if (layout?.showHeader === false) {
          showHeader = false;
          // Portal footer is part of the standard chrome; hide it when header is hidden.
          showFooter = false;
        }
        if (layout?.showSidebar === false) {
          showSidebar = false;
        }
      }
    }
  }

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
            sidebar={showSidebar ? props.sidebar : undefined}
            header={showHeader ? props.header : null}
            footer={showFooter ? props.footer : null}
            sidebarVariant="inset"
            showSidebar={showSidebar}
            headerRightSlot={<NotificationIcon />}
          >
            {props.children}
          </StandardLayout>
        </Providers>
      </body>
    </html>
  );
}
