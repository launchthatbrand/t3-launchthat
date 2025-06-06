# Monday.com Authentication Integration

This document explains how the authentication flow works between Monday.com, Clerk, and Convex in the Inventory application.

## Architecture Overview

The authentication flow involves three main systems:

1. **Monday.com**: Provides user context via their SDK when the app is embedded in a Monday.com iframe
2. **Clerk**: Handles user authentication and session management
3. **Convex**: Backend for secure operations and data storage

## Authentication Flow

### Step 1: Monday Context Detection

When a user accesses the application within a Monday.com iframe, the system detects the Monday context using the `useMondayContext` hook, which provides:

- Board ID
- Workspace ID
- Location information
- Theme configuration

This is handled in `hooks/useMondayContext.ts`.

### Step 2: Monday User Identification

Once the Monday context is detected, the application uses the Monday.com SDK to fetch the user's information:

```typescript
// Query the Monday.com API to get the current user's information
window.monday.api(`query { me { id name email title photo_thumb_small } }`);
```

This retrieves the user's:

- Email address
- Name
- User ID
- Title
- Profile picture

### Step 3: Secure Authentication

The user information is sent to a secure Convex action (`convex/auth/mondayAuth.ts`) that:

1. Validates the Monday context
2. Creates a secure JWT token
3. Returns the token to the client

This is more secure than doing the authentication entirely client-side because:

- The validation happens server-side
- No secrets are exposed to the client
- The token is signed server-side

### Step 4: Clerk Integration

The user's email from Monday.com is used to authenticate with Clerk. We attempt multiple strategies in order:

```typescript
// First try email link authentication
try {
  await signIn.create({
    strategy: "email_link",
    identifier: mondayUser.email,
  });
} catch (error) {
  // Fall back to password strategy if email link fails
  try {
    await signIn.create({
      strategy: "password",
      identifier: mondayUser.email,
      password: `monday-${mondayUser.id}`, // Demo only
    });
  } catch (altError) {
    // Handle fallback failure
  }
}
```

**Note on Clerk Authentication Strategies:**

Clerk supports several authentication strategies:

- `email_link`: Sends a magic link email to the user
- `password`: Uses traditional username/password
- `oauth_[provider]`: For OAuth providers (e.g., `oauth_google`)
- `web3`: For blockchain-based authentication
- `ticket`: For authenticating with a pre-issued ticket

In a production environment, you should:

1. Set up a Clerk webhook to create users from Monday.com
2. Use JWT authentication for seamless sign-in
3. Create custom authentication flows for Monday.com users

## Implementation Details

### Key Components

1. **useMondayContext.ts**: Hook for detecting Monday.com context
2. **mondayAuth.ts (client)**: Client-side function to authenticate with Monday
3. **mondayAuth.ts (convex)**: Server-side action to securely validate Monday users
4. **ConvexUserEnsurer.tsx**: Component that orchestrates the authentication flow
5. **AuthProtector.tsx**: Component for protecting routes based on authentication state

### Displaying Monday Context

When a user is not authenticated but is within a Monday.com iframe, the application displays the detected Monday context information to help with debugging:

```
Monday.com Context Detected
Board ID: 9292172416
Workspace ID: 4669533
User Information:
Desmond Tatilian
desmond.tatilian@qcausa.com
Web Developer / Network Analyst
```

This helps verify that the Monday.com integration is working correctly.

## Production Recommendations

For a production environment, consider the following improvements:

1. Use a proper JWT library (like `jsonwebtoken`) in the Convex action
2. Implement server-side verification of Monday.com sessions
3. Configure Clerk to use JWT authentication for seamless sign-in
4. Add proper error handling and retries
5. Implement access control based on Monday.com workspace/board permissions
6. Set up audit logging for security monitoring

## Troubleshooting

If authentication isn't working:

1. Check browser console logs for errors
2. Verify that the Monday.com SDK is loaded properly
3. Ensure the user has appropriate permissions in Monday.com
4. Check that Clerk is configured correctly for the authentication strategy
5. Verify that the Convex action is being called successfully

### Common Clerk Authentication Errors

- **Invalid strategy**: Ensure you're using a strategy that's enabled in your Clerk instance

  - Error: `email_code does not match one of the allowed values for parameter strategy`
  - Solution: Check available strategies in your Clerk dashboard and use one that's enabled

- **User not found**: If the Monday.com user's email doesn't exist in Clerk

  - Solution: Set up a webhook to auto-create users or implement a user creation flow

- **Missing permissions**: If the Clerk instance doesn't have the right permissions
  - Solution: Configure the correct permissions in the Clerk dashboard
