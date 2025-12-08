/**
 * Node type used in the integrations connection table for storing
 * organization-specific OpenAI credentials that power the support agent.
 */
export const SUPPORT_OPENAI_NODE_TYPE = "openai";

/**
 * Normalize the connection owner key for storing/retrieving OpenAI credentials.
 * We namespace it so different plugins (or even future assistants) can coexist
 * without clobbering each other's secrets.
 */
export const buildSupportOpenAiOwnerKey = (organizationId: string) =>
  `${SUPPORT_OPENAI_NODE_TYPE}:support:${organizationId}`;
