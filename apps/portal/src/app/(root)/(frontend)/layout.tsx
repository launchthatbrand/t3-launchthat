import type { ReactNode } from "react";

import { ProtectedPage } from "~/components/access/ProtectedContent";

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return <ProtectedPage>{children}</ProtectedPage>;
}
