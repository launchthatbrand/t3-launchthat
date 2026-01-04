import type React from "react";

import type { AccessRule } from "~/components/admin/ContentAccess";

export interface ContentAccessAdminSection {
  id: string;
  pluginId?: string;
  priority?: number;
  render: (args: {
    contentType: string;
    contentId: string;
    title?: string;
    rules: AccessRule;
    setRules: React.Dispatch<React.SetStateAction<AccessRule>>;
    disabled: boolean;
  }) => React.ReactNode;
}
