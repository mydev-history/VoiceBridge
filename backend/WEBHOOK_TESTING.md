# Twilio Webhook Testing Guide

This guide demonstrates how to test and verify the Twilio webhook functionality in the VoiceBridge backend.

## 🎯 Overview

The VoiceBridge backend now includes comprehensive Twilio webhook handling for:
- **Call status updates** (initiated, ringing, in-progress, completed, etc.)
- **Recording webhooks** (when calls are recorded)
- **Test endpoints** for simulating webhooks without actual Twilio calls

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm run dev
```

### 3. Run Webhook Tests
```bash
npm test
```

## 📋 Available Endpoints

### Production Webhooks
- `POST /v1/webhooks/call-hook` - Handles Twilio call status webhooks
- `POST /v1/webhooks/recording` - Handles Twilio recording webhooks

### Testing Endpoints
- `POST /v1/test/webhook` - Simulates Twilio webhooks for testing

## 🧪 Testing the Webhooks

### Automated Test Suite
The `test-webhooks.js` script automatically tests all webhook scenarios:

```bash
npm test
```

This will test:
- ✅ Call initiation
- ✅ Call ringing
- ✅ Call answered (in-progress)
- ✅ Call completed
- ✅ Call failed
- ✅ No answer

### Manual Testing with curl

#### Test Call Initiation
```bash
curl -X POST http://localhost:3000/v1/test/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "callStatus": "initiated",
    "phoneNumber": "+1234567890",
    "direction": "outbound-api"
  }'
```

#### Test Call Answered
```bash
curl -X POST http://localhost:3000/v1/test/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "callStatus": "in-progress",
    "phoneNumber": "+1234567890",
    "direction": "outbound-api"
  }'
```

#### Test Call Completed
```bash
curl -X POST http://localhost:3000/v1/test/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "callStatus": "completed",
    "phoneNumber": "+1234567890",
    "direction": "outbound-api"
  }'
```

## 🔧 Webhook Configuration

### Twilio Webhook URL Setup
To receive real Twilio webhooks, configure your Twilio webhook URL to point to:
```
https://your-domain.com/v1/webhooks/call-hook
```

### Environment Variables Required
Make sure these are set in your `.env` file:
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## 📊 What Gets Logged

### Database Updates
Each webhook call updates the `calls` table with:
- `call_sid` - Twilio's unique call identifier
- `status` - Current call status
- `start_time` - When call was answered
- `end_time` - When call ended
- `duration_seconds` - Call duration
- `elder_id` - Linked elder (if found by phone number)
- `caregiver_id` - Linked caregiver (if found by phone number)

### Console Logs
The server logs detailed information about each webhook:
```
Twilio Webhook: SID CA1234567890, Status in-progress, From +1987654321, To +1234567890
Call CA1234567890 answered by +1234567890
Call status updated: [{...}]
```

## 🎭 TwiML Responses

When a call is answered (`in-progress`), the webhook returns TwiML that:
1. Greets the elder
2. Asks about their mood
3. Records their response
4. Asks about medications
5. Records their response
6. Asks about sleep
7. Records their response
8. Thanks them and ends the call

Example TwiML response:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is your VoiceBridge assistant. I'm here to check in on you today.</Say>
    <Pause length="1"/>
    <Say voice="alice">How are you feeling today? Please tell me about your mood.</Say>
    <Record action="/v1/webhooks/recording" method="POST" maxLength="30" playBeep="true" trim="trim-silence"/>
    <!-- ... more questions and recordings ... -->
</Response>
```

## 🔍 Monitoring and Debugging

### Check Server Logs
Watch the console output for detailed webhook processing:
```bash
npm run dev
```

### Check Database
Query the `calls` table to see webhook data:
```sql
SELECT * FROM calls ORDER BY created_at DESC LIMIT 10;
```

### API Documentation
Visit the Swagger docs at:
```
http://localhost:3000/api-docs
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook not receiving data**
   - Check server is running on correct port
   - Verify webhook URL is accessible
   - Check firewall/network settings

2. **Database errors**
   - Ensure Supabase credentials are correct
   - Run database migrations: `npx supabase db push`
   - Check RLS policies

3. **TwiML not working**
   - Verify Twilio account is active
   - Check phone number is verified
   - Ensure webhook URL returns valid XML

### Debug Mode
Enable detailed logging by setting:
```env
LOG_LEVEL=debug
```

## 📈 Next Steps

1. **Real Twilio Integration**
   - Set up a Twilio account
   - Configure webhook URLs in Twilio console
   - Test with real phone numbers

2. **Enhanced Features**
   - Add speech-to-text processing
   - Implement call analytics
   - Add retry logic for failed calls

3. **Production Deployment**
   - Deploy to production server
   - Set up SSL certificates
   - Configure monitoring and alerts

## 📞 Support

For issues or questions:
1. Check the server logs for error messages
2. Verify all environment variables are set
3. Test with the provided test endpoints
4. Review the API documentation at `/api-docs` 