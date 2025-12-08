"use client";

import { PlansManager } from "launchthat-plugin-commerce/components";

import { AdminLayoutContent, AdminLayoutMain } from "../../ui/AdminLayout";

export default function StorePlansPage() {
  return (
    <AdminLayoutContent withSidebar={false}>
      <AdminLayoutMain className="container py-6">
        <PlansManager />
      </AdminLayoutMain>
    </AdminLayoutContent>
  );
}
