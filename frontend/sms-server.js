// SMS Server for Muyacon
// This server handles SMS sending via Twilio using Supabase environment variables

const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Twilio configuration from Supabase environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !phoneNumber) {
  console.error('❌ Missing Twilio environment variables!');
  console.error('Please set the following in your Supabase project settings:');
  console.error('- TWILIO_ACCOUNT_SID');
  console.error('- TWILIO_AUTH_TOKEN');
  console.error('- TWILIO_PHONE_NUMBER');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// SMS endpoint
app.post('/api/send-sms', async (req, res) => {
  try {
    const { phoneNumber: to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ 
        error: 'Phone number and message are required' 
      });
    }
    
    console.log(`📱 Sending SMS to: ${to}`);
    console.log(`📝 Message: ${message}`);
    
    // Send SMS via Twilio
    const messageResult = await client.messages.create({
      body: message,
      from: phoneNumber,
      to: to
    });
    
    console.log(`✅ SMS sent successfully. SID: ${messageResult.sid}`);
    
    res.json({ 
      success: true, 
      messageId: messageResult.sid,
      message: 'SMS sent successfully'
    });
    
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    res.status(500).json({ 
      error: 'Failed to send SMS',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SMS API is running',
    twilioConfigured: !!(accountSid && authToken && phoneNumber)
  });
});

// Test endpoint to verify Twilio connection
app.get('/api/test-twilio', async (req, res) => {
  try {
    // Get account info to test connection
    const account = await client.api.accounts(accountSid).fetch();
    res.json({
      success: true,
      accountSid: account.sid,
      accountName: account.friendlyName,
      phoneNumber: phoneNumber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Twilio',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 SMS API server running on port ${PORT}`);
  console.log(`📞 Twilio Phone Number: ${phoneNumber}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test Twilio: http://localhost:${PORT}/api/test-twilio`);
});

// Environment variables needed in Supabase:
// TWILIO_ACCOUNT_SID=your_account_sid
// TWILIO_AUTH_TOKEN=your_auth_token
// TWILIO_PHONE_NUMBER=+1234567890
