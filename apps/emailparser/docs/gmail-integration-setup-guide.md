# Gmail Integration Setup Guide

This guide explains how to set up Gmail integration for the Email Parser application. It includes detailed steps for both developers configuring the application and end-users connecting their Gmail accounts.

## For Developers

### 1. Configure Clerk OAuth with Gmail Scopes

To allow users to connect their Gmail accounts, you need to configure the Google OAuth provider in your Clerk dashboard with the necessary Gmail API scopes.

1. **Log in to the [Clerk Dashboard](https://dashboard.clerk.dev/)**
2. **Navigate to your application**
3. **Go to User & Authentication → Social Connections**
4. **Find Google in the list of providers and click Edit**
5. **Add the following Gmail API scopes:**
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.labels
   https://www.googleapis.com/auth/gmail.metadata
   ```
6. **Save your changes**

### 2. Configure Google Cloud Platform

1. **Go to the [Google Cloud Console](https://console.cloud.google.com/)**
2. **Select your project**
3. **Navigate to APIs & Services → OAuth consent screen**
4. **Add the same Gmail API scopes to your OAuth consent screen**
5. **Under APIs & Services → Library, enable the Gmail API**
6. **Under APIs & Services → Credentials, ensure your OAuth client ID has the correct redirect URIs:**
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.com/api/auth/callback/google`

### 3. Update Clerk Environment Variables

Ensure your Clerk environment variables are correctly set in your `.env` file:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxxx
CLERK_SECRET_KEY=sk_xxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/gmail-connect
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/gmail-connect
```

### 4. Test the Integration Flow

1. Sign out of the application
2. Clear browser cookies and cache
3. Sign in with Google
4. Verify that the Gmail permission consent screen appears
5. After granting permissions, check that you can access the Gmail integration page
6. Test syncing emails to ensure the token is working correctly

## For Users

### How to Connect Your Gmail Account

1. **Sign in to the Email Parser application**

   - If you already have an account, sign out first
   - Go to the sign-in page
   - Click "Continue with Google"
   - Select your Google account

2. **Grant Gmail Access Permissions**

   - Google will show a permissions screen
   - Make sure to check all the Gmail access permissions
   - Click "Allow" to grant access

3. **Navigate to Gmail Connection Page**

   - After signing in, you'll be redirected to the Gmail connection page
   - If not, click on "Gmail Integration" in the navigation menu

4. **Sync Your Emails**
   - Once connected, click the "Sync Gmail" button
   - This will fetch your recent emails for parsing
   - The system will maintain this connection for future use

### Troubleshooting Connection Issues

If you see the message "You're signed in with Google, but Gmail permissions are missing":

1. **Sign out completely** from the application

   - Click the "Sign Out" button
   - This will clear your current session

2. **Sign in again with Google**

   - Use the same Google account
   - When prompted, make sure to grant all requested Gmail permissions
   - If you don't see the permissions screen, try clearing your browser cookies or using an incognito/private window

3. **Check your Gmail connection**
   - After signing in, go to the Gmail Connection page
   - You should see "Your Gmail account is connected" message
   - Try syncing your emails again

### Privacy Information

When you connect your Gmail account to the Email Parser:

- We only request **read-only access** to your emails
- We do not store your Google password
- We never send emails on your behalf
- Your email data is securely stored and processed
- You can revoke access at any time through your Google Account settings

### Revoking Access

If you want to revoke the application's access to your Gmail:

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to Security → Third-party apps with account access
3. Find Email Parser and click "Remove Access"

## Technical Details

### Authentication Flow

1. User authenticates with Google OAuth through Clerk
2. The authentication includes Gmail API scopes
3. Clerk provides an access token with Gmail permissions
4. The application uses this token to make authenticated Gmail API requests

### Data Flow

1. When a user clicks "Sync Gmail," a Convex action is triggered
2. The action extracts the Google access token from the Clerk identity
3. It makes authenticated requests to the Gmail API
4. Email data is processed and stored in the Convex database
5. The UI is updated to display the processed emails

### API Endpoints Used

- `https://www.googleapis.com/gmail/v1/users/me/messages` - For fetching email messages
- `https://www.googleapis.com/gmail/v1/users/me/labels` - For fetching Gmail labels

### Security Considerations

- OAuth tokens are never exposed to client-side code
- All Gmail API requests happen server-side in Convex actions
- Access tokens are short-lived and automatically refreshed when needed
- No email content is ever logged or exposed in browser consoles
