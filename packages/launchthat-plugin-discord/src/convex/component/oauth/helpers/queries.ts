import { v } from "convex/values";

import { query } from "../../server";

export const computeAuthRedirectUri = query({
  args: {
    returnTo: v.string(),
    rootDomain: v.optional(v.string()),
    fallbackAuthHost: v.optional(v.string()),
    callbackPath: v.string(),
  },
  returns: v.object({
    redirectUri: v.string(),
    isLocal: v.boolean(),
    returnToHost: v.string(),
  }),
  handler: async (_ctx, args) => {
    let returnToUrl: URL;
    try {
      returnToUrl = new URL(args.returnTo);
    } catch {
      throw new Error("Invalid returnTo URL");
    }

    const hostname = returnToUrl.hostname.toLowerCase();
    const port = returnToUrl.port;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".127.0.0.1");

    const rootDomain = (args.rootDomain ?? "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      ?.split(":")[0];

    if (!isLocal && rootDomain && !hostname.endsWith(rootDomain)) {
      throw new Error("Invalid returnTo host");
    }

    const authHostname = isLocal
      ? `auth.${
          hostname === "127.0.0.1" || hostname.endsWith(".127.0.0.1")
            ? "127.0.0.1"
            : "localhost"
        }`
      : rootDomain
        ? `auth.${rootDomain}`
        : args.fallbackAuthHost || "auth.launchthat.app";

    const proto = isLocal ? "http" : "https";
    const origin = `${proto}://${authHostname}${isLocal && port ? `:${port}` : ""}`;

    return {
      redirectUri: `${origin}${args.callbackPath}`,
      isLocal,
      returnToHost: hostname,
    };
  },
});

