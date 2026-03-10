# Auth Hub Server

A centralized Authentication Server built with Next.js 15, Clerk, Prisma (PostgreSQL), and Shadcn UI. This server acts as the central source of truth for user identity, providing Sign-In, Sign-Up, and SSO callback flows. It syncs user data from Clerk into a local database via webhooks.

## Features

- **Centralized Authentication:** Custom UI for `/sign-in` and `/sign-up` powered by Clerk.
- **Client ID Tracking:** Accepts `?client_id=<APP_NAME>` to let users know which app they are authenticating for.
- **Database Sync:** Listens to Clerk Webhooks to automatically sync users to a local PostgreSQL database using Prisma.
- **Rate-Limited Webhooks:** Secure, Svix-verified, and Redis-rate-limited webhook endpoints to prevent abuse.
- **Modern UI:** Built with Tailwind CSS, Shadcn UI, and Base UI for a clean, accessible interface.

---

## Getting Started

### 1. Prerequisites

- Node.js (v18+)
- A [Clerk](https://clerk.com/) account and application.
- A PostgreSQL database string.
- (Optional) An [Upstash](https://upstash.com/) Redis database for rate limiting.

### 2. Installation Setup

Clone the repository and install the dependencies:

```bash
npm install
```

### 3. Environment Variables

Copy the example environment file and fill in your secrets:

```bash
cp .env.example .env
```

Your `.env` file should include the following variables:

```env
# Clerk Keys (From Clerk Dashboard > API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# PostgreSQL Database connection string
DATABASE_URL="postgresql://user:password@host:port/db"

# Clerk Webhook Secret (From Clerk Dashboard > Webhooks)
WEBHOOK_SECRET=whsec_...

# Secret for internal communications
INTERNAL_SECRET=your_super_secret_string

# Optional: Upstash Redis for Webhook Rate Limiting
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
```

### 4. Database Initialization

Push the Prisma schema to your PostgreSQL database and generate the Prisma client:

```bash
npx prisma generate
npx prisma db push
```

### 5. Running the Application

Start the development server:

```bash
npm run dev
```

The server will be available at `http://localhost:3000`.

---

## How it Works

### 1. Connecting Satellite Apps

Satellite applications can route unauthenticated users to this auth server instead of handling their own UI. You can pass a `client_id` query parameter for better UX:

```text
http://localhost:3000/sign-in?client_id=MySatelliteApp
```

The user will see "Connecting to app: MySatelliteApp" under the standard login form. Once authentication is complete, Clerk manages the session, and your Next.js satellite apps (sharing the same Clerk instance/keys) will immediately detect the user's logged-in state.

### 2. Webhook Syncing

To ensure your local database has a synchronized mirror of the Clerk users:

1. Go to your Clerk Dashboard.
2. Navigate to **Webhooks** -> **Add Endpoint**.
3. Point the Endpoint URL to your auth server's production URL (or Ngrok for local dev): `https://YOUR_DOMAIN/api/webhooks/clerk`
4. Subscribe to the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Reveal the **Signing Secret** and paste it into `WEBHOOK_SECRET` in your `.env` file.

When a user signs up, the webhook endpoint will create a matching record in your `User` table using Prisma.

### 3. SSO Callback

The server also provides an `/sso-callback` route which utilizes Clerk's `<AuthenticateWithRedirectCallback />`. This is used for OAuth flows (like logging in with Google/GitHub) to safely redirect the user back to the application and complete the authentication process.
