# Setting Up Google Sheets Integration

This guide will help you set up a Google Sheets integration to import data into the Happy Hour Deals database.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API in your project

## Step 2: Create a Service Account

1. In the Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name like "happy-hour-deals-sheets"
4. Grant it the "Editor" role
5. Create a new key for the service account (JSON format)
6. Download the key file and keep it secure

## Step 3: Set Up Your Google Sheet

1. Create a new Google Sheet with two sheets named "Establishments" and "Deals"
2. Format the sheets according to the template in `GOOGLE_SHEETS_TEMPLATE.md`
3. Share the Google Sheet with the service account email address (it will look like `name@project-id.iam.gserviceaccount.com`)
4. Make sure to give the service account "Editor" access to the sheet

## Step 4: Set Environment Variables

You need to set three environment secrets in your Replit project:

1. `GOOGLE_SHEETS_SPREADSHEET_ID`: The ID of your Google Sheet (found in the URL: `https://docs.google.com/spreadsheets/d/[THIS-IS-THE-ID]/edit`)
2. `GOOGLE_SHEETS_CLIENT_EMAIL`: The email address of your service account
3. `GOOGLE_SHEETS_PRIVATE_KEY`: The private key from your service account key file

To set these in Replit:

1. Go to your project's "Secrets" tab in the tools sidebar
2. Add each secret with the correct key name and value

## Step 5: Test Your Connection

Run the connection test script to verify everything is working:

```bash
./test-sheets-connection.sh
```

If successful, you'll see information about your Google Sheet, including the sheets it contains.

## Step 6: Import Data

Once your connection is working, you can import data from your Google Sheet to the database:

```bash
# Import both establishments and deals
./db-sync.sh all

# Or import just establishments
./db-sync.sh establishments

# Or import just deals
./db-sync.sh deals
```

## Troubleshooting

### Missing or Invalid Credentials

If you see errors about missing or invalid credentials:
- Verify you've set all three environment secrets
- Make sure the private key is properly formatted (it should be the entire key, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
- Check that the service account has "Editor" access to your Google Sheet

### Sheet Not Found or Access Denied

If you see errors about not being able to access the sheet:
- Verify your spreadsheet ID is correct
- Make sure you've shared the sheet with the service account email
- Ensure the sheet is not restricted or in a special state (like "restricted download" mode)

### Import Errors

If some deals fail to import:
- Make sure establishment names match exactly (case sensitive)
- Verify that all required fields have valid values
- Check the console output for specific error messages

### Database Errors

If you see database-related errors:
- Ensure your PostgreSQL database is running
- Verify that the `DATABASE_URL` environment variable is correctly set
- Check if the required tables exist by running `npx drizzle-kit push`