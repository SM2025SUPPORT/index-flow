import { google } from 'googleapis';

/**
 * Google Search Console Indexing API Service
 *
 * NOTE: This API is officially only for JobPosting and BroadcastEvent structured data.
 * However, it will crawl any URL submitted. Use at your own discretion.
 *
 * Setup:
 * 1. Create a service account in Google Cloud Console
 * 2. Enable "Web Search Indexing API"
 * 3. Download JSON key
 * 4. Add service account email to Google Search Console as owner
 */

let auth = null;
let indexing = null;

/**
 * Initialize Google Indexing API with service account
 */
export function initGoogleIndexing() {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      console.warn('[Google] Service account JSON not configured');
      return false;
    }

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/indexing']
    });

    indexing = google.indexing({
      version: 'v3',
      auth: auth
    });

    console.log('[Google] Indexing API initialized');
    return true;

  } catch (error) {
    console.error('[Google] Failed to initialize:', error.message);
    return false;
  }
}

/**
 * Submit URL to Google Indexing API
 * @param {string} url - The URL to index
 * @param {string} type - 'URL_UPDATED' or 'URL_DELETED'
 */
export async function submitToGoogle(url, type = 'URL_UPDATED') {
  if (!indexing) {
    const initialized = initGoogleIndexing();
    if (!initialized) {
      return {
        success: false,
        error: 'Google Indexing API not configured'
      };
    }
  }

  try {
    console.log('[Google] Submitting URL:', url, 'Type:', type);

    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: type
      }
    });

    console.log('[Google] Success:', {
      url: response.data.urlNotificationMetadata?.url,
      latestUpdate: response.data.urlNotificationMetadata?.latestUpdate
    });

    return {
      success: true,
      data: response.data,
      url: url
    };

  } catch (error) {
    console.error('[Google] Error submitting URL:', url, error.message);

    // Parse error details
    let errorMessage = error.message;
    let errorCode = error.code;

    if (error.response?.data?.error) {
      errorMessage = error.response.data.error.message;
      errorCode = error.response.data.error.code;
    }

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
      url: url
    };
  }
}

/**
 * Get indexing status for a URL
 */
export async function getIndexingStatus(url) {
  if (!indexing) {
    const initialized = initGoogleIndexing();
    if (!initialized) {
      return {
        success: false,
        error: 'Google Indexing API not configured'
      };
    }
  }

  try {
    const response = await indexing.urlNotifications.getMetadata({
      url: url
    });

    return {
      success: true,
      data: response.data,
      url: url
    };

  } catch (error) {
    console.error('[Google] Error getting status:', url, error.message);
    return {
      success: false,
      error: error.message,
      url: url
    };
  }
}

/**
 * Submit batch of URLs (max 100 per batch via batch request)
 */
export async function submitBatchToGoogle(urls, type = 'URL_UPDATED') {
  if (!indexing) {
    const initialized = initGoogleIndexing();
    if (!initialized) {
      return {
        success: false,
        error: 'Google Indexing API not configured'
      };
    }
  }

  const results = [];
  const BATCH_SIZE = 100; // Google's batch limit

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);

    // Submit each URL in the batch
    const batchResults = await Promise.allSettled(
      batch.map(url => submitToGoogle(url, type))
    );

    results.push(...batchResults.map((result, index) => ({
      url: batch[index],
      success: result.status === 'fulfilled' && result.value.success,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    })));
  }

  const successCount = results.filter(r => r.success).length;

  return {
    success: successCount === urls.length,
    totalUrls: urls.length,
    successCount: successCount,
    failureCount: urls.length - successCount,
    results: results
  };
}

/**
 * Remove URL from Google index
 */
export async function removeFromGoogle(url) {
  return submitToGoogle(url, 'URL_DELETED');
}

export default {
  initGoogleIndexing,
  submitToGoogle,
  getIndexingStatus,
  submitBatchToGoogle,
  removeFromGoogle
};
