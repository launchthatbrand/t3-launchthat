import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    // POSTGRES_URL: z.url(),
    TRADERLAUNCHPAD_DEFAULT_ORG_ID: z.string().min(1),
    // Default tenant slug used for local dev fallback when return_to is bare localhost.
    // Mirrors Portal’s PORTAL_TENANT_SLUG behavior.
    // TraderLaunchpad: "platform" represents the apex/global experience.
    TRADERLAUNCHPAD_DEFAULT_TENANT_SLUG: z.string().min(1).default("platform"),
    TRADELOCKER_SECRETS_KEY: z.string().min(1),
    TRADELOCKER_TOKEN_STORAGE: z.enum(["raw", "enc"]).default("raw"),
    // Optional: TradeLocker developer program key (improves rate limits / access on some endpoints).
    // Keep this server-only.
    TRADELOCKER_DEVELOPER_API_KEY: z.string().min(1).optional(),

    // Server-minted Convex token support (Portal-style tenant auth).
    // Optional until fully rolled out; `/api/convex-token` returns 503 if not configured.
    LAUNCHTHAT_JWT_ISSUER_DOMAIN: z.string().url().optional(),
    LAUNCHTHAT_JWT_AUDIENCE: z.string().min(1).optional(),
    LAUNCHTHAT_JWT_KID: z.string().min(1).optional(),
    LAUNCHTHAT_JWT_PRIVATE_KEY: z.string().min(1).optional(),

    // Web Push (server-side): VAPID private key used to sign push requests.
    // Optional so Convex/CI environments can run without push configured.
    VAPID_PRIVATE_KEY: z.string().min(1).optional(),
    DISCORD_GLOBAL_CLIENT_ID: z.string().min(1).optional(),
  },

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string().url().optional(),
    NEXT_PUBLIC_ROOT_DOMAIN: z
      .string()
      .min(1)
      .optional()
      .default("traderlaunchpad.com"),

    // Web Push (client-side): VAPID public key used for PushManager.subscribe().
    // Optional so environments without push configured still run.
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,

    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
