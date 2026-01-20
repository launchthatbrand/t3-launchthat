import { Suspense } from "react";
import AdminSettingsClientPage from "./page.client";

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={null}>
      <AdminSettingsClientPage />
    </Suspense>
  );
}
