// Convex auth config (JWT providers).
// NOTE: Convex v1.23+ doesn't export `AuthConfig` type from `convex/server`.
export default {
  providers: [
    {
      // Clerk Issuer URL from your "convex" JWT template (e.g. `https://<clerk-domain>`).
      // Configure `CLERK_JWT_ISSUER_DOMAIN` in the Convex Dashboard env vars.
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
