# Clerk OAuth Setup for Gmail Integration

## Prerequisites

1. A [Clerk](https://clerk.dev) account
2. A Google Cloud Platform project with the Gmail API enabled

## Step 1: Configure Google OAuth Provider in Clerk Dashboard

1. Log in to your [Clerk Dashboard](https://dashboard.clerk.dev/)
2. Navigate to your application instance
3. Go to **User & Authentication** → **Social Connections**
4. Find **Google** in the list of providers and click **Edit**
5. Ensure **Enable Google OAuth** is toggled on

## Step 2: Configure Gmail API Scopes

This is the critical step for enabling Gmail access in your application:

1. While still in the Google OAuth provider settings:
2. Scroll down to the **Scopes** section
3. Add the following scopes (one per line):
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.labels
   https://www.googleapis.com/auth/gmail.metadata
   ```
4. Click **Save** at the bottom of the page

## Step 3: Configure Google OAuth on GCP

To use Google OAuth with Clerk, you need to configure your Google Cloud Platform project:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure the consent screen (External or Internal)
5. Add the same scopes as in Clerk:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/gmail.metadata`
6. Add the domain of your application to the authorized domains

## Step 4: Create OAuth Credentials

1. In Google Cloud Console, navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Set Application type to **Web application**
4. Add a name for the client
5. Add authorized JavaScript origins:
   - Your production domain (e.g., `https://yourdomain.com`)
   - Your development domain (e.g., `http://localhost:3000`)
6. Add authorized redirect URIs:
   - Your Clerk callback URL: `https://<your-clerk-frontend-api>/v1/oauth/callback/google`
   - For development: `http://localhost:3000/api/auth/callback/google`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Step 5: Add Credentials to Clerk

1. Return to the Clerk Dashboard
2. Navigate back to the Google OAuth provider settings
3. Enter the **Client ID** and **Client Secret** from Google Cloud Console
4. Click **Save**

## Step 6: Testing the Integration

To test that Gmail scopes are being properly requested:

1. Sign out of your application completely
2. Clear your browser cookies (especially for your application domain and accounts.google.com)
3. Sign in with Google
4. You should see a consent screen that explicitly mentions access to Gmail data
5. After granting permissions, you should be able to access Gmail data in your application

## Troubleshooting

### "Gmail permissions are missing" Error

If users receive the "You're signed in with Google, but Gmail permissions are missing" error:

1. **Verify Scopes Configuration**: Double-check that the Gmail API scopes are correctly added in the Clerk Dashboard
2. **Complete Sign-Out Required**: Users who previously signed in with Google (before the scopes were added) must sign out completely and sign in again
3. **Check Google Cloud Console**: Ensure the scopes are also added to your OAuth consent screen in GCP

### Google API Errors

If your application receives authentication errors when trying to access Gmail:

1. **Check Token Validity**: Ensure the access token is being correctly extracted from the Clerk identity
2. **Inspect Token Scopes**: Use a tool like [jwt.io](https://jwt.io) to examine the token and verify it includes the Gmail scopes
3. **Enable Gmail API**: Confirm the Gmail API is enabled in your Google Cloud Platform project

### Clerk Authentication Issues

If users have problems signing in with Google:

1. **Check Clerk Logs**: Review the authentication logs in the Clerk Dashboard
2. **Verify OAuth Configuration**: Ensure the Google OAuth client ID and secret are correctly configured
3. **Check Redirect URIs**: Confirm the authorized redirect URIs include your Clerk callback URL
