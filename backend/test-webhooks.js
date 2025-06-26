const axios = require('axios');

const BASE_URL = 'http://localhost:3000/v1';

// Test data
const testElder = {
    full_name: 'John Smith',
    phone_number: '+1234567890',
    timezone: 'America/Toronto',
    voice_preference: 'twilio'
};

const testCaregiver = {
    full_name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone_number: '+1987654321',
    plan_tier: 'silver'
};

async function testWebhookFunctionality() {
    console.log('🧪 Testing Twilio Webhook Functionality\n');

    try {
        // Test 1: Simulate call initiated (not answered)
        console.log('1️⃣ Testing call initiated (not answered)...');
        const initResponse = await axios.post(`${BASE_URL}/test/webhook`, {
            CallSid: 'CA1234567890',
            elder_id: '550e8400-e29b-41d4-a716-446655440000',
            direction: 'outbound',
            answered: false,
            timestamp: '2025-06-20T14:03:00Z'
        });
        console.log('✅ Call initiated test passed');
        console.log('Response:', initResponse.data);

        // Test 2: Simulate call answered
        console.log('\n2️⃣ Testing call answered...');
        const answeredResponse = await axios.post(`${BASE_URL}/test/webhook`, {
            CallSid: 'CA1234567890',
            elder_id: '550e8400-e29b-41d4-a716-446655440000',
            direction: 'outbound',
            answered: true,
            timestamp: '2025-06-20T14:03:30Z'
        });
        console.log('✅ Call answered test passed');
        console.log('Response:', answeredResponse.data);

        // Test 3: Simulate different call with no answer
        console.log('\n3️⃣ Testing call with no answer...');
        const noAnswerResponse = await axios.post(`${BASE_URL}/test/webhook`, {
            CallSid: 'CA9876543210',
            elder_id: '660e8400-e29b-41d4-a716-446655440000',
            direction: 'outbound',
            answered: false,
            timestamp: '2025-06-20T15:00:00Z'
        });
        console.log('✅ No answer test passed');
        console.log('Response:', noAnswerResponse.data);

        // Test 4: Simulate inbound call
        console.log('\n4️⃣ Testing inbound call...');
        const inboundResponse = await axios.post(`${BASE_URL}/test/webhook`, {
            CallSid: 'CA1111111111',
            elder_id: '770e8400-e29b-41d4-a716-446655440000',
            direction: 'inbound',
            answered: true,
            timestamp: '2025-06-20T16:00:00Z'
        });
        console.log('✅ Inbound call test passed');
        console.log('Response:', inboundResponse.data);

        // Test 5: Test with minimal data (using defaults)
        console.log('\n5️⃣ Testing with minimal data...');
        const minimalResponse = await axios.post(`${BASE_URL}/test/webhook`, {
            CallSid: 'CA2222222222',
            elder_id: '880e8400-e29b-41d4-a716-446655440000'
        });
        console.log('✅ Minimal data test passed');
        console.log('Response:', minimalResponse.data);

        console.log('\n🎉 All webhook tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('- Call initiated (not answered): ✅');
        console.log('- Call answered: ✅');
        console.log('- Call with no answer: ✅');
        console.log('- Inbound call: ✅');
        console.log('- Minimal data test: ✅');

        console.log('\n📊 Expected Response Format:');
        console.log('{');
        console.log('  "call_id": "UUID from database",');
        console.log('  "status": "initiated|in-progress|no-answer"');
        console.log('}');

        console.log('\n🔗 Next steps:');
        console.log('1. Check your server logs for detailed webhook processing');
        console.log('2. Verify data is being stored in your Supabase database');
        console.log('3. Test with actual Twilio webhooks by configuring your Twilio webhook URL');
        console.log('4. Use the API documentation at http://localhost:3000/api-docs');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the tests
testWebhookFunctionality(); 