# IndexFlow - Auto Indexing for Webflow

**1-click auto-indexing tool that submits new Webflow blog content to Google Search Console + IndexNow automatically.**

## Features

- 🚀 **Automatic Indexing** - Submits URLs to Google & IndexNow when content is published
- 🎯 **Webflow Integration** - Uses webhooks to detect new/updated CMS items
- 📊 **Tracking Dashboard** - View submission history and status
- 🔄 **Batch Processing** - Handles multiple URLs efficiently
- 🔐 **Secure** - OAuth 2.0 for Webflow, service account for Google

## How It Works

IndexFlow works around Webflow's webhook limitations by using a smart combination:

1. **`collection_item_changed` webhook** - Detects when CMS items are created/updated
2. **`site_publish` webhook** - Detects when site is published
3. **Smart tracking** - Checks `isDraft` status and only submits published items
4. **Automatic submission** - Sends URLs to both IndexNow and Google Indexing API

### Why This Approach?

Webflow doesn't have a direct "item published" webhook. Instead, we:
- Track all CMS item changes
- On site publish, check which items have `isDraft: false`
- Submit only newly published URLs (not previously submitted ones)

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- A Webflow account with a site
- Google Cloud project with Indexing API enabled
- IndexNow API key

### 2. Installation

```bash
git clone <your-repo>
cd index-flow
npm install
```

### 3. Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

#### Get Webflow Credentials

1. Go to [Webflow Apps](https://webflow.com/dashboard/apps)
2. Create a new app
3. Add redirect URL: `http://localhost:3000/auth/callback`
4. Copy Client ID and Client Secret to `.env`

#### Get IndexNow Key

1. Visit https://www.bing.com/indexnow
2. Generate a 32-character key
3. Add to `.env` as `INDEXNOW_API_KEY`

#### Get Google Indexing API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Web Search Indexing API"
4. Create a service account
5. Download JSON key
6. Copy entire JSON contents to `.env` as `GOOGLE_SERVICE_ACCOUNT_JSON` (single line)
7. Add the service account email to Google Search Console as an owner

### 4. Setup

Run the setup script to initialize the database and IndexNow key file:

```bash
npm run setup
```

### 5. Run

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 6. Install Webflow App

1. Open your Webflow site
2. Go to Apps section
3. Install your custom app
4. Authorize the connection
5. Configure webhook URLs in Webflow:
   - `collection_item_changed`: `https://your-app.com/webhooks/item-changed`
   - `site_publish`: `https://your-app.com/webhooks/site-publish`

## API Endpoints

### Authentication

- `GET /auth/webflow` - Initiate Webflow OAuth
- `GET /auth/callback` - OAuth callback handler

### Webhooks

- `POST /webhooks/item-changed` - Handle CMS item changes
- `POST /webhooks/site-publish` - Handle site publish events

### Manual Actions

- `POST /api/submit-url` - Manually submit a URL
- `GET /api/submissions` - View submission history
- `POST /api/resubmit/:id` - Resubmit a failed URL

## Architecture

```
┌─────────────┐
│   Webflow   │
│    Site     │
└──────┬──────┘
       │ Webhooks
       ▼
┌─────────────────┐
│  IndexFlow API  │
│   (Express)     │
└────┬────────┬───┘
     │        │
     ▼        ▼
┌─────────┐ ┌──────────┐
│IndexNow │ │ Google   │
│   API   │ │Index API │
└─────────┘ └──────────┘
```

## Database Schema

### submissions table
- `id` - Unique identifier
- `url` - The submitted URL
- `site_id` - Webflow site ID
- `collection_id` - Webflow collection ID
- `item_id` - Webflow item ID
- `indexnow_status` - IndexNow submission status
- `google_status` - Google submission status
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Deployment

### Deploy to Railway

1. Create a new project on Railway
2. Connect your GitHub repo
3. Add environment variables
4. Deploy

### Deploy to Render

1. Create a new Web Service
2. Connect your GitHub repo
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

## Important Notes

### Google Indexing API Limitations

The Google Indexing API is officially only for:
- Job postings (with JobPosting structured data)
- Livestream events (with BroadcastEvent structured data)

However, in practice, Google will crawl any submitted URL. Use at your own discretion and follow Google's terms of service.

### IndexNow Support

IndexNow is supported by:
- ✅ Bing
- ✅ Yandex
- ✅ Seznam.cz
- ✅ Naver
- ❌ Google (as of 2025)

## Troubleshooting

### Webhooks Not Firing

1. Check webhook URLs are correct in Webflow
2. Verify your server is publicly accessible
3. Check Webflow webhook logs

### Google API Errors

1. Verify service account is added to Search Console
2. Check API is enabled in Google Cloud
3. Verify JSON credentials are valid

### IndexNow Not Working

1. Verify key file is accessible at `https://your-site.com/<key>.txt`
2. Check API key is 32 characters
3. Verify URLs are from the same domain

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
