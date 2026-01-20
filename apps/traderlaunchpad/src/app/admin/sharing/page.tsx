import { Suspense } from "react";
import AdminSharingClientPage from "./page.client";

export default function AdminSharingPage() {
  // Next.js (App Router) requires a Suspense boundary around client components
  // that may trigger a CSR bailout (e.g. via useSearchParams in the route tree).
  return (
    <Suspense fallback={null}>
      <AdminSharingClientPage />
    </Suspense>
  );
}

