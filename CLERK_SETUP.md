# Clerk Authentication Setup

This guide explains how to set up Clerk authentication for the Stream Party application.

## Step 1: Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

## Step 2: Get Your API Keys

1. In the Clerk Dashboard, go to **API Keys**
2. Copy the following values:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

## Step 3: Configure OAuth Providers (Optional)

1. In Clerk Dashboard, go to **User & Authentication** → **Social Connections**
2. Enable **Google** and/or **GitHub** OAuth providers
3. Follow the setup instructions for each provider

## Step 4: Set Environment Variables in GitHub Codespaces

### Option A: Using GitHub Secrets (Recommended for Codespaces)

1. Go to your GitHub repository: `https://github.com/ByspokeCoder/stream-party`
2. Navigate to **Settings** → **Secrets and variables** → **Actions** → **Codespaces secrets**
3. Add the following secrets:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = Your Publishable Key
   - `CLERK_SECRET_KEY` = Your Secret Key

### Option B: Using .env.local file (For Local Development)

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

**Important**: Never commit `.env.local` to Git. It's already in `.gitignore`.

## Step 5: Restart Your Development Server

After setting environment variables:

1. Stop the current server (Ctrl+C)
2. Restart with `npm run dev`

## Verification

Once configured:
- Visit `/signup` to create an account
- Visit `/login` to sign in
- Visit `/dashboard` (protected route) - should redirect to login if not authenticated
- Test OAuth providers if configured

## Security Notes

- All authentication is handled server-side by Clerk
- Credentials are never sent in plain text
- Sessions are managed securely by Clerk's cloud service
- The `/dashboard` route is protected by middleware

