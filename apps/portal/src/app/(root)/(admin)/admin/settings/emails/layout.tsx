import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";

function EmailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayout
      title="Emails"
      description="Emails settings"
      tabs={[
        {
          label: "Sender",
          value: "sender",
          href: "/admin/settings/emails",
        },
        {
          label: "Templates",
          value: "templates",
          href: "/admin/settings/emails/templates",
        },
        {
          label: "Test",
          value: "test",
          href: "/admin/settings/emails/test",
        },
        {
          label: "Logs",
          value: "logs",
          href: "/admin/settings/emails/logs",
        },
      ]}
    >
      <AdminLayoutContent>
        <AdminLayoutHeader />
        <AdminLayoutMain>
          <div className="container space-y-6 py-6">{children}</div>
        </AdminLayoutMain>
      </AdminLayoutContent>
    </AdminLayout>
  );
}

export default EmailsLayout;
