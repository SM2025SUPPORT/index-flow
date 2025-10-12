import fetch from 'node-fetch';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * Submit URL(s) to IndexNow API
 * Supported by: Bing, Yandex, Seznam.cz, Naver
 */
export async function submitToIndexNow(urls, host, apiKey) {
  try {
    // Convert single URL to array
    const urlList = Array.isArray(urls) ? urls : [urls];

    // IndexNow payload
    const payload = {
      host: host,
      key: apiKey,
      keyLocation: `https://${host}/${apiKey}.txt`,
      urlList: urlList
    };

    console.log('[IndexNow] Submitting URLs:', {
      host,
      count: urlList.length,
      urls: urlList
    });

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    // IndexNow returns 200 for success, 202 for accepted
    if (response.ok) {
      const status = response.status;
      console.log(`[IndexNow] Success (${status}):`, urlList);

      return {
        success: true,
        status: status,
        message: status === 200 ? 'URL(s) submitted successfully' : 'URL(s) received',
        urls: urlList
      };
    }

    // Handle errors
    const errorText = await response.text();
    console.error('[IndexNow] Error:', {
      status: response.status,
      error: errorText
    });

    return {
      success: false,
      status: response.status,
      message: errorText || 'IndexNow submission failed',
      urls: urlList
    };

  } catch (error) {
    console.error('[IndexNow] Exception:', error);
    return {
      success: false,
      error: error.message,
      urls: Array.isArray(urls) ? urls : [urls]
    };
  }
}

/**
 * Submit single URL to IndexNow
 */
export async function submitUrlToIndexNow(url, apiKey) {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname;
    return await submitToIndexNow([url], host, apiKey);
  } catch (error) {
    console.error('[IndexNow] Invalid URL:', url, error);
    return {
      success: false,
      error: 'Invalid URL format',
      urls: [url]
    };
  }
}

/**
 * Submit batch of URLs to IndexNow (max 10,000 per request)
 */
export async function submitBatchToIndexNow(urls, apiKey) {
  if (!urls || urls.length === 0) {
    return { success: false, error: 'No URLs provided' };
  }

  // Get host from first URL
  try {
    const urlObj = new URL(urls[0]);
    const host = urlObj.hostname;

    // IndexNow supports up to 10,000 URLs per request
    const BATCH_SIZE = 10000;
    const results = [];

    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const result = await submitToIndexNow(batch, host, apiKey);
      results.push(result);
    }

    return {
      success: results.every(r => r.success),
      results: results,
      totalUrls: urls.length
    };

  } catch (error) {
    console.error('[IndexNow] Batch submission error:', error);
    return {
      success: false,
      error: error.message,
      urls: urls
    };
  }
}

export default {
  submitToIndexNow,
  submitUrlToIndexNow,
  submitBatchToIndexNow
};
