# Enterprise Authentication Hub

This project serves as a **Centralized Enterprise Single Sign-On (SSO) Authentication Server** tailored for a suite of products. It mimics how large organizations (e.g., Meta, Google) handle cross-product authentication from a single, high-trust hub.

Built with **Next.js**, **Tailwind CSS**, and backed by **Clerk** for robust identity management, it presents a unified, Meta-style login experience across your entire product ecosystem.

---

## Architecture Concept

Instead of building authentication into every single product (e.g., `app1.com`, `app2.com`, `app3.com`), you redirect all unauthenticated users to this central hub (`auth.yourdomain.com`).

1. **User attempts to access a protected route on Product A (`app1.com`).**
2. **Product A redirects the user to the Auth Hub:**
   `auth.yourdomain.com/sign-in?client_id=ProductA&redirect_url=app1.com/callback`
3. **User authenticates on the Auth Hub** via a unified, trusted interface.
4. **Auth Hub verifies credentials via Clerk**.
5. **Auth Hub redirects the user back to Product A** with an active session.

This creates a seamless "Login once, access everywhere" experience.

---

## Step 1: Setting up the Auth Hub

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

## Step 2: Integrating a Client Product (Next.js)

Any Next.js product in your ecosystem can rely on this Auth Hub. The only requirement is that the Client Product uses the **exact same Clerk Instance** (same Publishable and Secret keys) as the Auth Hub.

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

## Step 3: Session Validation (Next.js)

**You do not need to manually check if the session is valid.**

Because your Auth Hub and Client Products share the same Clerk instance and `<ClerkProvider>`, Clerk automatically handles session validation:

1. When the Auth Hub authenticates the user, Clerk sets a secure session.
2. When the user returns to `app1.com`, the Clerk SDK detects the active session automatically.
3. The JWT token is refreshed silently in the background by the `<ClerkProvider>`. If the token becomes invalid (e.g. session ends), Clerk blocks access instantly.

_(Note: For testing locally or operating across entirely different root domains, ensure Clerk Multi-domain is properly configured in your Clerk Dashboard)._

---

## Step 4: Integrating an Express.js Client

Express.js clients **cannot use `ClerkProvider`** directly. Instead, they validate Clerk-issued JWTs on every protected request using the Clerk backend SDK.

### 4a. Install Dependencies

```bash
npm install @clerk/clerk-sdk-node express dotenv
# TypeScript users:
npm install -D @types/express ts-node typescript
```

### 4b. Configure Environment Variables

```env
# .env — must use the same keys as the Auth Hub
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 4c. Create JWT Validation Middleware

```javascript
// clerkMiddleware.js
import { createClerkClient } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
dotenv.config();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      // No token — redirect to Auth Hub
      const redirectBack = encodeURIComponent(
        req.protocol + "://" + req.get("host") + req.originalUrl,
      );
      return res.redirect(
        `https://auth.yourdomain.com/sign-in?client_id=EXPRESS_APP&redirect_url=${redirectBack}`,
      );
    }

    // Verify the JWT with Clerk
    const payload = await clerk.verifyToken(token);

    // Attach decoded user to request
    req.auth = { userId: payload.sub, sessionId: payload.sid };
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
```

### 4d. Apply Middleware to Protected Routes

```javascript
// app.js
import express from "express";
import { requireAuth } from "./clerkMiddleware.js";

const app = express();
app.use(express.json());

// Public route
app.get("/", (req, res) => {
  res.send("Welcome to Product B");
});

// Protected routes
app.get("/dashboard", requireAuth, (req, res) => {
  res.json({ message: "Hello!", userId: req.auth.userId });
});

app.get("/api/data", requireAuth, (req, res) => {
  res.json({ data: "Secure data", userId: req.auth.userId });
});

app.listen(4000, () => console.log("Running on port 4000"));
```

### 4e. Pass the JWT from Your Frontend

After the Auth Hub redirects the user back, your frontend retrieves a fresh token from Clerk's JS SDK and sends it on every API request:

```javascript
// Include Clerk's JS SDK in your HTML
// <script src="https://cdn.jsdelivr.net/npm/@clerk/clerk-js"></script>

