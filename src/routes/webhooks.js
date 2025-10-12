import express from 'express';
import db from '../config/database.js';
import { getCollectionItem } from '../services/webflow.js';
import { submitUrl, trackPendingItem, getPublishedPendingItems } from '../services/submission.js';

const router = express.Router();

/**
 * Handle collection_item_changed webhook
 * Fires when a CMS item is created or updated
 */
router.post('/item-changed', async (req, res) => {
  try {
    const webhook = req.body;
    console.log('[Webhook] Item changed:', JSON.stringify(webhook, null, 2));

    const { site, _id: itemId, triggeredByUserId } = webhook;
    const siteId = site;

    if (!siteId || !itemId) {
      return res.status(400).json({ error: 'Missing site or item ID' });
    }

    // Get site's access token
    const siteRecord = db.prepare('SELECT * FROM sites WHERE site_id = ?').get(siteId);

    if (!siteRecord) {
      console.warn('[Webhook] Site not registered:', siteId);
      return res.status(200).json({
        message: 'Site not registered, ignoring event'
      });
    }

    // Get item details from Webflow API to check isDraft status
    try {
      // Extract collection ID from webhook if available
      const collectionId = webhook.collectionId;

      if (!collectionId) {
        console.warn('[Webhook] No collection ID in webhook');
        return res.status(200).json({ message: 'No collection ID' });
      }

      const item = await getCollectionItem(collectionId, itemId, siteRecord.access_token);

      // Track the item as pending
      const isDraft = item.isDraft !== false; // Default to draft if not specified
      const url = item.fieldData?.slug
        ? `${item.fieldData.slug}`
        : null;

      if (url) {
        trackPendingItem(siteId, collectionId, itemId, url, isDraft);
        console.log('[Webhook] Tracked pending item:', { itemId, url, isDraft });
      }

      return res.status(200).json({
        message: 'Item tracked',
        itemId,
        isDraft
      });

    } catch (error) {
      console.error('[Webhook] Error fetching item details:', error);
      return res.status(500).json({ error: 'Failed to fetch item details' });
    }

  } catch (error) {
    console.error('[Webhook] Error handling item-changed:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Handle site_publish webhook
 * Fires when site is published - this is when we submit URLs
 */
router.post('/site-publish', async (req, res) => {
  try {
    const webhook = req.body;
    console.log('[Webhook] Site publish:', JSON.stringify(webhook, null, 2));

    const { site: siteId, publishedBy, publishTime } = webhook;

    if (!siteId) {
      return res.status(400).json({ error: 'Missing site ID' });
    }

    // Get site's access token
    const siteRecord = db.prepare('SELECT * FROM sites WHERE site_id = ?').get(siteId);

    if (!siteRecord) {
      console.warn('[Webhook] Site not registered:', siteId);
      return res.status(200).json({
        message: 'Site not registered, ignoring event'
      });
    }

    // Get all published pending items that haven't been submitted
    const publishedItems = getPublishedPendingItems(siteId);

    console.log('[Webhook] Found published items:', publishedItems.length);

    // Submit each published item
    const submissions = [];
    for (const item of publishedItems) {
      try {
        // Construct full URL (you'll need to get the domain from site info)
        const fullUrl = item.url.startsWith('http')
          ? item.url
          : `https://${siteRecord.site_name}${item.url}`;

        const result = await submitUrl(
          fullUrl,
          siteId,
          item.collection_id,
          item.item_id
        );

        submissions.push(result);

        // Clear from pending
        db.prepare('DELETE FROM pending_items WHERE id = ?').run(item.id);

      } catch (error) {
        console.error('[Webhook] Error submitting item:', item.item_id, error);
      }
    }

    return res.status(200).json({
      message: 'Site publish processed',
      submissionsCount: submissions.length,
      submissions: submissions
    });

  } catch (error) {
    console.error('[Webhook] Error handling site-publish:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Handle collection_item_unpublished webhook
 * Optionally remove from Google index
 */
router.post('/item-unpublished', async (req, res) => {
  try {
    const webhook = req.body;
    console.log('[Webhook] Item unpublished:', JSON.stringify(webhook, null, 2));

    const { site: siteId, _id: itemId } = webhook;

    // Mark as draft in pending_items
    db.prepare(`
      UPDATE pending_items
      SET is_draft = 1, updated_at = ?
      WHERE site_id = ? AND item_id = ?
    `).run(Date.now(), siteId, itemId);

    // Optionally: Submit URL_DELETED to Google
    // This would require fetching the URL and calling removeFromGoogle()

    return res.status(200).json({
      message: 'Item unpublished, marked as draft'
    });

  } catch (error) {
    console.error('[Webhook] Error handling item-unpublished:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
