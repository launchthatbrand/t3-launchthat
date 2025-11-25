import React, { Suspense } from "react";

import { Providers } from "~/app/providers";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      {children}
    </Suspense>
  );
}

export default layout;
