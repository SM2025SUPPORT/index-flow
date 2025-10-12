#!/usr/bin/env node

/**
 * Setup script for IndexFlow
 * - Initializes database
 * - Creates IndexNow key file
 * - Validates configuration
 */

import { config } from 'dotenv';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomBytes } from 'crypto';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

console.log('🚀 IndexFlow Setup\n');

// 1. Check environment variables
console.log('1. Checking environment variables...');

const requiredEnvVars = [
  'WEBFLOW_CLIENT_ID',
  'WEBFLOW_CLIENT_SECRET',
  'PUBLIC_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease copy .env.example to .env and fill in the values.');
  process.exit(1);
}

console.log('✅ Required environment variables present\n');

// 2. Check optional configurations
console.log('2. Checking optional configurations...');

if (!process.env.INDEXNOW_API_KEY) {
  console.warn('⚠️  IndexNow API key not set - generating one...');
  const generatedKey = randomBytes(16).toString('hex');
  console.log(`   Generated key: ${generatedKey}`);
  console.log(`   Add this to your .env file: INDEXNOW_API_KEY=${generatedKey}\n`);
  process.env.INDEXNOW_API_KEY = generatedKey;
} else {
  console.log('✅ IndexNow API key configured');
}

if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  console.warn('⚠️  Google service account not configured');
  console.warn('   Google Indexing API will not be available');
  console.warn('   See README.md for setup instructions\n');
} else {
  console.log('✅ Google service account configured');
}

// 3. Initialize database
console.log('\n3. Initializing database...');
try {
  // Database is initialized on import
  const tablesCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).get().count;

  console.log(`✅ Database initialized with ${tablesCount} tables\n`);
} catch (error) {
  console.error('❌ Database initialization failed:', error.message);
  process.exit(1);
}

// 4. Create IndexNow key file
console.log('4. Creating IndexNow key file...');
try {
  if (process.env.INDEXNOW_API_KEY) {
    const publicDir = join(__dirname, '../../public');

    // Create public directory if it doesn't exist
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    const keyFilePath = join(publicDir, `${process.env.INDEXNOW_API_KEY}.txt`);
    writeFileSync(keyFilePath, process.env.INDEXNOW_API_KEY);

    console.log(`✅ IndexNow key file created: ${keyFilePath}`);
    console.log(`   Accessible at: ${process.env.PUBLIC_URL}/${process.env.INDEXNOW_API_KEY}.txt\n`);
  }
} catch (error) {
  console.error('❌ Failed to create IndexNow key file:', error.message);
  console.error('   You can manually create this file later\n');
}

// 5. Test Google API (if configured)
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  console.log('5. Testing Google Indexing API...');
  try {
    const { initGoogleIndexing } = await import('../services/google-indexing.js');
    const initialized = initGoogleIndexing();

    if (initialized) {
      console.log('✅ Google Indexing API initialized successfully\n');
    } else {
      console.warn('⚠️  Google Indexing API initialization failed\n');
    }
  } catch (error) {
    console.error('❌ Google API test failed:', error.message);
    console.error('   Check your service account JSON\n');
  }
}

// 6. Summary
console.log('\n' + '='.repeat(60));
console.log('✨ Setup Complete!\n');
console.log('Next steps:');
console.log('1. Start the server: npm run dev');
console.log('2. Open http://localhost:3000');
console.log('3. Connect your Webflow site');
console.log('4. Set up webhooks in Webflow:');
console.log(`   - collection_item_changed: ${process.env.PUBLIC_URL}/webhooks/item-changed`);
console.log(`   - site_publish: ${process.env.PUBLIC_URL}/webhooks/site-publish`);
console.log('\nFor production deployment, see README.md\n');
console.log('='.repeat(60) + '\n');
