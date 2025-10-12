import express from 'express';
import {
  submitUrl,
  getSubmissions,
  getSubmission,
  getSubmissionStats
} from '../services/submission.js';
import db from '../config/database.js';

const router = express.Router();

/**
 * Manually submit a URL
 */
router.post('/submit-url', async (req, res) => {
  try {
    const { url, siteId } = req.body;

    if (!url || !siteId) {
      return res.status(400).json({ error: 'Missing url or siteId' });
    }

    const result = await submitUrl(url, siteId);
    res.json(result);

  } catch (error) {
    console.error('[API] Error submitting URL:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get submission history
 */
router.get('/submissions', (req, res) => {
  try {
    const { siteId, limit = 100, offset = 0 } = req.query;

    const submissions = getSubmissions(
      siteId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      submissions,
      count: submissions.length
    });

  } catch (error) {
    console.error('[API] Error getting submissions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get single submission
 */
router.get('/submissions/:id', (req, res) => {
  try {
    const submission = getSubmission(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);

  } catch (error) {
    console.error('[API] Error getting submission:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get submission statistics
 */
router.get('/stats', (req, res) => {
  try {
    const { siteId } = req.query;
    const stats = getSubmissionStats(siteId);
    res.json(stats);

  } catch (error) {
    console.error('[API] Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Resubmit a failed URL
 */
router.post('/resubmit/:id', async (req, res) => {
  try {
    const submission = getSubmission(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Delete old submission
    db.prepare('DELETE FROM submissions WHERE id = ?').run(req.params.id);

    // Resubmit
    const result = await submitUrl(
      submission.url,
      submission.site_id,
      submission.collection_id,
      submission.item_id
    );

    res.json(result);

  } catch (error) {
    console.error('[API] Error resubmitting:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all registered sites
 */
router.get('/sites', (req, res) => {
  try {
    const sites = db.prepare('SELECT site_id, site_name, created_at FROM sites').all();
    res.json({ sites });

  } catch (error) {
    console.error('[API] Error getting sites:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    indexnowConfigured: !!process.env.INDEXNOW_API_KEY,
    googleConfigured: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  });
});

export default router;
