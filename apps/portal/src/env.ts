import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";

import { authEnv } from "../../../packages/auth/env";

export const env = createEnv({
  extends: [authEnv(), vercel()],
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
    POSTGRES_URL: z.string().url(),
    AUTHORIZENET_API_LOGIN_ID: z.string(),
    AUTHORIZENET_TRANSACTION_KEY: z.string(),
    CLERK_SECRET_KEY: z.string().min(1),
    VIMEO_CLIENT_SECRET: z.string().min(1),
    VIMEO_REDIRECT_URI: z.string().url(),
    CLERK_JWT_ISSUER_DOMAIN: z.string().url(),
    OPENAI_API_KEY: z.string().min(1).optional(),
  },

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_AUTHORIZENET_CLIENTKEY: z.string().min(1),
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    NEXT_PUBLIC_CONVEX_HTTP_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_VIMEO_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,

    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR, // Example
    // Client vars
    NEXT_PUBLIC_AUTHORIZENET_CLIENTKEY:
      process.env.NEXT_PUBLIC_AUTHORIZENET_CLIENTKEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CONVEX_HTTP_URL: process.env.NEXT_PUBLIC_CONVEX_HTTP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    // Server vars like CLERK_SECRET_KEY are validated but not explicitly mapped here
    // as they are usually accessed directly by server-side libraries.
    NEXT_PUBLIC_VIMEO_CLIENT_ID: process.env.NEXT_PUBLIC_VIMEO_CLIENT_ID,
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
