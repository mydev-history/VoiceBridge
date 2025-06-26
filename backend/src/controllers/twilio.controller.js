const supabase = require('../config/supabase');
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const handleCallWebhook = async (req, res) => {
    console.log("Hello")
    const {
        CallSid,
        elder_id,
        direction,
        answered,
        timestamp
    } = req.body;

    console.log(`Twilio Webhook Request: SID ${CallSid || 'N/A'}, Elder ${elder_id || 'N/A'}, Answered ${answered}, Direction ${direction || 'N/A'}, Timestamp ${timestamp || 'N/A'}`);

    try {
        // Determine call status based on answered flag
        let callStatus = 'initiated';
        if (answered === true) {
            callStatus = 'in-progress';
        } else if (answered === false) {
            callStatus = 'no-answer';
        }

        // Create or update call record
        const callData = {
            call_sid: CallSid,
            elder_id: elder_id,
            status: callStatus,
            start_time: answered ? (timestamp || new Date().toISOString()) : null,
            end_time: null, // Will be updated when call ends
            duration_seconds: null,
            latency_ms: null
        };

        const { data, error } = await supabase
            .from('calls')
            .upsert(callData, {
                onConflict: 'call_sid'
            })
            .select();

        if (error) {
            console.error('Supabase error logging call status:', error.message);
            throw error;
        }

        console.log('Call status updated:', data);

        // Return the response in the expected format
        const response = {
            call_id: data[0]?.id || null,
            status: callStatus
        };
        console.log('Twilio Webhook Response:', JSON.stringify(response));

        res.json(response);

    } catch (err) {
        console.error('Error processing Twilio webhook:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

const generateCallTwiML = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is your VoiceBridge assistant. I'm here to check in on you today.</Say>
    <Pause length="1"/>
    <Say voice="alice">How are you feeling today? Please tell me about your mood.</Say>
    <Record 
        action="/v1/webhooks/recording" 
        method="POST" 
        maxLength="30" 
        playBeep="true"
        trim="trim-silence"/>
    <Say voice="alice">Thank you for sharing. Have you taken your medications today?</Say>
    <Record 
        action="/v1/webhooks/recording" 
        method="POST" 
        maxLength="30" 
        playBeep="true"
        trim="trim-silence"/>
    <Say voice="alice">How did you sleep last night?</Say>
    <Record 
        action="/v1/webhooks/recording" 
        method="POST" 
        maxLength="30" 
        playBeep="true"
        trim="trim-silence"/>
    <Say voice="alice">Thank you for your time. I'll share this information with your caregiver. Have a wonderful day!</Say>
</Response>`;
};

const handleRecordingWebhook = async (req, res) => {
    const {
        CallSid,
        RecordingUrl,
        RecordingSid,
        RecordingDuration,
        RecordingChannels,
        RecordingStatus
    } = req.body;

    console.log(`Recording Webhook Request: SID ${CallSid || 'N/A'}, Recording ${RecordingSid || 'N/A'}, Status ${RecordingStatus || 'N/A'}`);

    try {
        // Store recording information
        const { data, error } = await supabase
            .from('transcripts')
            .insert({
                call_id: CallSid, // This should be the actual call UUID, not CallSid
                transcript_text: `Recording available at: ${RecordingUrl}`,
                confidence_score: 0.0, // Will be updated after processing
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error storing recording info:', error);
        }

        // Return TwiML to continue the call
        console.log('Recording Webhook Response: <Response></Response>');
        res.type('text/xml');
        res.send('<Response></Response>');

    } catch (err) {
        console.error('Error processing recording webhook:', err);
        res.status(500).send('Server Error');
    }
};

// Test endpoint to simulate Twilio webhook calls
const testWebhook = async (req, res) => {
    const { CallSid, elder_id, direction, answered, timestamp } = req.body;

    console.log(`Test Webhook Request: CallSid: ${CallSid || 'N/A'}, Elder: ${elder_id || 'N/A'}, Answered: ${answered}, Direction: ${direction || 'N/A'}, Timestamp: ${timestamp || 'N/A'}`);

    // Simulate webhook payload
    const testPayload = {
        CallSid: CallSid || `test_${Date.now()}`,
        elder_id: elder_id || '550e8400-e29b-41d4-a716-446655440000',
        direction: direction || 'outbound',
        answered: answered !== undefined ? answered : true,
        timestamp: timestamp || new Date().toISOString()
    };

    // Process the test webhook
    const mockReq = { body: testPayload };
    const mockRes = {
        json: (data) => {
            console.log('Test Webhook Mock Response:', data);
        },
        status: (code) => mockRes
    };

    await handleCallWebhook(mockReq, mockRes);
    console.log(JSON.stringify({
        message: 'Test webhook processed successfully',
        payload: testPayload,
        timestamp: new Date().toISOString()
    }));
    res.json({
        message: 'Test webhook processed successfully',
        payload: testPayload,
        timestamp: new Date().toISOString()
    });
};

// POST /v1/call/initiate
const initiateCall = async (req, res) => {
    const { elderPhone, callerId } = req.body;
    console.log(`initiateCall Request: elderPhone: ${elderPhone || 'N/A'}, callerId: ${callerId || 'N/A'}`);

    if (!elderPhone || !callerId) {
        const errorResp = { success: false, message: 'elderPhone and callerId are required.' };
        console.log('initiateCall Response:', JSON.stringify(errorResp));
        return res.status(400).json(errorResp);
    }

    try {
        // Make sure phone numbers are in E.164 format
        const formattedElderPhone = elderPhone.startsWith('+') ? elderPhone : `+1${elderPhone.replace(/\D/g, '')}`;

        const call = await twilioClient.calls.create({
            to: formattedElderPhone,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: process.env.TWILIO_WEBHOOK_URL,
        });

        console.log("Call initiated successfully, SID:", call.sid);

        // Return the REAL call SID, not fake one
        const resp = {
            success: true,
            callSid: call.sid, // 
            status: call.status // queue
        };
        console.log('initiateCall Response:', JSON.stringify(resp));
        return res.json(resp);

    } catch (error) {
        console.error('Twilio call failed:', {
            code: error.code,
            message: error.message,
            moreInfo: error.moreInfo,
            elderPhone: elderPhone
        });

        const errorResp = {
            success: false,
            message: `Call failed: ${error.message}`,
            errorCode: error.code
        };
        console.log('initiateCall Error Response:', JSON.stringify(errorResp));
        return res.status(500).json(errorResp);
    }
};

// POST /v1/call/update-status
const updateCallStatus = async (req, res) => {
    const { callSid, status } = req.body;
    console.log(`updateCallStatus Request: callSid ${callSid || 'N/A'}, status ${status || 'N/A'}`);
    if (!callSid || !status) {
        const errorResp = { success: false, message: 'callSid and status are required.' };
        console.log('updateCallStatus Response:', JSON.stringify(errorResp));
        return res.status(400).json(errorResp);
    }
    // Placeholder response
    const resp = { success: true };
    console.log('updateCallStatus Response:', JSON.stringify(resp));
    return res.json(resp);
};

// POST /v1/call/missed-retry
const missedRetry = async (req, res) => {
    const { callSid, elderId, retryCount } = req.body;
    console.log(`missedRetry Request: callSid ${callSid || 'N/A'}, elderId ${elderId || 'N/A'}, retryCount ${retryCount !== undefined ? retryCount : 'N/A'}`);
    if (!callSid || !elderId || retryCount === undefined) {
        const errorResp = { success: false, message: 'callSid, elderId, and retryCount are required.' };
        console.log('missedRetry Response:', JSON.stringify(errorResp));
        return res.status(400).json(errorResp);
    }
    // Placeholder response
    const resp = { success: true, nextRetryTime: '2025-06-30T15:30:00Z' };
    console.log('missedRetry Response:', JSON.stringify(resp));
    return res.json(resp);
};

// POST /v1/call/voicemail
const voicemailHandler = async (req, res) => {
    const { callSid, elderId } = req.body;
    console.log(`voicemailHandler Request: callSid ${callSid || 'N/A'}, elderId ${elderId || 'N/A'}`);
    if (!callSid || !elderId) {
        const errorResp = { success: false, message: 'callSid and elderId are required.' };
        console.log('voicemailHandler Response:', JSON.stringify(errorResp));
        return res.status(400).json(errorResp);
    }
    // Placeholder response
    const resp = { success: true };
    console.log('voicemailHandler Response:', JSON.stringify(resp));
    return res.json(resp);
};

const handleCallHookWebhook = async (req, res) => {
    console.log('Twilio webhook request body:', req.body);

    const response = new twilio.twiml.VoiceResponse();
    response.say("Hello! Please leave a message after the beep.");
    // Record the call
    response.record({
        maxLength: 120, // Set max length for the recording (in seconds)
        action: '/recording_complete', // Callback URL when recording is complete
        method: 'POST',
        transcribe: true, // Optional: if you want Twilio to transcribe it
    });

    console.log('Twilio webhook response TwiML:', response.toString());

    res.type('text/xml');
    res.send(response.toString());
};

module.exports = {
    handleCallWebhook,
    handleRecordingWebhook,
    testWebhook,
    initiateCall,
    updateCallStatus,
    missedRetry,
    voicemailHandler,
    handleCallHookWebhook
}; 