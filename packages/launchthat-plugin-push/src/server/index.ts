export type WebPushPayload = {
  title: string;
  body?: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string>;
};

