# Vercel Deployment Notes

## ⚠️ Important Limitations

**Vercel is NOT the ideal platform for IndexFlow** due to the following constraints:

### 1. No Persistent Storage
- Vercel is serverless - file system is read-only and ephemeral
- SQLite database will be lost on every deployment
- **Solution**: Use Vercel Postgres, Vercel KV, or external database

### 2. Webhook Challenges
- Webhooks require persistent, always-on endpoints
- Serverless functions have cold starts
- May miss webhooks during cold starts
- **Solution**: Use Railway or Render instead

### 3. Better Alternatives

We strongly recommend using:
1. **Railway** - Has persistent volumes, perfect for this app
2. **Render** - Also has persistent storage
3. **Heroku** - Classic choice
4. **DigitalOcean** - App Platform with volumes

See [DEPLOYMENT.md](./DEPLOYMENT.md) for guides.

## If You Must Use Vercel

If you want to deploy to Vercel anyway, you'll need to:

### Option 1: Use Vercel Postgres

1. Create Vercel Postgres database
2. Modify `src/config/database.js` to use PostgreSQL instead of SQLite
3. Install `pg` package: `npm install pg`
4. Update connection string in environment variables

### Option 2: Use External Database

1. Use a managed database (Supabase, PlanetScale, etc.)
2. Modify database configuration
3. Update environment variables

### Steps to Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add WEBFLOW_CLIENT_ID
vercel env add WEBFLOW_CLIENT_SECRET
vercel env add INDEXNOW_API_KEY
vercel env add GOOGLE_SERVICE_ACCOUNT_JSON
vercel env add PUBLIC_URL

# Deploy to production
vercel --prod
```

## Recommended: Deploy to Railway Instead

Railway is much better suited for this application:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Add environment variables
railway variables set WEBFLOW_CLIENT_ID=...
railway variables set WEBFLOW_CLIENT_SECRET=...
railway variables set INDEXNOW_API_KEY=...
railway variables set GOOGLE_SERVICE_ACCOUNT_JSON=...

# Get your URL
railway domain
```

## Why Railway/Render is Better

1. ✅ **Persistent Storage** - Database doesn't get wiped
2. ✅ **Always-On Server** - No cold starts for webhooks
3. ✅ **Simpler Setup** - Works out of the box
4. ✅ **Better Performance** - Long-running server vs serverless
5. ✅ **Same Cost** - Free tier available

## Need Help?

If you're having issues with Vercel deployment, please:
1. Consider switching to Railway/Render
2. Open a GitHub issue
3. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide

---

**TL;DR**: IndexFlow works best on Railway or Render, not Vercel. Vercel lacks persistent storage needed for SQLite database.
