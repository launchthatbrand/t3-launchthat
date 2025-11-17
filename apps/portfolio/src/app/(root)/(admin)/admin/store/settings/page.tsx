"use client";

import React from "react";

import {
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
} from "~/components/admin/AdminLayout";
import { StoreSettingsForm } from "~/components/admin/StoreSettingsForm";

export default function StoreSettingsPage() {
  return (
    <AdminLayoutContent withSidebar={false}>
      <AdminLayoutMain className="container py-6">
        <StoreSettingsForm />
      </AdminLayoutMain>
    </AdminLayoutContent>
  );
}
