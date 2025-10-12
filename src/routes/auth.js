import express from 'express';
import db from '../config/database.js';
import { exchangeCodeForToken, getSiteInfo } from '../services/webflow.js';

const router = express.Router();

/**
 * Initiate Webflow OAuth flow
 */
router.get('/webflow', (req, res) => {
  const clientId = process.env.WEBFLOW_CLIENT_ID;
  const redirectUri = `${process.env.PUBLIC_URL}/auth/callback`;

  const authUrl = `https://webflow.com/oauth/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.redirect(authUrl);
});

/**
 * Handle OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).send(`Authorization error: ${error}`);
    }

    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get authenticated site info
    const authorizedSites = tokenData.authorized_sites || [];

    if (authorizedSites.length === 0) {
      return res.status(400).send('No sites authorized');
    }

    // Store site credentials in database
    const now = Date.now();
    const expiresAt = now + (expires_in * 1000);

    for (const siteId of authorizedSites) {
      try {
        // Get site details
        const siteInfo = await getSiteInfo(siteId, access_token);

        db.prepare(`
          INSERT OR REPLACE INTO sites (
            site_id, site_name, access_token, refresh_token,
            token_expires_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          siteId,
          siteInfo.displayName || siteInfo.shortName || siteId,
          access_token,
          refresh_token,
          expiresAt,
          now,
          now
        );

        console.log('[Auth] Site registered:', siteId, siteInfo.displayName);

      } catch (error) {
        console.error('[Auth] Error registering site:', siteId, error);
      }
    }

    // Success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>IndexFlow - Connected</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          .success { color: #10b981; font-size: 48px; }
          h1 { margin: 20px 0; }
          .sites {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .site {
            background: white;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
          }
          .next-steps {
            text-align: left;
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          code {
            background: #1f2937;
            color: #10b981;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="success">✓</div>
        <h1>IndexFlow Connected!</h1>
        <p>Your Webflow site(s) have been successfully connected.</p>

        <div class="sites">
          <h3>Connected Sites</h3>
          ${authorizedSites.map(id => `<div class="site">${id}</div>`).join('')}
        </div>

        <div class="next-steps">
          <h3>Next Steps:</h3>
          <ol>
            <li>
              <strong>Set up webhooks in Webflow:</strong>
              <ul>
                <li>Go to your site settings → Integrations → Webhooks</li>
                <li>Add webhook for <code>collection_item_changed</code>:<br>
                    <code>${process.env.PUBLIC_URL}/webhooks/item-changed</code></li>
                <li>Add webhook for <code>site_publish</code>:<br>
                    <code>${process.env.PUBLIC_URL}/webhooks/site-publish</code></li>
              </ul>
            </li>
            <li>
              <strong>Publish your site</strong> and IndexFlow will automatically submit new content!
            </li>
          </ol>
        </div>

        <p><a href="/dashboard">View Dashboard</a></p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('[Auth] OAuth callback error:', error);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

export default router;
