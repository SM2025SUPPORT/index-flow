# IndexFlow - Quick Start Guide

Get your Webflow auto-indexing up and running in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- A Webflow site with CMS collections
- 10 minutes of your time

## Step 1: Install Dependencies

```bash
cd index-flow
npm install
```

## Step 2: Get Your API Credentials

### A. Webflow App Credentials

1. Go to https://webflow.com/dashboard/apps
2. Click **"Create New App"**
3. Fill in:
   - Name: `IndexFlow`
   - Description: `Auto-indexing tool`
   - Homepage URL: `http://localhost:3000`
4. Add redirect URL: `http://localhost:3000/auth/callback`
5. Save and copy your **Client ID** and **Client Secret**

### B. IndexNow API Key

**Option 1: Generate Online**
1. Visit https://www.bing.com/indexnow
2. Click "Get API Key"
3. Copy the 32-character key

**Option 2: Let Setup Generate One**
- Skip this step, the setup script will generate one for you

### C. Google Indexing API (Optional but Recommended)

1. Go to https://console.cloud.google.com/
2. Create a new project: `indexflow`
3. Enable **"Web Search Indexing API"**:
   - Search for "Web Search Indexing API"
   - Click "Enable"
4. Create Service Account:
   - Go to **IAM & Admin** → **Service Accounts**
   - Click **"Create Service Account"**
   - Name: `indexflow-indexing`
   - Click "Create and Continue"
   - Skip optional steps
5. Create JSON Key:
   - Click on the service account you just created
   - Go to **"Keys"** tab
   - Click **"Add Key"** → **"Create New Key"**
   - Choose **JSON**
   - Download the file
6. Add to Google Search Console:
   - Open the downloaded JSON file
   - Copy the `client_email` value (looks like `indexflow-indexing@project-id.iam.gserviceaccount.com`)
   - Go to your [Google Search Console](https://search.google.com/search-console)
   - Select your property
   - Click **Settings** → **Users and Permissions**
   - Click **"Add User"**
   - Paste the service account email
   - Choose **"Owner"** permission
   - Click **"Add"**

## Step 3: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your editor and fill in:

```bash
# Server
PORT=3000
NODE_ENV=development
PUBLIC_URL=http://localhost:3000

# Webflow (from Step 2A)
WEBFLOW_CLIENT_ID=your_client_id_here
WEBFLOW_CLIENT_SECRET=your_client_secret_here

# IndexNow (from Step 2B, or leave empty to auto-generate)
INDEXNOW_API_KEY=your_32_character_key_here

# Google (from Step 2C - paste entire JSON contents as single line)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

**Important:** For `GOOGLE_SERVICE_ACCOUNT_JSON`:
- Open your downloaded JSON file
- Copy EVERYTHING (including the curly braces)
- Paste it as a single line in the .env file
- Remove any line breaks

Example:
```bash
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"indexflow-123","private_key_id":"abc123",...}
```

## Step 4: Run Setup

```bash
npm run setup
```

This will:
- ✅ Validate your configuration
- ✅ Initialize the database
- ✅ Generate IndexNow key file (if not provided)
- ✅ Test Google API connection

If you see any errors, go back and check your credentials.

## Step 5: Start the Server

```bash
npm run dev
```

You should see:
```
[IndexFlow] Server running on http://localhost:3000
[IndexFlow] Dashboard: http://localhost:3000/dashboard
[IndexFlow] Connect Webflow: http://localhost:3000/auth/webflow
```

## Step 6: Connect Your Webflow Site

1. Open your browser and go to: **http://localhost:3000**
2. Click **"Connect Webflow"**
3. Log in to Webflow if prompted
4. Select your site
5. Click **"Authorize"**
6. You should see a success page!

## Step 7: Set Up Webhooks in Webflow

This is the crucial step that makes auto-indexing work!

1. Go to your Webflow site settings
2. Navigate to: **Integrations** → **Webhooks**
3. Add two webhooks:

**Webhook 1: Detect Item Changes**
- Trigger Type: `collection_item_changed`
- URL: `http://localhost:3000/webhooks/item-changed`
- Click "Add Webhook"

**Webhook 2: Detect Publishing**
- Trigger Type: `site_publish`
- URL: `http://localhost:3000/webhooks/site-publish`
- Click "Add Webhook"

