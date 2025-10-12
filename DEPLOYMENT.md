# Deployment Guide

This guide covers deploying IndexFlow to various platforms.

## Before Deploying

### 1. Set Up Webflow App

1. Go to [Webflow Apps Dashboard](https://webflow.com/dashboard/apps)
2. Click "Create New App"
3. Fill in app details:
   - **Name**: IndexFlow
   - **Description**: Auto-indexing for Webflow
   - **Homepage URL**: Your deployed URL
   - **Redirect URLs**: Add your production callback URL (e.g., `https://your-app.com/auth/callback`)
4. Save and note your **Client ID** and **Client Secret**

### 2. Set Up Google Indexing API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Web Search Indexing API"
4. Go to "Credentials" → "Create Credentials" → "Service Account"
5. Create service account with name "indexflow"
6. Click on the service account → "Keys" → "Add Key" → "Create New Key" → "JSON"
7. Download the JSON file
8. Copy the entire JSON content (it will be used as environment variable)
9. Add the service account email (from the JSON) to your Google Search Console property as an owner

### 3. Generate IndexNow Key

Visit https://www.bing.com/indexnow and generate a 32-character key.

---

## Railway Deployment

Railway is recommended for its simplicity and built-in database support.

### Steps:

1. **Install Railway CLI** (optional):
   ```bash
   npm install -g @railway/cli
   ```

2. **Create Railway Project**:
   - Go to https://railway.app
   - Create new project
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add Environment Variables**:
   Go to your project → Variables and add:
   ```
   NODE_ENV=production
   PUBLIC_URL=https://your-app.railway.app
   WEBFLOW_CLIENT_ID=your_client_id
   WEBFLOW_CLIENT_SECRET=your_client_secret
   INDEXNOW_API_KEY=your_32_char_key
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   DATABASE_PATH=/app/data/indexflow.db
   ```

4. **Deploy**:
   - Railway will automatically deploy
   - Note your app URL (e.g., `https://indexflow-production.up.railway.app`)

5. **Update Webflow App**:
   - Add your Railway URL to Webflow app redirect URLs
   - Update `PUBLIC_URL` environment variable to your Railway URL

---

## Render Deployment

### Steps:

1. **Create New Web Service**:
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   - **Name**: indexflow
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or higher)

3. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PUBLIC_URL=https://your-app.onrender.com
   WEBFLOW_CLIENT_ID=your_client_id
   WEBFLOW_CLIENT_SECRET=your_client_secret
   INDEXNOW_API_KEY=your_32_char_key
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   DATABASE_PATH=/opt/render/project/src/data/indexflow.db
   ```

4. **Add Persistent Disk** (Important!):
   - Go to "Disks" → "Add Disk"
   - Mount path: `/opt/render/project/src/data`
   - This ensures your database persists across deployments

5. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete

---

## Heroku Deployment

### Steps:

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku App**:
   ```bash
   heroku create indexflow
   ```

3. **Add Buildpack**:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PUBLIC_URL=https://your-app.herokuapp.com
   heroku config:set WEBFLOW_CLIENT_ID=your_client_id
   heroku config:set WEBFLOW_CLIENT_SECRET=your_client_secret
   heroku config:set INDEXNOW_API_KEY=your_32_char_key
   heroku config:set GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

6. **Check Logs**:
   ```bash
   heroku logs --tail
   ```

---

## DigitalOcean App Platform

### Steps:

1. **Create New App**:
   - Go to https://cloud.digitalocean.com/apps
   - Click "Create App"
   - Connect your GitHub repository

2. **Configure App**:
   - **Name**: indexflow
   - **Branch**: main
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`

3. **Add Environment Variables**:
   Add all required environment variables in the app settings

4. **Add Persistent Volume** (for database):
   - Go to "Components" → "Add Component" → "Database"
   - Or mount a volume for SQLite database

5. **Deploy**:
   - Click "Create Resources"
   - Wait for deployment

---

## VPS / Self-Hosted (Ubuntu)

### Prerequisites:
- Ubuntu 20.04+ server
- Node.js 18+ installed
- Nginx installed
- Domain name (optional)

### Steps:

1. **Clone Repository**:
   ```bash
   git clone <your-repo-url>
   cd index-flow
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` File**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Fill in all environment variables

4. **Run Setup**:
   ```bash
   npm run setup
   ```

5. **Install PM2** (Process Manager):
   ```bash
   npm install -g pm2
   ```

