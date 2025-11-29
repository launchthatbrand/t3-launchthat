import React, { Suspense } from "react";

import Providers from "./providers";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <Providers>{children}</Providers>
    </Suspense>
  );
}

export default layout;