const clerk = new window.Clerk(CLERK_PUBLISHABLE_KEY);
await clerk.load();

const token = await clerk.session?.getToken();

fetch("https://yourapp.com/api/data", {
  headers: { Authorization: `Bearer ${token}` },
});
```

> **Token refresh:** Clerk JWTs expire in ~60 seconds. Always call `getToken()` before each request — it refreshes silently if near expiry. On a `401` response, retry once with a fresh token, then redirect to the Auth Hub.

### 4f. Single Sign-Out (Express)

```html
<a
  href="https://auth.yourdomain.com/sign-out?client_id=ExpressApp&redirect_url=https://yourapp.com/goodbye"
>
  Log Out
</a>
```

After the global session ends, any subsequent API call will return `401`. Catch this in your frontend and redirect to the Auth Hub sign-in page.

---

## Step 5: Integrating a Python Client (FastAPI / Flask)

Python clients validate Clerk JWTs by fetching Clerk's public **JWKS** (JSON Web Key Set) and verifying the token's RS256 signature locally — no outbound call is needed on every request.

### Common Setup (FastAPI & Flask)

#### 5a. Environment Variables

```env
# .env — must use the same keys as the Auth Hub
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_FRONTEND_API=https://<your-clerk-frontend-api>

# JWKS URL is derived automatically:
# https://<clerk-frontend-api>/.well-known/jwks.json
```

> **Tip:** Find your `CLERK_FRONTEND_API` URL in your Clerk Dashboard under **API Keys**. It looks like `https://clerk.your-domain.com`.

---

### FastAPI Integration

#### Install Dependencies

```bash
pip install fastapi uvicorn python-jose[cryptography] httpx python-dotenv
```

#### Create the JWT Validation Dependency

```python
# auth.py
import os, httpx
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

CLERK_FRONTEND_API = os.getenv("CLERK_FRONTEND_API")
JWKS_URL = f"{CLERK_FRONTEND_API}/.well-known/jwks.json"

security = HTTPBearer()
_jwks_cache = None


async def get_jwks():
    global _jwks_cache
    if not _jwks_cache:
        async with httpx.AsyncClient() as client:
            response = await client.get(JWKS_URL)
            _jwks_cache = response.json()
    return _jwks_cache


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    token = credentials.credentials
    try:
        jwks = await get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        key = next(
            (k for k in jwks["keys"] if k["kid"] == unverified_header["kid"]),
            None,
        )
        if key is None:
            raise HTTPException(status_code=401, detail="Signing key not found")

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
```

#### Apply to Routes

```python
# main.py
from fastapi import FastAPI, Depends
from auth import require_auth

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Welcome to Product C"}


@app.get("/dashboard")
async def dashboard(user: dict = Depends(require_auth)):
    return {"message": "Hello!", "user_id": user["sub"]}


@app.get("/api/data")
async def get_data(user: dict = Depends(require_auth)):
    return {"data": "Secure data", "user_id": user["sub"]}
```

#### Run the Server

```bash
uvicorn main:app --reload --port 8000
```

---

### Flask Integration

#### Install Dependencies

```bash
pip install flask python-jose[cryptography] requests python-dotenv
```

#### Create the JWT Validation Decorator

```python
# auth.py
import os, requests, functools
from flask import request, jsonify
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

CLERK_FRONTEND_API = os.getenv("CLERK_FRONTEND_API")
JWKS_URL = f"{CLERK_FRONTEND_API}/.well-known/jwks.json"
_jwks_cache = None


def get_jwks():
    global _jwks_cache
    if not _jwks_cache:
        _jwks_cache = requests.get(JWKS_URL).json()
    return _jwks_cache


def require_auth(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401
        token = auth_header[7:]
        try:
            jwks = get_jwks()
            unverified_header = jwt.get_unverified_header(token)
            key = next(
                (k for k in jwks["keys"] if k["kid"] == unverified_header["kid"]),
                None,
            )
            if key is None:
                return jsonify({"error": "Signing key not found"}), 401
            payload = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            request.user = payload
            return f(*args, **kwargs)
        except JWTError as e:
            return jsonify({"error": f"Invalid token: {e}"}), 401
    return decorated
```

