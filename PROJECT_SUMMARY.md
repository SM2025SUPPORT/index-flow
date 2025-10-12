# IndexFlow - Project Summary

## What This Is

IndexFlow is a **1-click auto-indexing tool** for Webflow that automatically submits new blog content to Google Search Console (via Indexing API) and IndexNow when published.

## The Problem It Solves

Webflow users currently have to manually submit URLs to search engines after publishing content. Tools like IndexGuru and Byword.ai charge monthly fees for this automation. IndexFlow provides a free, self-hosted solution that:

- Automatically detects when new content is published
- Instantly submits URLs to Google Indexing API
- Instantly submits URLs to IndexNow (Bing, Yandex, etc.)
- Tracks submission history and status
- Requires zero manual intervention

## How It Works

### Architecture

```
Webflow Site (CMS)
     ↓
Webhooks (item changes + publish events)
     ↓
IndexFlow Backend (Express.js)
     ↓
├─→ IndexNow API (Bing, Yandex, etc.)
└─→ Google Indexing API (Google)
```

### Workflow

1. **User creates/edits content** in Webflow CMS
2. **Webflow fires webhook** (`collection_item_changed`) → IndexFlow tracks the item
3. **User publishes site** in Webflow
4. **Webflow fires webhook** (`site_publish`) → IndexFlow checks which items are now published
5. **IndexFlow submits URLs** to both IndexNow and Google Indexing API
6. **Search engines get notified** and crawl content faster
7. **Dashboard shows results** with success/failure status

### Working Around Webflow Limitations

Webflow doesn't have a direct "item published" webhook. Our solution:

- Track all CMS item changes via `collection_item_changed` webhook
- Store items in `pending_items` table with their `isDraft` status
- When `site_publish` fires, check which items have `isDraft: false`
- Submit only newly published URLs (not previously submitted)
- Clear from pending table after submission

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite (easy to swap for PostgreSQL/MySQL)
- **APIs**:
  - Webflow API v2 (OAuth + Data Client)
  - IndexNow API (Bing, Yandex, Seznam, Naver)
  - Google Search Console Indexing API
- **Auth**: OAuth 2.0 (Webflow)
- **Deployment**: Railway, Render, Heroku, Docker, VPS

## Project Structure

```
index-flow/
├── src/
│   ├── config/
│   │   └── database.js           # SQLite setup & schema
│   ├── services/
│   │   ├── indexnow.js          # IndexNow API client
│   │   ├── google-indexing.js   # Google Indexing API client
│   │   ├── webflow.js           # Webflow API client
│   │   └── submission.js        # URL submission logic
│   ├── routes/
│   │   ├── auth.js              # OAuth flow
│   │   ├── webhooks.js          # Webhook handlers
│   │   └── api.js               # REST API endpoints
│   ├── scripts/
│   │   └── setup.js             # Setup & initialization
│   └── server.js                # Express app
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies
├── README.md                    # Main documentation
├── QUICKSTART.md               # 10-minute setup guide
├── DEPLOYMENT.md               # Deployment guides
├── Dockerfile                  # Docker configuration
├── railway.json                # Railway config
├── render.yaml                 # Render config
└── vercel.json                 # Vercel config
```

## Key Features

### 1. Automatic Indexing
- Detects published content via webhooks
- Submits to both IndexNow and Google automatically
- No manual intervention required

### 2. Multi-Engine Support
- **IndexNow**: Bing, Yandex, Seznam.cz, Naver
- **Google**: Via Indexing API

### 3. Smart Tracking
- SQLite database tracks all submissions
- Prevents duplicate submissions
- Stores success/failure status
- Records API responses

### 4. Dashboard
- Real-time stats (total, success rates)
- Submission history
- Per-URL status tracking
- Auto-refreshing UI

### 5. Developer-Friendly
- Clean, modular code
- Comprehensive docs
- Easy deployment
- Self-hosted (no vendor lock-in)

## API Endpoints

### User-Facing
- `GET /` - Landing page
- `GET /dashboard` - Submissions dashboard
- `GET /auth/webflow` - OAuth flow
- `GET /auth/callback` - OAuth callback

### Webhooks (Webflow → IndexFlow)
- `POST /webhooks/item-changed` - CMS item created/updated
- `POST /webhooks/site-publish` - Site published
- `POST /webhooks/item-unpublished` - Item unpublished

### API (Manual Operations)
- `POST /api/submit-url` - Manually submit URL
- `GET /api/submissions` - List submissions
- `GET /api/stats` - Get statistics
- `GET /api/sites` - List connected sites
- `POST /api/resubmit/:id` - Retry failed submission

### Utility
- `GET /health` - Health check
- `GET /:key.txt` - IndexNow key file

## Database Schema

### `submissions`
Tracks all URL submissions to search engines.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID |
| url | TEXT | Full URL submitted |
| site_id | TEXT | Webflow site ID |
| collection_id | TEXT | Webflow collection ID |
| item_id | TEXT | Webflow item ID |
| indexnow_status | TEXT | pending/success/failed |
| indexnow_response | TEXT | API response JSON |
| google_status | TEXT | pending/success/failed |
| google_response | TEXT | API response JSON |
| created_at | INTEGER | Timestamp |
| updated_at | INTEGER | Timestamp |

### `sites`
Stores connected Webflow sites and OAuth tokens.

