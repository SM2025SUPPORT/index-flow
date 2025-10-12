import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

// Load environment variables
config();

// Initialize services
import './config/database.js';
import { initGoogleIndexing } from './services/google-indexing.js';

// Initialize routes
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhooks.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check (before other routes)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve IndexNow key file
app.get(`/${process.env.INDEXNOW_API_KEY}.txt`, (req, res) => {
  if (!process.env.INDEXNOW_API_KEY) {
    return res.status(404).send('IndexNow not configured');
  }
  res.type('text/plain').send(process.env.INDEXNOW_API_KEY);
});

// Routes
app.use('/auth', authRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/api', apiRoutes);

// Dashboard (simple HTML)
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>IndexFlow Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f9fafb;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        header {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        h1 {
          font-size: 32px;
          margin-bottom: 10px;
          color: #111827;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-label {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: #111827;
        }
        .submissions {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .submissions-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }
        .submissions-header h2 {
          font-size: 20px;
          color: #111827;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: #f9fafb;
          padding: 12px 24px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 16px 24px;
          border-top: 1px solid #f3f4f6;
          font-size: 14px;
          color: #374151;
        }
        .url-cell {
          max-width: 400px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-success {
          background: #d1fae5;
          color: #065f46;
        }
        .status-failed {
          background: #fee2e2;
          color: #991b1b;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .actions {
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #2563eb;
        }
        .empty {
          padding: 60px 24px;
          text-align: center;
          color: #9ca3af;
        }
        .refresh-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }
        .refresh-btn:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>IndexFlow Dashboard</h1>
          <p class="subtitle">Auto-indexing for Webflow</p>
        </header>

        <div class="stats" id="stats">
          <div class="stat-card">
            <div class="stat-label">Total Submissions</div>
            <div class="stat-value" id="total-submissions">-</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">IndexNow Success</div>
            <div class="stat-value" id="indexnow-success">-</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Google Success</div>
            <div class="stat-value" id="google-success">-</div>
          </div>
        </div>

        <div class="submissions">
          <div class="submissions-header">
            <h2>Recent Submissions</h2>
          </div>
          <table id="submissions-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>IndexNow</th>
                <th>Google</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody id="submissions-body">
              <tr>
                <td colspan="4" class="empty">Loading...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <button class="refresh-btn" onclick="loadData()" title="Refresh">↻</button>

      <script>
        async function loadData() {
          try {
            // Load stats
            const statsRes = await fetch('/api/stats');
            const stats = await statsRes.json();

            document.getElementById('total-submissions').textContent = stats.total;
            document.getElementById('indexnow-success').textContent =
              stats.indexnowSuccess + ' (' + stats.indexnowRate + '%)';
            document.getElementById('google-success').textContent =
              stats.googleSuccess + ' (' + stats.googleRate + '%)';

            // Load submissions
            const submissionsRes = await fetch('/api/submissions?limit=50');
            const data = await submissionsRes.json();

            const tbody = document.getElementById('submissions-body');

            if (data.submissions.length === 0) {
              tbody.innerHTML = '<tr><td colspan="4" class="empty">No submissions yet</td></tr>';
              return;
            }

            tbody.innerHTML = data.submissions.map(sub => {
              const date = new Date(sub.created_at).toLocaleString();
              const url = sub.url.replace(/^https?:\\/\\//, '');

              return \`
                <tr>
                  <td class="url-cell" title="\${sub.url}">\${url}</td>
                  <td>
                    <span class="status status-\${sub.indexnow_status}">
                      \${sub.indexnow_status}
                    </span>
                  </td>
                  <td>
                    <span class="status status-\${sub.google_status}">
                      \${sub.google_status}
                    </span>
                  </td>
                  <td>\${date}</td>
                </tr>
              \`;
            }).join('');

          } catch (error) {
            console.error('Error loading data:', error);
          }
        }

        // Load data on page load
        loadData();

        // Auto-refresh every 30 seconds
        setInterval(loadData, 30000);
      </script>
    </body>
    </html>
  `);
});

// Home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>IndexFlow - Auto Indexing for Webflow</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .hero {
          background: white;
          max-width: 600px;
          padding: 60px 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
        }
        h1 {
          font-size: 42px;
          color: #111827;
          margin-bottom: 20px;
        }
        .tagline {
          font-size: 20px;
          color: #6b7280;
          margin-bottom: 40px;
        }
        .features {
          text-align: left;
          margin: 40px 0;
          padding: 30px;
          background: #f9fafb;
          border-radius: 12px;
        }
        .feature {
          margin: 15px 0;
          display: flex;
          align-items: center;
        }
        .feature-icon {
          font-size: 24px;
          margin-right: 15px;
        }
        .btn {
          display: inline-block;
          padding: 16px 40px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 18px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .btn:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          margin-left: 10px;
        }
        .btn-secondary:hover {
          background: #f9fafb;
        }
      </style>
    </head>
    <body>
      <div class="hero">
        <h1>IndexFlow</h1>
        <p class="tagline">1-Click Auto Indexing for Webflow</p>

        <div class="features">
          <div class="feature">
            <span class="feature-icon">🚀</span>
            <span>Automatically submit new content to search engines</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🎯</span>
            <span>IndexNow + Google Indexing API support</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📊</span>
            <span>Track submission status and history</span>
          </div>
          <div class="feature">
            <span class="feature-icon">⚡</span>
            <span>Zero manual work - set it and forget it</span>
          </div>
        </div>

        <div style="margin-top: 40px;">
          <a href="/auth/webflow" class="btn">Connect Webflow</a>
          <a href="/dashboard" class="btn btn-secondary">View Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
async function start() {
  console.log('[IndexFlow] Starting server...');

  // Initialize Google Indexing API
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    initGoogleIndexing();
  } else {
    console.warn('[IndexFlow] Google service account not configured');
  }

  // Check IndexNow configuration
  if (!process.env.INDEXNOW_API_KEY) {
    console.warn('[IndexFlow] IndexNow API key not configured');
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`[IndexFlow] Server running on http://localhost:${PORT}`);
    console.log(`[IndexFlow] Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`[IndexFlow] Connect Webflow: http://localhost:${PORT}/auth/webflow`);
  });
}

start().catch(error => {
  console.error('[IndexFlow] Failed to start:', error);
  process.exit(1);
});