#### Apply to Routes

```python
# app.py
from flask import Flask, jsonify, request
from auth import require_auth

app = Flask(__name__)


@app.route("/")
def index():
    return jsonify({"message": "Welcome to Product D"})


@app.route("/dashboard")
@require_auth
def dashboard():
    return jsonify({"message": "Hello!", "user_id": request.user["sub"]})


@app.route("/api/data")
@require_auth
def get_data():
    return jsonify({"data": "Secure data", "user_id": request.user["sub"]})


if __name__ == "__main__":
    app.run(debug=True, port=8000)
```

#### Run the Server

```bash
python app.py
```

---

## Step 6: Single Sign-Out (SSO Logout)

To ensure users are logged out of _all_ enterprise applications at once, route your Client Product logouts through the Auth Hub — this is the same for **all stacks**.

```html
<a
  href="https://auth.yourdomain.com/sign-out?client_id=YourApp&redirect_url=https://yourapp.com/goodbye"
>
  Log Out
</a>
```

**How it works:**

1. User clicks Log Out on any client product.
2. User is sent to the Auth Hub's `/sign-out` route.
3. Auth Hub cleanly terminates the master Clerk session globally.
4. User is redirected back to `yourapp.com/goodbye`.
5. If the user had another product open in a tab, its next background token refresh will fail, instantly logging them out there as well.

---

## Database Webhook & Syncing (Optional)

If your enterprise applications need to know exactly _which_ users have connected to _which_ products within your PostgreSQL database, the Auth Hub provides a callback endpoint. This works the same across all stacks.

```typescript
// Node / Express.js — after login
await fetch("https://auth.yourdomain.com/api/auth/callback", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ clerk_id: userId, client_id: "YOUR_PRODUCT_ID" }),
});
```

```python
# Python — after login
import httpx
httpx.post(
    "https://auth.yourdomain.com/api/auth/callback",
    json={"clerk_id": user_id, "client_id": "YOUR_PRODUCT_ID"},
)
```

**Auth Hub (`app/api/auth/callback/route.ts`) securely saves the linkage** via Prisma `upsert`, proving the user is an active customer of that product.

---

## Stack Comparison

| Feature          | Next.js                        | Express.js                           | Python (FastAPI/Flask)               |
| ---------------- | ------------------------------ | ------------------------------------ | ------------------------------------ |
| Session handling | Automatic via `ClerkProvider`  | Manual JWT in `Authorization` header | Manual JWT in `Authorization` header |
| Middleware style | `clerkMiddleware()`            | `requireAuth` function               | `Depends()` / decorator              |
| Token source     | `ClerkProvider` (auto-refresh) | Clerk Frontend JS SDK                | Clerk Frontend JS SDK                |
| JWT verification | Built into Clerk SDK           | `clerk.verifyToken()`                | `python-jose` + JWKS URL             |
| Redirect on 401  | Automatic via `auth.protect()` | Manual `res.redirect()`              | Manual redirect or `401`             |
| Logout           | Auth Hub `/sign-out`           | Auth Hub `/sign-out`                 | Auth Hub `/sign-out`                 |

---

## UI Guidelines

The Auth Hub is designed to emulate Enterprise Meta-login portals to maximize trust and conversion rates:

- **Font**: Google's `Inter`.
- **Background**: `#f0f2f5` (Classic off-gray).
- **Primary Elements**: `#1877f2` (Trust Blue).
- **Success Elements**: `#42b72a` (Growth Green).
- **Layout**: Dynamic split-screen messaging on Desktop; stacked layout on Mobile.
