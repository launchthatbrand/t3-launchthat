// This allows us to test with a mock identity provider
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
    ...(process.env.LAUNCHTHAT_JWT_ISSUER_DOMAIN
      ? [
          {
            domain: process.env.LAUNCHTHAT_JWT_ISSUER_DOMAIN,
            applicationID: process.env.LAUNCHTHAT_JWT_AUDIENCE ?? "launchthat",
          },
        ]
      : []),
  ],
  // For development, allow unauthenticated requests
  allowUnauthenticatedRequests: true,
};
