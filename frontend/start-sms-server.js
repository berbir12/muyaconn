// Start SMS Server with Environment Variables
// This script loads environment variables and starts the SMS server

const { config } = require('dotenv');
const path = require('path');

// Load environment variables from .env file
config({ path: path.join(__dirname, '.env') });

// Set environment variables for the SMS server
process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if required environment variables are set
const requiredVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease set these in your .env file or Supabase project settings.');
  process.exit(1);
}

console.log('✅ All required environment variables are set');
console.log('🚀 Starting SMS server...\n');

// Start the SMS server
require('./sms-server.js');