6. **Start Application**:
   ```bash
   pm2 start src/server.js --name indexflow
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx** (Reverse Proxy):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Enable Site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/indexflow /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Set Up SSL** (with Let's Encrypt):
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## Docker Deployment

### Steps:

1. **Build Image**:
   ```bash
   docker build -t indexflow .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     --name indexflow \
     -p 3000:3000 \
     -e NODE_ENV=production \
     -e PUBLIC_URL=https://your-domain.com \
     -e WEBFLOW_CLIENT_ID=your_client_id \
     -e WEBFLOW_CLIENT_SECRET=your_client_secret \
     -e INDEXNOW_API_KEY=your_key \
     -e GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
     -v indexflow_data:/app/data \
     indexflow
   ```

3. **Check Logs**:
   ```bash
   docker logs -f indexflow
   ```

### Docker Compose:

```yaml
version: '3.8'

services:
  indexflow:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PUBLIC_URL=https://your-domain.com
      - WEBFLOW_CLIENT_ID=${WEBFLOW_CLIENT_ID}
      - WEBFLOW_CLIENT_SECRET=${WEBFLOW_CLIENT_SECRET}
      - INDEXNOW_API_KEY=${INDEXNOW_API_KEY}
      - GOOGLE_SERVICE_ACCOUNT_JSON=${GOOGLE_SERVICE_ACCOUNT_JSON}
    volumes:
      - indexflow_data:/app/data
    restart: unless-stopped

volumes:
  indexflow_data:
```

Run with:
```bash
docker-compose up -d
```

---

## Post-Deployment Checklist

After deploying to any platform:

### 1. Update Webflow App Settings
- Add production callback URL to Webflow app
- Update redirect URIs

### 2. Test Authentication
- Visit `https://your-app.com/auth/webflow`
- Complete OAuth flow
- Verify site is registered

### 3. Set Up Webhooks in Webflow
For each site:
1. Go to Site Settings → Integrations → Webhooks
2. Add webhook for `collection_item_changed`:
   - URL: `https://your-app.com/webhooks/item-changed`
3. Add webhook for `site_publish`:
   - URL: `https://your-app.com/webhooks/site-publish`
4. Test webhooks by publishing content

### 4. Verify IndexNow Key File
- Visit `https://your-app.com/<your-key>.txt`
- Should return your IndexNow API key

### 5. Test Submission
- Publish a blog post in Webflow
- Check dashboard: `https://your-app.com/dashboard`
- Verify submissions appear

### 6. Monitor Logs
- Check application logs for errors
- Monitor IndexNow and Google API responses

---

## Troubleshooting

### Database Issues
If database resets on restart:
- Ensure persistent storage/volume is configured
- Check `DATABASE_PATH` points to persistent location

### Webhook Not Firing
- Verify webhook URLs are correct in Webflow
- Check server is publicly accessible
- View webhook logs in Webflow

### Google API Errors
- Verify service account is added to Search Console
- Check API is enabled in Google Cloud
- Validate JSON credentials format

### IndexNow Failures
- Ensure key file is accessible at `https://your-site.com/<key>.txt`
- Verify key is exactly 32 characters
- Check URL format (must be absolute URLs)

---

## Monitoring & Maintenance

### Health Check Endpoint
Monitor: `https://your-app.com/health`

### Database Backups
For SQLite database:
```bash
sqlite3 data/indexflow.db ".backup data/backup-$(date +%Y%m%d).db"
```

### Update Application
```bash
git pull origin main
npm install
pm2 restart indexflow
```

---

## Scaling Considerations

For high-volume sites:

1. **Switch to PostgreSQL/MySQL**:
   - Modify `src/config/database.js`
   - Use hosted database (Railway, Render, etc.)

2. **Add Queue System**:
   - Implement BullMQ or similar
   - Process submissions asynchronously

3. **Rate Limiting**:
   - Add rate limiting to API endpoints
   - Respect Google API quotas

4. **Multiple Instances**:
   - Deploy multiple instances with load balancer
   - Share database across instances

---

## Security Best Practices

1. **Environment Variables**:
   - Never commit `.env` file
   - Use secrets management in production

2. **Webhook Security**:
   - Verify webhook signatures from Webflow
   - Add IP whitelisting if possible

3. **API Access**:
   - Add authentication to admin endpoints
   - Rate limit public endpoints

4. **HTTPS**:
   - Always use HTTPS in production
   - Redirect HTTP to HTTPS

---

Need help? Open an issue on GitHub or contact support.
