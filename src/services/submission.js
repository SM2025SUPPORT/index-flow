import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { submitUrlToIndexNow } from './indexnow.js';
import { submitToGoogle } from './google-indexing.js';

/**
 * Submit a URL to both IndexNow and Google
 */
export async function submitUrl(url, siteId, collectionId = null, itemId = null) {
  const submissionId = uuidv4();
  const now = Date.now();

  try {
    console.log('[Submission] Starting submission for:', url);

    // Check if already submitted
    const existing = db.prepare(
      'SELECT * FROM submissions WHERE url = ? AND site_id = ?'
    ).get(url, siteId);

    if (existing) {
      console.log('[Submission] URL already submitted:', url);
      return {
        success: true,
        message: 'URL already submitted',
        submissionId: existing.id,
        existing: true
      };
    }

    // Create submission record
    db.prepare(`
      INSERT INTO submissions (
        id, url, site_id, collection_id, item_id,
        indexnow_status, google_status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      submissionId, url, siteId, collectionId, itemId,
      'pending', 'pending', now, now
    );

    // Submit to IndexNow
    let indexnowResult = { success: false };
    if (process.env.INDEXNOW_API_KEY) {
      indexnowResult = await submitUrlToIndexNow(url, process.env.INDEXNOW_API_KEY);

      db.prepare(`
        UPDATE submissions
        SET indexnow_status = ?,
            indexnow_response = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        indexnowResult.success ? 'success' : 'failed',
        JSON.stringify(indexnowResult),
        Date.now(),
        submissionId
      );
    } else {
      console.warn('[Submission] IndexNow API key not configured');
    }

    // Submit to Google
    let googleResult = { success: false };
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      googleResult = await submitToGoogle(url);

      db.prepare(`
        UPDATE submissions
        SET google_status = ?,
            google_response = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        googleResult.success ? 'success' : 'failed',
        JSON.stringify(googleResult),
        Date.now(),
        submissionId
      );
    } else {
      console.warn('[Submission] Google service account not configured');
    }

    const result = {
      success: indexnowResult.success || googleResult.success,
      submissionId: submissionId,
      url: url,
      indexnow: indexnowResult,
      google: googleResult,
      timestamp: now
    };

    console.log('[Submission] Completed:', result);
    return result;

  } catch (error) {
    console.error('[Submission] Error:', error);

    // Update submission with error
    db.prepare(`
      UPDATE submissions
      SET indexnow_status = 'failed',
          google_status = 'failed',
          updated_at = ?
      WHERE id = ?
    `).run(Date.now(), submissionId);

    throw error;
  }
}

/**
 * Get submission history
 */
export function getSubmissions(siteId, limit = 100, offset = 0) {
  const query = siteId
    ? 'SELECT * FROM submissions WHERE site_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    : 'SELECT * FROM submissions ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const params = siteId ? [siteId, limit, offset] : [limit, offset];

  return db.prepare(query).all(...params);
}

/**
 * Get submission by ID
 */
export function getSubmission(submissionId) {
  return db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);
}

/**
 * Get submission stats
 */
export function getSubmissionStats(siteId = null) {
  const whereClause = siteId ? 'WHERE site_id = ?' : '';
  const params = siteId ? [siteId] : [];

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM submissions ${whereClause}`
  ).get(...params).count;

  const indexnowSuccess = db.prepare(
    `SELECT COUNT(*) as count FROM submissions ${whereClause} ${whereClause ? 'AND' : 'WHERE'} indexnow_status = 'success'`
  ).get(...params).count;

  const googleSuccess = db.prepare(
    `SELECT COUNT(*) as count FROM submissions ${whereClause} ${whereClause ? 'AND' : 'WHERE'} google_status = 'success'`
  ).get(...params).count;

  return {
    total,
    indexnowSuccess,
    googleSuccess,
    indexnowRate: total > 0 ? (indexnowSuccess / total * 100).toFixed(1) : 0,
    googleRate: total > 0 ? (googleSuccess / total * 100).toFixed(1) : 0
  };
}

/**
 * Track pending CMS item
 */
export function trackPendingItem(siteId, collectionId, itemId, url, isDraft) {
  const id = uuidv4();
  const now = Date.now();

  try {
    db.prepare(`
      INSERT OR REPLACE INTO pending_items (
        id, site_id, collection_id, item_id, url, is_draft,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, siteId, collectionId, itemId, url, isDraft ? 1 : 0, now, now);

    return { success: true, id };
  } catch (error) {
    console.error('[Submission] Error tracking pending item:', error);
    throw error;
  }
}

/**
 * Get published items that haven't been submitted
 */
export function getPublishedPendingItems(siteId) {
  return db.prepare(`
    SELECT p.* FROM pending_items p
    LEFT JOIN submissions s ON p.url = s.url AND p.site_id = s.site_id
    WHERE p.site_id = ?
      AND p.is_draft = 0
      AND s.id IS NULL
  `).all(siteId);
}

/**
 * Clear pending item
 */
export function clearPendingItem(siteId, itemId) {
  db.prepare('DELETE FROM pending_items WHERE site_id = ? AND item_id = ?')
    .run(siteId, itemId);
}

export default {
  submitUrl,
  getSubmissions,
  getSubmission,
  getSubmissionStats,
  trackPendingItem,
  getPublishedPendingItems,
  clearPendingItem
};
