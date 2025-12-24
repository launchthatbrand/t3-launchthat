import "~/app/globals.css";

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { fetchQuery } from "convex/nextjs";

import { api } from "@/convex/_generated/api";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { SEO_OPTION_KEYS } from "~/lib/seo/constants";

// Metadata for the app
const getRequestOriginFromHeaders = (headerList: Headers): string | null => {
  const forwardedProto = headerList.get("x-forwarded-proto");
  const proto = forwardedProto?.split(",")[0]?.trim() || "https";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return null;
  return `${proto}://${host}`;
};

export async function generateMetadata(): Promise<Metadata> {
  const headerList: Headers = await headers();
  const origin = getRequestOriginFromHeaders(headerList) ?? "https://localhost";

  const tenant = await getActiveTenantFromHeaders();
  const organizationId = getTenantOrganizationId(tenant);

  const generalOption = await fetchQuery(api.core.options.get, {
    metaKey: SEO_OPTION_KEYS.general,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);
  const socialOption = await fetchQuery(api.core.options.get, {
    metaKey: SEO_OPTION_KEYS.social,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);

  const general =
    generalOption?.metaValue && typeof generalOption.metaValue === "object"
      ? (generalOption.metaValue as Record<string, unknown>)
      : null;
  const social =
    socialOption?.metaValue && typeof socialOption.metaValue === "object"
      ? (socialOption.metaValue as Record<string, unknown>)
      : null;

  const siteTitle =
    (typeof general?.siteTitle === "string" && general.siteTitle.trim()) ||
    tenant?.name ||
    "Portal";
  const siteDescription =
    (typeof general?.siteDescription === "string" &&
      general.siteDescription.trim()) ||
    "Your learning portal";

  const enableSocialMeta =
    typeof social?.enableSocialMeta === "boolean" ? social.enableSocialMeta : true;
  const twitterUsername =
    typeof social?.twitterUsername === "string" ? social.twitterUsername : undefined;
  const twitterCardType =
    typeof social?.twitterCardType === "string"
      ? (social.twitterCardType as
          | "summary"
          | "summary_large_image"
          | "app"
          | "player")
      : "summary_large_image";

  return {
    title: siteTitle,
    description: siteDescription,
    metadataBase: new URL(origin),
    ...(enableSocialMeta
      ? {
          openGraph: {
            title: siteTitle,
            description: siteDescription,
          },
          twitter: {
            card: twitterCardType,
            ...(twitterUsername
              ? { site: twitterUsername, creator: twitterUsername }
              : {}),
          },
        }
      : {}),
    icons: [{ rel: "icon", url: "/favicon.ico" }],
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const _headerNavItems = [
  { title: "Groups", url: "/groups" },
  { title: "Downloads", url: "/downloads" },
  { title: "Store", url: "/store" },
  { title: "Invitations", url: "/invitations" },
  { title: "Cart", url: "/cart" },
  { title: "User", url: "/user" },
];

const _sidebarNavItems = [
  { title: "Groups", url: "/groups" },
  { title: "Downloads", url: "/downloads" },
  { title: "Store", url: "/store" },
  { title: "Invitations", url: "/invitations" },
  { title: "Cart", url: "/cart" },
  { title: "User", url: "/user" },
];

export default function RootLayout(props: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
}) {
  return <>{props.children}</>;
}

function _Package2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
      <path d="M12 3v6" />
    </svg>
  );
}
