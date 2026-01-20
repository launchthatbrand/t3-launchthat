import { Suspense } from "react";
import OAuthAuthorizeClientPage from "./page.client";

export default function OAuthAuthorizePage() {
  return (
    <Suspense fallback={null}>
      <OAuthAuthorizeClientPage />
    </Suspense>
  );
}

