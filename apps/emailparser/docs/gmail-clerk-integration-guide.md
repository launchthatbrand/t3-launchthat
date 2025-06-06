# Gmail Integration with Clerk Authentication

This document explains how to properly integrate Gmail API access with Clerk authentication in your application.

## Overview

When using Clerk for authentication and wanting to access Gmail APIs, we need to ensure that:

1. The correct OAuth scopes are requested during authentication
2. User tokens are properly extracted and used for Gmail API calls
3. The user experience is smooth when connecting Gmail

## The Core Issue: OAuth Scopes for Gmail API

The main issue with Gmail integration is that Clerk's OAuth flow with Google **doesn't automatically request Gmail API scopes** during the standard authentication. This is why you're seeing the message:

```
You're signed in with Google, but Gmail permissions are missing. Please sign out and sign in again to grant Gmail access.
```

## Solution: Configure Gmail Scopes in Clerk Dashboard

For Gmail API access to work correctly, you need to configure the OAuth scopes in the Clerk Dashboard, not just in the code. Follow these steps:

1. **Log in to the Clerk Dashboard** for your application
2. Navigate to **JWT Templates** → **OAuth Providers** → **Google**
3. In the OAuth settings, add the following scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.labels
   https://www.googleapis.com/auth/gmail.metadata
   ```
4. Save the changes

## Recommended User Flow

The recommended flow for users to connect with Gmail:

1. **Sign out completely** from the application
2. **Clear browser cookies/cache** if needed
3. **Sign in using Google** - this time, the authentication will request the Gmail API scopes
4. **Grant all permissions** when prompted by Google
5. You will be redirected to the Gmail connection page
6. Click "Sync Gmail" to fetch emails

## Alternative: Separate Auth and Gmail Connection Flows

If you prefer to keep the standard authentication separate from Gmail integration, you can:

1. Use normal Clerk authentication for application access
2. Provide a separate "Connect Gmail" button that initiates a new OAuth flow specifically requesting Gmail scopes
3. Handle the token exchange and storage for Gmail API access separately

## Implementation Notes

### Clerk Authentication Component

We use a standard Clerk authentication component:

```tsx
// For sign-in page
<SignIn />
```

### Gmail Connection Button

The `GmailSignUpButton` component attempts to authenticate with Google OAuth, but the scopes need to be configured in the Clerk Dashboard:

```tsx
await signIn.authenticateWithRedirect({
  strategy: "oauth_google" as OAuthStrategy,
  redirectUrl: "/gmail-connect",
  redirectUrlComplete: "/gmail-connect",
  // The scopes are configured in the Clerk Dashboard, not here
});
```

### Status Checking Component

The `GmailIntegration` component checks if the user has Gmail integration enabled and provides UI to sync emails.

## Handling Already Authenticated Users

For users who authenticated with Google but without Gmail scopes:

1. Inform them they need to sign out and sign in again to grant Gmail permissions
2. Provide a clear sign-out button
3. After sign-out, direct them to authenticate with Google again

## Troubleshooting

If you're still having issues with Gmail permissions:

1. **Check Clerk Configuration**: Ensure the scopes are properly configured in the Clerk Dashboard
2. **Browser Cookies**: Have users clear cookies for both your domain and accounts.google.com
3. **Incognito Mode**: Try the flow in an incognito/private window
4. **Different Google Account**: If a user has multiple Google accounts, ensure they're using the same one consistently
5. **Developer Tools**: Check the Network tab in browser developer tools to confirm the OAuth request includes the correct scopes

## Technical Background: OAuth Scopes and API Access

When a user authenticates with Google through Clerk, the process generates an OAuth token. This token is only authorized for the specific scopes requested during authentication. Gmail API operations require specific scopes that grant permission to access a user's email data.

Clerk doesn't support configuring these scopes directly in the authentication component code. Instead, they must be configured at the provider level in the Clerk Dashboard.

This is why a user who has already authenticated with Google (but without Gmail scopes) needs to sign out and authenticate again - to generate a new token with the proper scopes.

## References

1. [Clerk OAuth Documentation](https://clerk.com/docs/authentication/social-connections/oauth)
2. [Gmail API Documentation](https://developers.google.com/gmail/api/guides)
3. [Google OAuth Scopes List](https://developers.google.com/identity/protocols/oauth2/scopes)

For detailed setup instructions, refer to the [clerk-oauth-setup.md](./clerk-oauth-setup.md) document.
