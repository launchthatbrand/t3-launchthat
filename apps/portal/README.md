# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Convex](https://convex.dev) (Backend)
- [Authorize.Net](https://authorize.net) (Payment Processing)

## Environment Variables

This application requires several environment variables to be set up correctly.

## Local HTTPS (Authorize.Net Accept.js testing)

Authorize.Net Accept.js requires a **secure browser context**. Your org-level dev URLs like `wall-street-academy.localhost` are **not** treated as `localhost`, so you’ll typically want HTTPS while testing checkout.

We run Portal normally on HTTP (microfrontends assigns the port; commonly `3024`) and run a local HTTPS reverse-proxy on `3025`:

- Install Caddy:
  - `brew install caddy`
- Trust Caddy’s local CA (one-time):
  - `caddy trust`
- Start Portal (HTTP):
  - `pnpm --filter portal dev`
- In another terminal, start HTTPS proxy:
  - `pnpm --filter portal dev:https`
- Test checkout over HTTPS:
  - `https://wall-street-academy.localhost:3025/checkout`

### Clerk session cookies for multi-tenant admin

When developing with tenant subdomains (e.g., `wall-street-academy.localhost:3004`), Clerk must share its session cookie across every subdomain. Set the following in your frontend `.env.local` (or your deployment environment) and restart the dev server:

```env
CLERK_COOKIE_DOMAIN=.localhost
```

For production, replace `.localhost` with your root domain (for example, `.example.com`). Without this setting, navigating to an organization-specific admin like `https://some-org.example.com/admin` will appear logged out even if you are signed in on `https://example.com/admin`.

### Next.js Frontend (`apps/wsa/.env.local`)

Create a `.env.local` file in the `apps/wsa` directory (if it doesn't exist) and add the following variables. These are used by the frontend components:

```env
# Authorize.Net keys for the Accept.js client-side library
# Used in PaymentForm.tsx
NEXT_PUBLIC_AUTHORIZENET_LOGINID="YOUR_AUTHNET_LOGIN_ID"
NEXT_PUBLIC_AUTHORIZENET_CLIENTKEY="YOUR_AUTHNET_PUBLIC_CLIENT_KEY"

# URL of your Convex backend's HTTP endpoints
# Should use the .convex.site domain
# Used in PaymentForm.tsx for fetch calls
NEXT_PUBLIC_CONVEX_URL="YOUR_CONVEX_SITE_URL" # e.g., https://your-deployment-name.convex.site

# Other T3/NextAuth variables as needed...
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="your_secret"
```

Replace the placeholder values with your actual Authorize.Net and Convex details. Remember to **restart your Next.js development server** after changing `.env.local`.

### Convex Backend (Dashboard Settings)

These variables are required by the Convex functions (specifically `convex/payments.ts`) and must be set in your Convex project dashboard (**Settings -> Environment Variables**):

- `AUTHORIZENET_API_LOGIN_ID`: Your Authorize.Net API Login ID (Secret).
- `AUTHORIZENET_TRANSACTION_KEY`: Your Authorize.Net Transaction Key (Secret).
- `CLIENT_ORIGIN`: The URL of your frontend application for CORS checks (e.g., `http://localhost:3001` for local development, or your deployed site URL like `https://yourdomain.com`).
- `NODE_ENV`: (Optional) Set to `production` or `development`. Defaults to `development` if not set.

**Important:** Convex backend functions read variables set in the dashboard, **not** from local `.env` files.

## Learn More

To learn more about the technologies used, take a look at the following resources:

- [T3 Stack Documentation](https://create.t3.gg/)
- [Convex Documentation](https://docs.convex.dev)
- [Authorize.Net Developer Docs](https://developer.authorize.net/api/reference/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available)

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel) and [Docker](https://create.t3.gg/en/deployment/docker) for more information. Remember to set the corresponding environment variables in your deployment environment (Vercel, Convex dashboard, etc.).
