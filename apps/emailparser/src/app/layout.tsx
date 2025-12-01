import "~/app/globals.css";

import type { Metadata, Viewport } from "next";
// import Link from "next/link";
// // Import the CartDropdown component
// import { CartDropdown } from "launchthat-plugin-commerce/components";
// import { NotificationIcon } from "@/components/notifications/NotificationIcon";
// Import Clerk components
// import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

// Import the Providers component
// import { Providers } from "~/app/providers";
// import { InvitationBadge } from "~/components/groups/InvitationBadge";
import type { NavItem } from "@acme/ui";
import { Button, cn, SidebarInset, SiteHeader } from "@acme/ui";
import StandardLayout from "@acme/ui/layout/StandardLayout";
import { AppSidebar } from "@acme/ui/sidebar-layout/app-sidebar";

import { Providers } from "./providers";

// ThemeProvider, ThemeToggle, Toaster are now handled in Providers
// ConvexProvider, ConvexReactClient are now handled in Providers

// Metadata for the app
export const metadata: Metadata = {
  title: "Portal",
  description: "Your learning portal",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "WSA App",
    description: "Learning Management and E-commerce Platform",
  },
  twitter: {
    card: "summary_large_image",
    site: "@yourtwitterhandle", // TODO: Update Twitter handle
    creator: "@yourtwitterhandle", // TODO: Update Twitter handle
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const headerNavItems: NavItem[] = [
  { title: "Groups", url: "/groups" },
  { title: "Downloads", url: "/downloads" },
  { title: "Store", url: "/store" },
  { title: "Invitations", url: "/invitations" },
  { title: "Cart", url: "/cart" },
  { title: "User", url: "/user" },
];

const sidebarNavItems: NavItem[] = [
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <Providers>
          <StandardLayout
            appName="Email Parser"
            sidebar={props.sidebar}
            header={props.header}
            // topbar={true}
            sidebarVariant="inset"
          >
            {props.children}
          </StandardLayout>
        </Providers>
      </body>
    </html>
  );
}

function Package2Icon(props: React.SVGProps<SVGSVGElement>) {
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
