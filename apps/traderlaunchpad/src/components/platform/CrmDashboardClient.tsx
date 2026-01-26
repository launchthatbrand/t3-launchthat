"use client";

import { CrmDashboard } from "launchthat-plugin-crm/frontend";
import { api } from "@convex-config/_generated/api";

export const CrmDashboardClient = () => {
  return (
    <CrmDashboard
      metricsQuery={api.platform.crm.getCrmDashboardMetrics}
      contactsHref="/platform/crm/contacts"
      joinCodesHref="/platform/crm/joincodes"
    />
  );
};
