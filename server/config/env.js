/**
 * Environment Variables Loader & Strict Security Validator
 * Loads .env / .env.local safely and enforces strict requirements.
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  } catch (e) {
    // Ignore read errors
  }
}

// Load .env and .env.local from project root
const rootDir = path.resolve(__dirname, '..', '..');
loadEnvFile(path.join(rootDir, '.env'));
loadEnvFile(path.join(rootDir, '.env.local'));

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!MONGODB_URI) {
  const errMsg = "❌ CRITICAL CONFIGURATION ERROR: 'MONGODB_URI' environment variable is strictly required. Please specify MONGODB_URI in your environment variables or .env file.";
  console.error(errMsg);
  throw new Error(errMsg);
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  const errMsg = "❌ CRITICAL SECURITY ERROR: 'JWT_SECRET' environment variable is strictly required. Please specify JWT_SECRET in your environment variables or .env file.";
  console.error(errMsg);
  throw new Error(errMsg);
}

const PORT = parseInt(process.env.PORT || '4000', 10);
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'default';

module.exports = {
  MONGODB_URI,
  JWT_SECRET,
  PORT,
  DEFAULT_TENANT_ID
};
