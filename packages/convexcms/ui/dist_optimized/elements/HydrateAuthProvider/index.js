"use client";

import { useEffect } from "react";
import { useAuth } from "../../providers/Auth/index.js";
export function HydrateAuthProvider({
  permissions
}) {
  const {
    setPermissions
  } = useAuth();
  useEffect(() => {
    setPermissions(permissions);
  }, [permissions, setPermissions]);
  return null;
}
//# sourceMappingURL=index.js.map