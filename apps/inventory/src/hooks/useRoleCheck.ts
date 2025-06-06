import { useAuth } from "@clerk/nextjs";

/**
 * Custom hook to check if the current user has a specific role.
 * Leverages Clerk's useAuth hook to access session claims.
 * Assumes 'role' is a custom claim potentially added to the session token,
 * defined via declaration merging in a .d.ts file.
 *
 * @returns {object} An object containing:
 *  - `isLoaded`: Boolean indicating if Clerk auth state has loaded.
 *  - `hasRole`: Function to check if the user has the specified role.
 *               Returns `false` if auth is loading, user is not signed in,
 *               or user does not have the role.
 */
export const useRoleCheck = () => {
  // Get claims directly from useAuth
  const { isLoaded, isSignedIn, sessionClaims } = useAuth();

  /**
   * Checks if the signed-in user has the specified role.
   *
   * @param {string} role - The role to check for (e.g., 'admin').
   * @returns {boolean} True if the user is loaded, signed in, and has the role, false otherwise.
   */
  const hasRole = (role: string): boolean => {
    // Only need to check loading and signed-in status based on linter feedback
    if (!isLoaded || !isSignedIn) {
      return false;
    }

    // Access 'role' directly. TypeScript should now recognize it
    // due to the declaration merging in clerk.d.ts.
    // Use optional chaining for safety, in case the claim wasn't added correctly
    return sessionClaims.metadata.role === role;
  };

  return { isLoaded, hasRole };
};
