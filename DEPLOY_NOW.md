# Deploy IndexFlow - Quick Commands

Your code is ready! Here's how to deploy it.

## GitHub Repository

✅ **Already Created**: https://github.com/adityash8/index-flow

---

## Option 1: Railway (RECOMMENDED)

Railway is the best choice - it has persistent storage and works perfectly with webhooks.

### Quick Deploy (5 minutes):

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Create new project from GitHub
# Just run this and select the repo when prompted:
railway link

# Or create new project:
railway init

# 4. Deploy
railway up

# 5. Add environment variables
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set WEBFLOW_CLIENT_ID=your_client_id
railway variables set WEBFLOW_CLIENT_SECRET=your_client_secret
railway variables set INDEXNOW_API_KEY=your_32_char_key
railway variables set GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# 6. Get your deployment URL
railway domain

# 7. Update PUBLIC_URL with your Railway domain
railway variables set PUBLIC_URL=https://your-app.up.railway.app
```

### Or Deploy via Web UI:

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `adityash8/index-flow`
5. Add environment variables in the UI
6. Click "Deploy"

**Railway Free Tier**: $5 credit/month (enough for this app)

---

## Option 2: Render

Render also works great with persistent volumes.

### Quick Deploy:

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub account
4. Select `adityash8/index-flow` repository
5. Configure:
   - **Name**: indexflow
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add environment variables (same as above)
7. **Important**: Add a Disk
   - Go to "Disks" tab
   - Click "Add Disk"
   - Mount Path: `/opt/render/project/src/data`
   - Size: 1GB (free)
8. Click "Create Web Service"

**Render Free Tier**: Available (with limitations)

---

## Option 3: Vercel (NOT RECOMMENDED)

⚠️ **Warning**: Vercel doesn't support persistent SQLite databases. See [VERCEL_NOTES.md](./VERCEL_NOTES.md).

If you still want to try Vercel:

```bash
vercel
```

Then set environment variables:
```bash
vercel env add WEBFLOW_CLIENT_ID
vercel env add WEBFLOW_CLIENT_SECRET
vercel env add INDEXNOW_API_KEY
vercel env add GOOGLE_SERVICE_ACCOUNT_JSON
vercel env add PUBLIC_URL
```

Deploy to production:
```bash
vercel --prod
```

**You'll need to switch to an external database** (Vercel Postgres, Supabase, etc.) for this to work properly.

---

## Option 4: Heroku

Classic choice, works well.

```bash
# 1. Install Heroku CLI (if not installed)
# macOS: brew install heroku/brew/heroku

# 2. Login
heroku login

# 3. Create app
heroku create indexflow-YOUR_NAME

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set WEBFLOW_CLIENT_ID=your_client_id
heroku config:set WEBFLOW_CLIENT_SECRET=your_client_secret
heroku config:set INDEXNOW_API_KEY=your_key
heroku config:set GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
heroku config:set PUBLIC_URL=https://your-app.herokuapp.com

# 5. Deploy
git push heroku main

# 6. Check logs
heroku logs --tail
```

---

## After Deployment

No matter which platform you choose, after deploying:

### 1. Note Your Deployment URL
Example: `https://indexflow.up.railway.app`

### 2. Update Webflow App Settings

1. Go to https://webflow.com/dashboard/apps
2. Find your IndexFlow app
3. Add redirect URL: `https://your-deployment-url.com/auth/callback`

### 3. Connect Your Webflow Site

1. Visit: `https://your-deployment-url.com`
2. Click "Connect Webflow"
3. Authorize your site

### 4. Set Up Webhooks in Webflow

Go to your Webflow site → Settings → Integrations → Webhooks

**Add these two webhooks:**

1. **Item Changed**
   - Trigger: `collection_item_changed`
   - URL: `https://your-deployment-url.com/webhooks/item-changed`

2. **Site Publish**
   - Trigger: `site_publish`
   - URL: `https://your-deployment-url.com/webhooks/site-publish`

### 5. Test It!

1. Create/edit a blog post in Webflow
2. Publish your site
3. Check dashboard: `https://your-deployment-url.com/dashboard`
4. You should see your URL submitted!

---

## Troubleshooting

### Can't access the site?
- Check deployment logs
- Verify environment variables are set
- Make sure PUBLIC_URL is correct

### Webhooks not working?
- Verify webhook URLs in Webflow
- Check webhook logs in Webflow
- View server logs for errors

### Database issues?
- On Railway/Render: Should work automatically
- On Vercel: You need an external database (see VERCEL_NOTES.md)

---

## Recommended: Railway

**We strongly recommend Railway** because:
- ✅ Persistent storage out of the box
- ✅ Perfect for webhooks
- ✅ Automatic deployments from GitHub
- ✅ Simple environment variable management
- ✅ Free tier available
- ✅ No configuration needed

---

## Quick Start Command (Railway)

If you have Railway CLI installed, just run:

```bash
railway login && railway init && railway up
```

Then add your environment variables in the Railway dashboard!

---

## Need Help?

- **Documentation**: See [README.md](./README.md)
- **Quick Start**: See [QUICKSTART.md](./QUICKSTART.md)
- **Detailed Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: https://github.com/adityash8/index-flow/issues

---

🚀 **Ready to deploy?** Choose Railway for the easiest experience!
