import fetch from 'node-fetch';

const WEBFLOW_API_BASE = 'https://api.webflow.com/v2';

/**
 * Get Webflow site info
 */
export async function getSiteInfo(siteId, accessToken) {
  try {
    const response = await fetch(`${WEBFLOW_API_BASE}/sites/${siteId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get site info: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('[Webflow] Error getting site info:', error);
    throw error;
  }
}

/**
 * Get CMS collection item details
 */
export async function getCollectionItem(collectionId, itemId, accessToken) {
  try {
    const response = await fetch(
      `${WEBFLOW_API_BASE}/collections/${collectionId}/items/${itemId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get item: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('[Webflow] Error getting collection item:', error);
    throw error;
  }
}

/**
 * List all collections in a site
 */
export async function listCollections(siteId, accessToken) {
  try {
    const response = await fetch(`${WEBFLOW_API_BASE}/sites/${siteId}/collections`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list collections: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('[Webflow] Error listing collections:', error);
    throw error;
  }
}

/**
 * Get all items in a collection
 */
export async function getCollectionItems(collectionId, accessToken) {
  try {
    const response = await fetch(
      `${WEBFLOW_API_BASE}/collections/${collectionId}/items`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get collection items: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('[Webflow] Error getting collection items:', error);
    throw error;
  }
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code) {
  try {
    const params = new URLSearchParams({
      client_id: process.env.WEBFLOW_CLIENT_ID,
      client_secret: process.env.WEBFLOW_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    });

    const response = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('[Webflow] Error exchanging code for token:', error);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const params = new URLSearchParams({
      client_id: process.env.WEBFLOW_CLIENT_ID,
      client_secret: process.env.WEBFLOW_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('[Webflow] Error refreshing token:', error);
    throw error;
  }
}

export default {
  getSiteInfo,
  getCollectionItem,
  listCollections,
  getCollectionItems,
  exchangeCodeForToken,
  refreshAccessToken
};