| Column | Type | Description |
|--------|------|-------------|
| site_id | TEXT | Webflow site ID (PK) |
| site_name | TEXT | Site display name |
| access_token | TEXT | OAuth access token |
| refresh_token | TEXT | OAuth refresh token |
| token_expires_at | INTEGER | Token expiry timestamp |
| created_at | INTEGER | Timestamp |
| updated_at | INTEGER | Timestamp |

### `pending_items`
Tracks CMS items waiting to be published.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID |
| site_id | TEXT | Webflow site ID |
| collection_id | TEXT | Collection ID |
| item_id | TEXT | Item ID |
| url | TEXT | Item URL/slug |
| is_draft | INTEGER | 1=draft, 0=published |
| created_at | INTEGER | Timestamp |
| updated_at | INTEGER | Timestamp |

## Environment Variables

### Required
- `WEBFLOW_CLIENT_ID` - Webflow app client ID
- `WEBFLOW_CLIENT_SECRET` - Webflow app client secret
- `PUBLIC_URL` - Your app's public URL

### Optional (but recommended)
- `INDEXNOW_API_KEY` - 32-char key for IndexNow
- `GOOGLE_SERVICE_ACCOUNT_JSON` - Google service account credentials

### Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - development/production
- `DATABASE_PATH` - SQLite database path

## Important Notes

### Google Indexing API Limitations

The Google Indexing API is **officially only for**:
- Job postings (JobPosting structured data)
- Livestream videos (BroadcastEvent structured data)

However, in practice, Google will crawl any URL submitted. Use responsibly and at your own discretion.

### IndexNow Support

As of 2025, IndexNow is supported by:
- ✅ Bing
- ✅ Yandex
- ✅ Seznam.cz
- ✅ Naver
- ❌ Google (Google has declined to join IndexNow)

That's why we use both IndexNow + Google Indexing API for full coverage.

## Setup Time

- **Quick Start**: ~10 minutes (with credentials ready)
- **Full Setup**: ~30 minutes (including API setup)
- **Deployment**: ~15 minutes (Railway/Render)

## Deployment Options

### Easiest (Recommended)
1. **Railway** - One-click deploy, built-in persistence
2. **Render** - Free tier available, easy setup

### Also Supported
3. **Heroku** - Classic PaaS
4. **DigitalOcean App Platform** - Good for scaling
5. **Docker** - Self-hosted, full control
6. **VPS** - Complete control, requires server management

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides.

## Costs

### Self-Hosted (Free)
- Code: Open source, MIT license
- Hosting: Free tiers available (Railway, Render)
- APIs: IndexNow and Google Indexing API are free

### Estimated Monthly Costs
- **Free tier**: $0 (Railway/Render free tier + free APIs)
- **Paid hosting**: $5-10/month (if you exceed free tier)
- **VPS**: $5-20/month (DigitalOcean, Linode, etc.)

### Compare to Alternatives
- IndexGuru: ~$50/month
- Byword.ai: ~$99/month (includes other features)

**IndexFlow: Self-hosted = FREE** (except hosting costs)

## Scaling Considerations

### For Small Sites (<100 posts/month)
- SQLite database is fine
- Free tier hosting works well
- Single instance sufficient

### For Medium Sites (100-1000 posts/month)
- Consider PostgreSQL/MySQL
- Use paid hosting tier
- Monitor API quotas

### For Large Sites (>1000 posts/month)
- Switch to PostgreSQL
- Add queue system (BullMQ)
- Multiple instances + load balancer
- Implement rate limiting

## Security

### Implemented
- OAuth 2.0 for Webflow authentication
- Environment variables for secrets
- HTTPS in production
- Input validation

### Recommended Additions
- Webhook signature verification
- Rate limiting on public endpoints
- Admin authentication for sensitive endpoints
- IP whitelisting for webhooks

## Testing

### Local Development
1. Run with ngrok: `ngrok http 3000`
2. Use ngrok URL for webhooks
3. Test by publishing in Webflow
4. Check dashboard for results

### Manual Testing
```bash
# Test health
curl http://localhost:3000/health

# Test manual submission
curl -X POST http://localhost:3000/api/submit-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","siteId":"abc123"}'

# Get stats
curl http://localhost:3000/api/stats
```

## Future Enhancements

Potential features to add:

1. **Batch Resubmission** - Resubmit all failed URLs at once
2. **Sitemap Integration** - Auto-generate and submit sitemaps
3. **Email Notifications** - Alert on submission failures
4. **Analytics** - Track indexing success rates over time
5. **Multi-Site Dashboard** - Manage multiple Webflow sites
6. **Scheduling** - Periodic resubmissions for old content
7. **API Rate Limit Handling** - Smart retry with backoff
8. **Webhook Signature Verification** - Enhanced security
9. **Admin Panel** - Web UI for configuration
10. **Slack/Discord Integration** - Notifications in chat

## Contributing

Contributions welcome! Areas to improve:

- Add tests (Jest/Mocha)
- Add TypeScript support
- Improve error handling
- Add more search engines
- Optimize database queries
- Add monitoring/logging
- Improve dashboard UI

## License

MIT License - Use freely, commercially or personally.

## Credits

- Built for Webflow users who want free auto-indexing
- Inspired by IndexGuru and Byword.ai
- Uses IndexNow protocol by Microsoft/Bing
- Uses Google Search Console Indexing API

## Support

- **Documentation**: See README.md and QUICKSTART.md
- **Issues**: Open a GitHub issue
- **Feature Requests**: Open a GitHub issue with [Feature Request] tag

---

**Ready to deploy?** See [QUICKSTART.md](./QUICKSTART.md) for a 10-minute setup guide!
