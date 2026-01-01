# YouTube Integration Setup Guide

**IMPORTANT:** This setup is for **developers/administrators only**. End users do NOT need to do this - they simply click "Connect YouTube" and sign in with Google.

This guide explains the ONE-TIME setup required by the developer/admin to enable YouTube integration for all users.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Go to **APIs & Services** → **Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**

4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - If prompted, configure the OAuth consent screen first:
     - User Type: **External** (for testing) or **Internal** (for Google Workspace)
     - App name: "Stream Party"
     - User support email: Your email
     - Developer contact: Your email
     - Add scopes: `https://www.googleapis.com/auth/youtube.readonly`
     - Save and continue through the steps

5. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Stream Party Web"
   - Authorized redirect URIs: Add your redirect URI:
     - For Codespaces: `https://YOUR-CODESPACE-URL.app.github.dev/api/youtube/oauth`
     - For local: `http://localhost:3000/api/youtube/oauth`
     - For production: `https://your-domain.com/api/youtube/oauth`
   - Click **Create**
   - Copy the **Client ID** and **Client Secret**

## Step 2: Set Environment Variables

### For GitHub Codespaces (Recommended)

1. Go to your GitHub repository: `https://github.com/ByspokeCoder/stream-party`
2. Navigate to **Settings** → **Secrets and variables** → **Actions** → **Codespaces secrets**
3. Add the following secrets:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = Your Google Client ID
   - `GOOGLE_CLIENT_SECRET` = Your Google Client Secret
   - `NEXT_PUBLIC_APP_URL` = Your Codespaces preview URL (optional, will auto-detect)

### For Local Development

Add to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Restart Your Development Server

After setting environment variables:

1. Stop the current server (Ctrl+C)
2. Restart with `npm run dev`

## Step 4: Test the Integration

Once setup is complete, **any user** can connect their YouTube account:

1. Go to `/dashboard` in your app
2. Click **Continue with Google** button (in the YouTube Integration section)
3. Sign in with their Google account
4. Authorize the app to access their YouTube data
5. They'll be redirected back to the dashboard
6. Their YouTube subscriptions will appear automatically

**No technical knowledge required for end users!** They just click the button and sign in.

## Security Features

- **Encrypted Storage**: Access tokens are encrypted with AES-256 before storage
- **Token Refresh**: Tokens are automatically refreshed when expired
- **HTTPS Only**: All API requests use HTTPS
- **Read-Only Access**: Only requests read-only YouTube data (subscriptions)
- **No Video Downloads**: Only metadata is fetched, no video content

## Troubleshooting

### "Google OAuth not configured" Error

- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in environment variables
- Restart your development server after adding environment variables

### "Redirect URI mismatch" Error

- Check that your redirect URI in Google Cloud Console matches exactly:
  - Must include the full path: `/api/youtube/oauth`
  - Must match the protocol (http/https)
  - Must match the domain exactly

### "Token expired" Error

- The app will prompt you to reconnect
- Click "Connect YouTube" again to refresh the token

### No Subscriptions Showing

- Verify you have YouTube subscriptions on your Google account
- Check browser console for errors
- Verify the YouTube Data API v3 is enabled in Google Cloud Console

## API Scopes Used

- `https://www.googleapis.com/auth/youtube.readonly` - Read-only access to YouTube account data

## Revoking Access

To revoke access:
1. Go to [Google Account Settings](https://myaccount.google.com/permissions)
2. Find "Stream Party" in the list
3. Click "Remove access"
4. The app will detect the revoked token and prompt you to reconnect

