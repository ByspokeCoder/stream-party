# Stream Party

A Next.js application for streaming parties.

## Getting Started

### Option 1: Using GitHub Codespaces

1. **Direct Access**: Visit this URL to create a codespace:
   ```
   https://github.com/codespaces/new?repo=ByspokeCoder/stream-party
   ```

2. **Or use the keyboard shortcut**: Press `.` (period) on the repository page to open the web editor

3. Once in Codespaces, open the terminal and run:
   ```bash
   cd stream-party
   npm install
   npm run dev
   ```

4. **Port Forwarding**: 
   - Open the "Ports" tab in Codespaces (View → Ports or bottom panel)
   - Ensure port 3000 is forwarded and set to "Public"
   - Click on the forwarded port URL to open your app

5. **Troubleshooting 502 errors**: 
   - Make sure `npm install` completed successfully
   - Verify `npm run dev` is running (you should see "Ready" message)
   - Check that port 3000 is properly forwarded in the Ports tab

### Option 2: Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/ByspokeCoder/stream-party.git
   cd stream-party
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication Setup

This application uses Clerk for authentication. **You must configure Clerk before the app will work.**

See [CLERK_SETUP.md](./CLERK_SETUP.md) for detailed setup instructions.

Quick setup:
1. Create a free Clerk account at [clerk.com](https://clerk.com)
2. Get your API keys from the Clerk Dashboard
3. Add them as GitHub Codespaces secrets:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Restart your development server

## Features

- ✅ User authentication with Clerk (email/password and OAuth)
- ✅ Protected dashboard route
- ✅ Sign up, Login, and Logout functionality
- ✅ Server-side session handling

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Clerk (Authentication)

