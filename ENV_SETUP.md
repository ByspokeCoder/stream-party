# Environment Variables Setup for Codespaces

## Your Clerk API Keys

You have provided your Clerk API keys. Here's how to set them up in GitHub Codespaces:

## Option 1: Using GitHub Codespaces Secrets (Recommended)

1. Go to your GitHub repository: https://github.com/ByspokeCoder/stream-party
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click on the **Codespaces secrets** tab
4. Click **New repository secret** and add:

   **Secret 1:**
   - Name: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Value: `pk_test_dW5pdGVkLWJ1Zy04Mi5jbGVyay5hY2NvdW50cy5kZXYk`

   **Secret 2:**
   - Name: `CLERK_SECRET_KEY`
   - Value: `sk_test_Hq1E2sd8RFMLlm1sGV6Sjob61cutyJ6TE5R5p67OW9`

5. After adding secrets, **restart your Codespace** for the environment variables to be available

## Option 2: Using .env.local in Codespaces (Quick Setup)

If you want to test immediately without restarting:

1. In your Codespaces terminal, create a `.env.local` file:
   ```bash
   cd stream-party
   nano .env.local
   ```

2. Add the following content:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dW5pdGVkLWJ1Zy04Mi5jbGVyay5hY2NvdW50cy5kZXYk
   CLERK_SECRET_KEY=sk_test_Hq1E2sd8RFMLlm1sGV6Sjob61cutyJ6TE5R5p67OW9
   ```

3. Save the file (Ctrl+O, Enter, Ctrl+X in nano)

4. Restart your development server:
   ```bash
   # Stop the current server (Ctrl+C if running)
   npm run dev
   ```

## Verification

After setting up, test:
1. Visit `/signup` - should show Clerk signup form
2. Create a test account
3. Visit `/dashboard` - should show "Logged in as [username]"
4. Test logout functionality

## Security Note

⚠️ **Never commit these keys to Git!** The `.env.local` file is already in `.gitignore` and will not be committed.

