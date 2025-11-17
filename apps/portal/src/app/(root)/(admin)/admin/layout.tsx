import React, { Suspense } from "react";

import Providers from "./providers";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Suspense fallback={<div className="p-4">Loading…</div>}>
        {children}
      </Suspense>
    </Providers>
  );
}

export default layout;
