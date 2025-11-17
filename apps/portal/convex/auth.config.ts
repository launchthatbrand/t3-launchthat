// This allows us to test with a mock identity provider
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
  // For development, allow unauthenticated requests
  allowUnauthenticatedRequests: true,
};