**For Production:** Replace `http://localhost:3000` with your deployed URL.

## Step 8: Test It!

1. Go to your Webflow site
2. Create or edit a blog post
3. Publish your site
4. Go to the dashboard: **http://localhost:3000/dashboard**
5. You should see your URL submitted to IndexNow and Google!

## Verify Everything Works

### Check Dashboard
- Visit: http://localhost:3000/dashboard
- You should see submission stats and history

### Check IndexNow Key
- Visit: http://localhost:3000/YOUR_KEY.txt
- Should return your 32-character key

### Check Logs
Watch the terminal where you ran `npm run dev`. You should see:
```
[Webhook] Item changed: {...}
[Webhook] Site publish: {...}
[IndexNow] Success: [url]
[Google] Success: {...}
```

## What Happens Next?

**Every time you publish new content in Webflow:**

1. ✅ Webflow sends webhook to IndexFlow
2. ✅ IndexFlow detects new/updated content
3. ✅ IndexFlow submits URLs to IndexNow (Bing, Yandex, etc.)
4. ✅ IndexFlow submits URLs to Google Indexing API
5. ✅ Search engines get notified instantly
6. ✅ Your content gets crawled faster

**No manual work required!**

## Next Steps

### Production Deployment

When you're ready to deploy:

1. Choose a hosting platform (Railway, Render, Heroku, etc.)
2. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
3. Update your Webflow app redirect URLs
4. Update webhooks to use production URL

### Troubleshooting

**Webhooks not firing?**
- Make sure your server is running
- Check webhook URLs are correct
- For local development, use ngrok to expose localhost

**Google API errors?**
- Verify service account email is added to Search Console as Owner
- Check the API is enabled in Google Cloud
- Validate your JSON credentials format

**IndexNow not working?**
- Ensure key file is accessible
- Check key is exactly 32 characters
- Verify URLs are absolute (include https://)

**Database issues?**
- Check `data/` directory exists and is writable
- Try deleting `data/indexflow.db` and running setup again

### Using ngrok for Local Testing

If you want to test webhooks locally:

```bash
# Install ngrok
npm install -g ngrok

# Expose localhost:3000
ngrok http 3000

# Use the ngrok URL for webhooks
# Example: https://abc123.ngrok.io/webhooks/item-changed
```

## API Endpoints

### Authentication
- `GET /auth/webflow` - Connect Webflow site
- `GET /auth/callback` - OAuth callback

### Dashboard
- `GET /` - Home page
- `GET /dashboard` - View submissions dashboard

### Webhooks (called by Webflow)
- `POST /webhooks/item-changed` - CMS item changed
- `POST /webhooks/site-publish` - Site published

### API (for manual operations)
- `POST /api/submit-url` - Manually submit a URL
- `GET /api/submissions` - Get submission history
- `GET /api/stats` - Get statistics
- `GET /api/sites` - List connected sites
- `GET /api/health` - Health check

## Manual URL Submission

You can also manually submit URLs via API:

```bash
curl -X POST http://localhost:3000/api/submit-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/blog/post",
    "siteId": "your_site_id"
  }'
```

## FAQ

**Q: Does Google officially support IndexNow?**
A: No, as of 2025, Google does not support IndexNow. That's why we also use Google's Indexing API.

**Q: Will I get penalized for using Google Indexing API for non-job posts?**
A: The API is officially for JobPosting and BroadcastEvent, but it works for any URL. Use at your own discretion.

**Q: How many URLs can I submit?**
A: IndexNow supports up to 10,000 URLs per request. Google Indexing API has daily quotas.

**Q: Do I need both IndexNow and Google?**
A: IndexNow handles Bing/Yandex/etc., Google Indexing API handles Google. Use both for maximum coverage.

**Q: Can I use this with non-blog content?**
A: Yes! It works with any CMS collection in Webflow.

**Q: How long until my content is indexed?**
A: IndexNow/Google API notify search engines immediately, but crawling/indexing time varies (hours to days).

**Q: Is this better than submitting via Search Console manually?**
A: Yes! It's automatic, instant, and submits to multiple search engines.

## Support

- **Issues**: Open an issue on GitHub
- **Docs**: See [README.md](./README.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**That's it!** You now have automatic indexing set up for your Webflow site. Every time you publish new content, it will automatically be submitted to Google and IndexNow.

Happy indexing! 🚀
