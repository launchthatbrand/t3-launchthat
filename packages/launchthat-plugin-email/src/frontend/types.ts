"use client";

export type EmailDomainStatus = "unconfigured" | "pending" | "verified" | "error";

export type DnsRecord = { type: string; name: string; value: string };

export type EmailSettings = {
  enabled: boolean;
  fromName: string;
  fromMode: "portal" | "custom";
  fromLocalPart: string;
  replyToEmail: string | null;
  designKey?: "clean" | "bold" | "minimal";
};

export type EmailPluginFrontendApi = {
  queries: {
    getEmailSettings: any;
    getEmailDomain: any;
    listOutbox?: any;
  };
  mutations: {
    upsertEmailSettings: any;
    setEmailDomain: any;
    enqueueTestEmail: any;
  };
  actions: {
    syncEmailDomain: any;
  };
};

export type EmailSettingsPanelProps = {
  api: EmailPluginFrontendApi;
  orgId: string | null;
};

