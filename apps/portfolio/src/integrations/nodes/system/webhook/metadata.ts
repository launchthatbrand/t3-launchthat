import type { NodeMetadata } from "@acme/integration-sdk";

export const webhookMetadata: NodeMetadata = {
  id: "system.webhook",
  name: "Webhook",
  description:
    "Send HTTP requests to external URLs with signature verification and rate limiting",
  type: "system",
  category: "network",
  version: "1.0.0",
  icon: "Globe",
  color: "#3B82F6",
};
