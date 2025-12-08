"use client";

import React from "react";

import { StoreSettingsForm } from "../../components/settings/StoreSettingsForm";
import {
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
} from "../../ui/AdminLayout";

export default function StoreSettingsPage() {
  return (
    <AdminLayoutContent withSidebar={false}>
      <AdminLayoutMain className="container py-6">
        <StoreSettingsForm />
      </AdminLayoutMain>
    </AdminLayoutContent>
  );
}
