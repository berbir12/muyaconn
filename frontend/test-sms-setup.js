// Test SMS Setup
// This script tests if your Twilio environment variables are properly configured

const { config } = require('dotenv');
const path = require('path');

// Load environment variables from .env file
config({ path: path.join(__dirname, '.env') });

console.log('🔍 Checking SMS Setup...\n');

// Check required environment variables
const requiredVars = {
  'EXPO_PUBLIC_SUPABASE_URL': process.env.EXPO_PUBLIC_SUPABASE_URL,
  'EXPO_PUBLIC_SUPABASE_ANON_KEY': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
  'TWILIO_AUTH_TOKEN': process.env.TWILIO_AUTH_TOKEN,
  'TWILIO_PHONE_NUMBER': process.env.TWILIO_PHONE_NUMBER
};

console.log('📋 Environment Variables Status:');
console.log('================================');

let allSet = true;

Object.entries(requiredVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? `${value.substring(0, 10)}...` : 'NOT SET';
  console.log(`${status} ${key}: ${displayValue}`);
  
  if (!value) {
    allSet = false;
  }
});

console.log('\n📝 Next Steps:');
console.log('==============');

if (!allSet) {
  console.log('❌ Some environment variables are missing!');
  console.log('\n1. Go to your Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/[your-project]/settings/environment-variables');
  console.log('\n2. Add these environment variables:');
  console.log('   TWILIO_ACCOUNT_SID=your_account_sid_here');
  console.log('   TWILIO_AUTH_TOKEN=your_auth_token_here');
  console.log('   TWILIO_PHONE_NUMBER=+1234567890');
  console.log('\n3. Get your Twilio credentials from:');
  console.log('   https://console.twilio.com/');
  console.log('\n4. Run this test again: node test-sms-setup.js');
} else {
  console.log('✅ All environment variables are set!');
  console.log('\n🚀 You can now start the SMS server:');
  console.log('   npm run sms-server');
  console.log('\n📱 Then start your app:');
  console.log('   npm start');
}

console.log('\n🔗 Useful Links:');
console.log('================');
console.log('• Supabase Dashboard: https://supabase.com/dashboard');
console.log('• Twilio Console: https://console.twilio.com/');
console.log('• Twilio Pricing: https://www.twilio.com/pricing');
