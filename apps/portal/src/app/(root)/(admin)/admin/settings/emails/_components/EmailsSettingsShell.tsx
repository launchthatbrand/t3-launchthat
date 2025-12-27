"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

type EmailsTab = "sender" | "templates" | "test" | "logs";

const getActiveTabFromPathname = (pathname: string): EmailsTab => {
  if (pathname.includes("/admin/settings/emails/template/")) return "templates";
  if (pathname.endsWith("/admin/settings/emails/templates")) return "templates";
  if (pathname.endsWith("/admin/settings/emails/test")) return "test";
  if (pathname.endsWith("/admin/settings/emails/logs")) return "logs";
  return "sender";
};

const getPathForTab = (tab: EmailsTab): string => {
  if (tab === "sender") return "/admin/settings/emails";
  if (tab === "templates") return "/admin/settings/emails/templates";
  if (tab === "test") return "/admin/settings/emails/test";
  return "/admin/settings/emails/logs";
};

export const EmailsSettingsShell = ({
  title = "Emails",
  description = "Configure transactional email delivery for this organization.",
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = useMemo(() => getActiveTabFromPathname(pathname), [pathname]);

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(next) => {
          router.push(getPathForTab(next as EmailsTab));
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="sender">Sender</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
      </Tabs>

      {children}
    </div>
  );
};


