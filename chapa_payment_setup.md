# Chapa Payment Integration Setup

## 1. Environment Variables

Add these environment variables to your `.env` file:

```bash
# Chapa Payment Integration
EXPO_PUBLIC_CHAPA_PUBLIC_KEY=CHASECK_TEST-your_chapa_public_key_here
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_APP_URL=exp://192.168.1.100:8081

# Backend Environment Variables
CHAPA_WEBHOOK_SECRET=your_chapa_webhook_secret_here
```

## 2. Database Setup

Run the SQL script to create the payments table:

```sql
-- Run the contents of create_payments_table.sql in your Supabase SQL editor
```

## 3. Chapa Account Setup

1. **Create Chapa Account**: Sign up at [chapa.co](https://chapa.co)
2. **Get API Keys**: 
   - Public Key: For frontend integration
   - Secret Key: For backend webhook verification
3. **Configure Webhooks**: Set webhook URL to `https://your-api-domain.com/api/payments/chapa/callback`

## 4. Payment Flow

### Frontend Flow:
1. Task is marked as completed by tasker
2. Customer sees "Pay with Chapa" button
3. Customer clicks button → PaymentModal opens
4. Customer confirms payment → Redirected to Chapa checkout
5. After payment → Webhook updates payment status
6. Customer can then rate the tasker

### Backend Flow:
1. Webhook receives payment status from Chapa
2. Updates payment record in database
3. Updates task payment_status
4. Sends notifications (optional)

## 5. Testing

### Test Mode:
- Use `CHASECK_TEST-` prefix for test keys
- Test payments won't charge real money
- Use test card numbers provided by Chapa

### Production Mode:
- Use `CHASECK-` prefix for live keys
- Real payments will be processed
- Ensure webhook URL is HTTPS

## 6. Security Notes

- Never expose secret keys in frontend code
- Always verify webhook signatures
- Use HTTPS in production
- Implement proper error handling
- Log all payment events for audit

## 7. Error Handling

The integration includes comprehensive error handling:
- Network failures
- Invalid payment data
- Webhook verification failures
- Database update errors

## 8. Monitoring

Monitor these metrics:
- Payment success rate
- Webhook delivery success
- Average payment processing time
- Failed payment reasons
