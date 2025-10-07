# Google Sheets to Supabase Sync

Automatically sync data from Google Sheets to your Supabase database.

## Features

- ✅ Fetches data from Google Sheets using OAuth 2.0 authentication
- ✅ Syncs data to Supabase with upsert support
- ✅ TypeScript for type safety
- ✅ Environment-based configuration
- ✅ Easy to run manually or schedule as a cron job

## Prerequisites

1. **Google Cloud Project** with Sheets API enabled and OAuth 2.0 credentials
2. **Supabase Project** with a table ready to receive data

## Setup

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Google Sheets API**:
   - Go to APIs & Services → Library
   - Search for "Google Sheets API"
   - Click Enable
4. Create **OAuth 2.0 Credentials**:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - User Type: External (or Internal if using Google Workspace)
     - Add app name, user support email, and developer email
     - Add scope: `https://www.googleapis.com/auth/spreadsheets.readonly`
   - Application type: "Desktop app" (or "Web application" if deploying to server)
   - Name it (e.g., "Sheets Sync App")
   - Click Create
   - Download the credentials JSON or copy the Client ID and Client Secret

### 3. Configure Supabase

1. Create a table in your Supabase database that matches your Google Sheet structure
2. Ensure you have a unique constraint (e.g., on `id` column) for upsert functionality
3. Get your Supabase URL and anon/service key from Project Settings → API

### 4. Set Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your credentials in `.env`:

```env
# From your Google Sheet URL
GOOGLE_SHEET_ID=1iHGjttGPshlB_mXJUzhHrpUpg0zk_GnvRH5iQxmo7dw

# Sheet name (tab name)
GOOGLE_SHEET_NAME=Sheet1

# From your Google Cloud OAuth credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

# From your Supabase project settings
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-key
SUPABASE_TABLE_NAME=your_table_name
```

### 5. Authorize the App

Run the authorization script to authenticate with Google:

```bash
npm run authorize
```

This will:
1. Generate an authorization URL
2. Open it in your browser (or copy/paste it)
3. Ask you to grant access to your Google Sheets
4. Provide an authorization code to paste back into the terminal
5. Save the access token to `token.json`

**You only need to do this once.** The token will be automatically refreshed when needed.

## Usage

### Run the sync:

```bash
# Development (with ts-node)
npm run dev

# Production (build and run)
npm run sync
```

### Build only:

```bash
npm run build
```

## Sync Strategies

The app supports two sync strategies (configured in `src/supabase.ts`):

### 1. Upsert (Default)
Updates existing rows and inserts new ones based on a unique constraint.

```typescript
await syncDataToSupabase(data);
```

### 2. Full Replacement
Deletes all existing data and inserts fresh data.

```typescript
await replaceAllData(data);
```

Edit `src/index.ts` to switch between strategies.

## Scheduling

To run this automatically on a schedule:

### Linux/Mac (cron):
```bash
# Edit crontab
crontab -e

# Add this line to run every hour
0 * * * * cd /path/to/project && npm run sync >> /var/log/sheets-sync.log 2>&1
```

### Windows (Task Scheduler):
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily, hourly)
4. Action: Start a program
5. Program: `npm`
6. Arguments: `run sync`
7. Start in: `C:\path\to\project`

### Cloud Options:
- **Vercel Cron**: Deploy as serverless function with cron trigger
- **AWS Lambda + EventBridge**: Schedule Lambda execution
- **GitHub Actions**: Use workflow schedule

## Troubleshooting

### Authentication Error
- Run `npm run authorize` to generate a fresh token
- Ensure you've granted access to the Google Sheets API scope
- Check that Client ID and Client Secret are correct in `.env`
- Verify the redirect URI matches what's configured in Google Cloud Console

### Supabase Error
- Ensure table name matches `SUPABASE_TABLE_NAME`
- Verify column names match your sheet headers
- Check that unique constraint exists for upsert

### No Data Found
- Verify `GOOGLE_SHEET_NAME` matches the tab name in your sheet
- Ensure sheet has data with headers in the first row

## Project Structure

```
.
├── src/
│   ├── index.ts          # Main entry point
│   ├── authorize.ts      # OAuth authorization script
│   ├── auth.ts           # OAuth token management
│   ├── config.ts         # Environment configuration
│   ├── googleSheets.ts   # Google Sheets API logic
│   └── supabase.ts       # Supabase sync logic
├── .env                  # Your credentials (not in git)
├── .env.example          # Example environment file
├── token.json            # OAuth token (auto-generated, not in git)
├── package.json
├── tsconfig.json
└── README.md
```

## License

ISC
