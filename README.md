# Enterprise Authentication Hub

This project serves as a **Centralized Enterprise Single Sign-On (SSO) Authentication Server** tailored for a suite of products. It mimics how large organizations (e.g., Meta, Google) handle cross-product authentication from a single, high-trust hub.

Built with **Next.js**, **Tailwind CSS**, and backed by **Clerk** for robust identity management, it presents a unified, Meta-style login experience across your entire product ecosystem.

---

## 🏗️ Architecture Concept

Instead of building authentication into every single product (e.g., `app1.com`, `app2.com`, `app3.com`), you redirect all unauthenticated users to this central hub (`auth.yourdomain.com`).

1. **User attempts to access a protected route on Product A (`app1.com`).**
2. **Product A redirects the user to the Auth Hub:**
   `auth.yourdomain.com/sign-in?client_id=ProductA&redirect_url=app1.com/callback`
3. **User authenticates on the Auth Hub** via a unified, trusted interface.
4. **Auth Hub verifies credentials via Clerk**.
5. **Auth Hub redirects the user back to Product A** with an active session.

This creates a seamless "Login once, access everywhere" experience.

---

## 🚀 Step 1: Setting up the Auth Hub

### Prerequisites

- Node.js installed
- A [Clerk](https://clerk.com/) account and application created
- A PostgreSQL database (for the Prisma backend webhook sync)

### Installation

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` (if applicable) and fill in your keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   DATABASE_URL=postgres://...
   WEBHOOK_SECRET=whsec_...
   ```
4. Run Prisma database migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   The Auth Hub will now be running at `http://localhost:3000`.

---

## 🔌 Step 2: Integrating a Client Product

Any product in your ecosystem can rely on this Auth Hub. The only requirement is that the Client Product uses the **exact same Clerk Instance** (same Publishable and Secret keys) as the Auth Hub.

### 2a. Configure Middleware (Client Product)

In your Client Product (`app1.com`), configure your `middleware.ts` to redirect unauthenticated users to the Auth Hub.

```typescript
// Product A: middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect({
      // Redirect to Auth Hub
      unauthenticatedUrl: `https://auth.yourdomain.com/sign-in?client_id=PRODUCT_A&redirect_url=${req.url}`,
    });
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### 2b. Sign In / Sign Up Link (Client Product)

If you have a public landing page on `app1.com`, your "Login" and "Sign Up" buttons should point to the Auth Hub:

```html
<!-- Login Button -->
<a
  href="https://auth.yourdomain.com/sign-in?client_id=App1&redirect_url=https://app1.com/dashboard"
>
  Log In
</a>

<!-- Sign Up Button -->
<a
  href="https://auth.yourdomain.com/sign-up?client_id=App1&redirect_url=https://app1.com/dashboard"
>
  Sign Up
</a>
```

> **Note:** The `client_id` parameter dynamically updates the Auth Hub UI to say: _"Connecting to app: App1"_.

---

## 🔑 Step 3: Session Validation

**You do not need to manually check if the session is valid.**

Because your Auth Hub and Client Products share the same Clerk instance and `<ClerkProvider>`, Clerk automatically handles session validation:

1. When the Auth Hub authenticates the user, Clerk sets a secure session.
2. When the user returns to `app1.com`, the Clerk SDK detects the active session automatically.
3. The JWT token is refreshed silently in the background by the `<ClerkProvider>`. If the token becomes invalid (e.g. session ends), Clerk blocks access instantly.

_(Note: For testing locally or operating across entirely different root domains, ensure Clerk Multi-domain is properly configured in your Clerk Dashboard)._

---

## 🚪 Step 4: Single Sign-Out (SSO Logout)

To ensure users are logged out of _all_ enterprise applications at once, route your Client Product logouts through the Auth Hub.

In `app1.com`, your "Log Out" button should point to:

```html
<a
  href="https://auth.yourdomain.com/sign-out?client_id=App1&redirect_url=https://app1.com/goodbye"
>
  Log Out
</a>
```

**How it works:**

1. User clicks Log Out on `app1.com`.
2. User is sent to the Auth Hub's `/sign-out` route.
3. Auth Hub cleanly terminates the master Clerk session globally.
4. User is redirected back to `app1.com/goodbye`.
5. If the user had `app2.com` open in another tab, its next background token refresh will fail, instantly logging them out there as well.

---

## 🗄️ Database Webhook & Syncing (Optional)

If your enterprise applications need to know exactly _which_ users have connected to _which_ products within your PostgreSQL database, the Auth Hub provides a callback endpoint.

1. **User authenticates on the Auth Hub.**
2. **User is redirected back to `app1.com/callback`.**
3. **`app1.com` verifies the session** and sends a Server-to-Server API request to the Auth Hub:
   ```typescript
   // Executed on app1.com backend after login
   await fetch("https://auth.yourdomain.com/api/auth/callback", {
     method: "POST",
     body: JSON.stringify({
       clerk_id: userId,
       client_id: "PRODUCT_A_ID",
     }),
   });
   ```
4. **Auth Hub (`app/api/auth/callback/route.ts`) securely saves the linkage** via Prisma `upsert`, proving the user is an active customer of `Product A`.

---

## 🎨 UI Guidelines

The Auth Hub is designed to emulate Enterprise Meta-login portals to maximize trust and conversion rates:

- **Font**: Google's `Inter`.
- **Background**: `#f0f2f5` (Classic off-gray).
- **Primary Elements**: `#1877f2` (Trust Blue).
- **Success Elements**: `#42b72a` (Growth Green).
- **Layout**: Dynamic split-screen messaging on Desktop; stacked layout on Mobile.
