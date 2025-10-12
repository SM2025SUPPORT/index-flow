# How to Deploy and Use IndexFlow on Railway

## Step-by-Step Guide

### Part 1: Deploy to Railway (5 minutes)

#### Option A: Deploy via Web UI (Easiest)

1. **Go to Railway**
   - Visit: https://railway.app
   - Click "Login" and sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `adityash8/index-flow`
   - Click "Deploy Now"

3. **Wait for Initial Deployment**
   - Railway will automatically detect it's a Node.js app
   - It will run `npm install` and `npm start`
   - Wait 1-2 minutes for first deployment

4. **Add Environment Variables**
   - In your project, click on the service
   - Go to "Variables" tab
   - Click "New Variable" and add these one by one:

   ```
   NODE_ENV=production
   PORT=3000
   ```

   **Leave these empty for now** (we'll add them after getting Webflow credentials):
   ```
   WEBFLOW_CLIENT_ID=
   WEBFLOW_CLIENT_SECRET=
   PUBLIC_URL=
   INDEXNOW_API_KEY=
   GOOGLE_SERVICE_ACCOUNT_JSON=
   ```

5. **Generate a Domain**
   - Go to "Settings" tab
   - Scroll to "Networking"
   - Click "Generate Domain"
   - You'll get something like: `https://index-flow-production.up.railway.app`
   - **Copy this URL** - you'll need it!

6. **Update PUBLIC_URL Variable**
   - Go back to "Variables" tab
   - Set `PUBLIC_URL` to your Railway domain
   - Example: `https://index-flow-production.up.railway.app`

---

### Part 2: Set Up Webflow App (5 minutes)

Now that you have a live URL, let's create the Webflow app:

1. **Go to Webflow Apps Dashboard**
   - Visit: https://webflow.com/dashboard/apps
   - Click "Create New App"

2. **Fill in App Details**
   - **App Name**: IndexFlow
   - **Description**: Auto-indexing for Webflow sites
   - **Homepage URL**: Your Railway URL (from above)
   - **Icon**: (optional, can add later)

3. **Add Redirect URL**
   - Click "Add Redirect URL"
   - Enter: `https://your-railway-url.up.railway.app/auth/callback`
   - Replace with YOUR actual Railway URL
   - Example: `https://index-flow-production.up.railway.app/auth/callback`

4. **Save and Get Credentials**
   - Click "Create App"
   - You'll see your **Client ID** and **Client Secret**
   - **Copy both** - you'll need them next!

---

### Part 3: Add Credentials to Railway (2 minutes)

1. **Go Back to Railway**
   - Open your Railway project
   - Go to "Variables" tab

2. **Add Webflow Credentials**
   ```
   WEBFLOW_CLIENT_ID=your_client_id_from_webflow
   WEBFLOW_CLIENT_SECRET=your_client_secret_from_webflow
   ```

3. **Generate IndexNow Key** (optional but recommended)
   - Visit: https://www.bing.com/indexnow
   - Click "Get API Key"
   - Copy the 32-character key
   - Add to Railway:
   ```
   INDEXNOW_API_KEY=your_32_character_key
   ```

4. **Add Google Service Account** (optional but recommended)
   - See "Part 5: Google Setup" below for how to get this
   - Add to Railway:
   ```
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
   ```
   - **Important**: Paste the entire JSON as one line!

5. **Redeploy**
   - Railway will automatically redeploy when you add variables
   - Wait 1-2 minutes for redeployment

---

### Part 4: Connect Your Webflow Site (2 minutes)

1. **Visit Your IndexFlow App**
   - Go to: `https://your-railway-url.up.railway.app`
   - You should see a nice landing page

2. **Connect Webflow**
   - Click "Connect Webflow" button
   - Login to Webflow if prompted
   - Select your Webflow site
   - Click "Authorize"
   - You should see a success page!

3. **Note Your Site ID**
   - The success page will show your connected site ID
   - Keep this handy (though you won't need it often)

---

### Part 5: Set Up Webhooks in Webflow (3 minutes)

This is the crucial step that makes auto-indexing work!

1. **Go to Your Webflow Site**
   - Open your Webflow site
   - Go to "Site Settings" (gear icon)
   - Navigate to: **Integrations** → **Webhooks**

2. **Add First Webhook (Item Changes)**
   - Click "Add Webhook"
   - **Trigger Type**: Select `collection_item_changed`
   - **URL**: `https://your-railway-url.up.railway.app/webhooks/item-changed`
   - Click "Add Webhook"

3. **Add Second Webhook (Site Publish)**
   - Click "Add Webhook" again
   - **Trigger Type**: Select `site_publish`
   - **URL**: `https://your-railway-url.up.railway.app/webhooks/site-publish`
   - Click "Add Webhook"

4. **Verify Webhooks**
   - You should see both webhooks listed
   - Status should show as active

---

### Part 6: Test It! (2 minutes)

1. **Open Dashboard**
   - Visit: `https://your-railway-url.up.railway.app/dashboard`
   - You should see stats (all zeros initially)

2. **Publish Content in Webflow**
   - Go to your Webflow site
   - Create or edit a blog post
   - Make sure it's not a draft
   - Click "Publish Site"

3. **Check Dashboard**
   - Refresh your IndexFlow dashboard
   - Within 10-30 seconds, you should see:
     - Total submissions increased
     - Your URL in the submissions table
     - Status showing "success" for IndexNow and Google

4. **Check Railway Logs**
   - In Railway, go to "Deployments" tab
   - Click "View Logs"
   - You should see log entries like:
     ```
     [Webhook] Site publish: {...}
     [IndexNow] Success: [your-url]
     [Google] Success: {...}
     ```

---

## How to Access and Use

### Main URLs

Once deployed, you'll have these URLs:

1. **Home Page**
   - `https://your-railway-url.up.railway.app/`
   - Landing page with "Connect Webflow" button

2. **Dashboard** (Your main control panel)
   - `https://your-railway-url.up.railway.app/dashboard`
   - See all submissions, stats, and history
   - Auto-refreshes every 30 seconds

3. **Health Check**
   - `https://your-railway-url.up.railway.app/health`
   - Check if the app is running

### What Happens Automatically

Once set up, IndexFlow runs completely on autopilot:

1. **You publish content in Webflow** → No IndexFlow interaction needed
2. **Webflow sends webhook** → IndexFlow receives it automatically
3. **IndexFlow submits URLs** → To both IndexNow and Google
4. **Search engines get notified** → Instant crawling begins
5. **Dashboard updates** → You can check status anytime

### Dashboard Features

The dashboard shows:
- **Total Submissions**: How many URLs you've submitted
- **IndexNow Success**: Success rate for IndexNow submissions
- **Google Success**: Success rate for Google submissions
- **Recent Submissions Table**: Shows all recent URLs with status

### Manual Operations

If you want to manually submit a URL, you can use the API:

```bash
curl -X POST https://your-railway-url.up.railway.app/api/submit-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/blog/post",
    "siteId": "your_webflow_site_id"
  }'
```

### Checking Logs

To see what's happening behind the scenes:

1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" tab
4. Click "View Logs"
5. See real-time logs of all activity

---

## Part 7: Optional - Google Search Console Setup

For Google Indexing API to work, you need a service account:

### Get Google Service Account Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create Project**
   - Click "Select a project" → "New Project"
   - Name: "indexflow"
   - Click "Create"

3. **Enable Indexing API**
   - In the search bar, type: "Web Search Indexing API"
   - Click on it
   - Click "Enable"

4. **Create Service Account**
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: "indexflow-indexing"
   - Click "Create and Continue"
   - Skip the optional steps
   - Click "Done"

5. **Create JSON Key**
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key"
   - Choose "JSON"
   - Click "Create"
   - A JSON file will download

6. **Get Service Account Email**
   - Open the downloaded JSON file
   - Find the line: `"client_email": "indexflow-indexing@....iam.gserviceaccount.com"`
   - Copy this email address

7. **Add to Google Search Console**
   - Go to: https://search.google.com/search-console
   - Select your property (your website)
   - Click "Settings" (left sidebar)
   - Click "Users and permissions"
   - Click "Add user"
   - Paste the service account email
   - Select "Owner" permission
   - Click "Add"

8. **Add to Railway**
   - Open the JSON file you downloaded
   - Copy the ENTIRE contents (all the JSON)
   - Go to Railway → Variables
   - Add new variable: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Paste the entire JSON as the value (as a single line)
   - Railway will auto-redeploy

---

## Troubleshooting

### "Site not registered" error
- Make sure you completed Part 4 (Connect Webflow Site)
- Check Railway logs for authentication errors

### Webhooks not firing
- Verify webhook URLs in Webflow are correct
- Make sure they include your Railway domain
- Check Webflow webhook logs (in Webflow site settings)

### Database errors
- Railway handles database automatically
- If issues persist, check Railway logs
- Database is stored in Railway's persistent volume

### Google API errors
- Verify service account is added to Search Console as "Owner"
- Check API is enabled in Google Cloud
- Validate JSON credentials format (must be single line)

---

## Monitoring and Maintenance

### Check Status Anytime
- Dashboard: `https://your-railway-url.up.railway.app/dashboard`
- Health: `https://your-railway-url.up.railway.app/health`

### View Submissions
- All submissions are saved in the database
- Dashboard shows last 50 submissions
- Auto-refreshes every 30 seconds

### Railway Dashboard
- View logs in real-time
- Monitor resource usage
- Check deployment status

---

## Costs

### Railway Pricing
- **Free Tier**: $5 in usage credits per month
- **This app usage**: ~$1-2/month (well within free tier)
- **If you exceed free tier**: $5/month for Hobby plan

### How to Monitor Usage
1. Go to Railway dashboard
2. Click "Usage" tab
3. See current month's usage
4. You'll get email alerts if approaching limit

---

## Summary

**Once deployed and set up, you'll:**

1. ✅ Have a live URL: `https://your-app.up.railway.app`
2. ✅ Access dashboard anytime at: `/dashboard`
3. ✅ See all submissions and stats in real-time
4. ✅ Never manually submit URLs again
5. ✅ Get instant indexing for all new Webflow content

**The app runs 24/7 on autopilot!**

Every time you publish in Webflow:
- Webhook fires → IndexFlow receives it
- URLs submitted → IndexNow + Google
- Dashboard updates → You can check status

**Zero manual work required after setup!**

---

## Need Help?

- Check Railway logs for errors
- Visit dashboard to see submission status
- Open GitHub issue: https://github.com/adityash8/index-flow/issues
- See other docs: README.md, QUICKSTART.md, DEPLOYMENT.md

---

## Quick Reference

| What | URL |
|------|-----|
| Home | `https://your-railway-url.up.railway.app/` |
| Dashboard | `https://your-railway-url.up.railway.app/dashboard` |
| Connect Webflow | `https://your-railway-url.up.railway.app/auth/webflow` |
| Health Check | `https://your-railway-url.up.railway.app/health` |
| Item Changed Webhook | `https://your-railway-url.up.railway.app/webhooks/item-changed` |
| Site Publish Webhook | `https://your-railway-url.up.railway.app/webhooks/site-publish` |

Replace `your-railway-url` with your actual Railway domain!

---

**Ready?** Go to https://railway.app and follow Part 1! 🚀
