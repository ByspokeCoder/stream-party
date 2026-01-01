# Database Setup Guide

This guide explains how to set up Prisma with a cloud PostgreSQL database (Neon or Supabase) for secure credential storage.

## Step 1: Create a Free PostgreSQL Database

### Option A: Neon (Recommended)

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (it will look like: `postgresql://user:password@host/database?sslmode=require`)

### Option B: Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Go to **Settings** → **Database**
5. Copy the connection string from the **Connection string** section

## Step 2: Set Up Environment Variables

### For GitHub Codespaces (Recommended)

1. Go to your GitHub repository: `https://github.com/ByspokeCoder/stream-party`
2. Navigate to **Settings** → **Secrets and variables** → **Actions** → **Codespaces secrets**
3. Add a new secret:
   - Name: `DATABASE_URL`
   - Value: Your PostgreSQL connection string from Step 1

### For Local Development

Add to your `.env.local` file:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

## Step 3: Install Dependencies and Set Up Database

In your Codespaces terminal:

```bash
# Install dependencies (including Prisma)
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

## Step 4: Verify Database Connection

After running migrations, you should see:
- A `prisma/migrations` folder created
- The `UserIntegration` table created in your database

You can verify this by:
1. Opening your database dashboard (Neon or Supabase)
2. Checking that the `UserIntegration` table exists
3. Or running `npx prisma studio` to view the database in a browser

## Security Features

- **AES-256 Encryption**: All tokens are encrypted before storage
- **User-Derived Keys**: Encryption keys are derived from user sessions using PBKDF2
- **No Plain-Text Storage**: Tokens are never stored in plain text
- **Session-Based Decryption**: Tokens can only be decrypted during active user sessions

## Database Schema

The `UserIntegration` table contains:
- `id`: Unique identifier
- `userId`: Clerk user ID
- `platform`: Platform name (e.g., "youtube", "twitch")
- `encryptedToken`: AES-256 encrypted token
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Troubleshooting

### Connection Errors

- Verify your `DATABASE_URL` is correct
- Check that your database allows connections from your IP (Neon/Supabase should allow all by default)
- Ensure SSL mode is set to `require` in the connection string

### Migration Errors

- Make sure you've run `npx prisma generate` first
- Check that your database is accessible
- Verify the connection string format

### Encryption Errors

- Ensure you're logged in (session is required for decryption)
- Check that the token was saved with the same session that's trying to decrypt it

