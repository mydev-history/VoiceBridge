const express = require('express');
const router = express.Router();

const { handleStripeWebhook } = require('../controllers/stripe.controller');
const { handleCallHookWebhook, handleCallWebhook, handleRecordingWebhook, testWebhook } = require('../controllers/twilio.controller');
const callRoutes = require('./call.routes');
const elderRoutes = require('./elder.routes');

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhook endpoints for third-party services like Stripe and Twilio.
 */

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Handles Stripe webhook events.
 *     tags: [Webhooks]
 *     description: "Receives events from Stripe, validates the signature, and processes them. Specifically handles `checkout.session.completed` to update a caregiver's subscription tier in the database."
 *     requestBody:
 *       description: Stripe event payload. The raw body is required for signature validation.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The event ID.
 *               type:
 *                 type: string
 *                 description: The event type (e.g., checkout.session.completed).
 *     responses:
 *       '200':
 *         description: Successfully received and processed the webhook.
 *       '400':
 *         description: Bad request, likely due to a missing or invalid Stripe signature.
 */
router.use('/calls', callRoutes);
router.use('/elders', elderRoutes);

router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

/**
 * @swagger
 * /webhooks/call-hook:
 *   post:
 *     summary: Handles Twilio call status webhooks.
 *     tags: [Webhooks]
 *     description: "Receives call status updates from Twilio and logs them to the database. Returns call_id and status in response."
 *     requestBody:
 *       description: Twilio call status payload.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - CallSid
 *               - elder_id
 *             properties:
 *               CallSid:
 *                 type: string
 *                 description: Twilio's unique call identifier.
 *                 example: "CA1234567890"
 *               elder_id:
 *                 type: string
 *                 format: uuid
 *                 description: The UUID of the elder being called.
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               direction:
 *                 type: string
 *                 description: The direction of the call.
 *                 enum: [inbound, outbound]
 *                 example: "outbound"
 *               answered:
 *                 type: boolean
 *                 description: Whether the call was answered.
 *                 example: true
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of the call event.
 *                 example: "2025-06-20T14:03:00Z"
 *     responses:
 *       '200':
 *         description: Call status processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 call_id:
 *                   type: string
 *                   format: uuid
 *                   description: The UUID of the call record in the database.
 *                   example: "660e8400-e29b-41d4-a716-446655440000"
 *                 status:
 *                   type: string
 *                   description: The processed call status.
 *                   enum: [initiated, in-progress, no-answer]
 *                   example: "initiated"
 *       '500':
 *         description: Server error while processing the webhook.
 */
router.post('/webhooks/call-hook', express.json(), handleCallHookWebhook);

/**
 * @swagger
 * /webhooks/recording:
 *   post:
 *     summary: Handles Twilio recording webhooks.
 *     tags: [Webhooks]
 *     description: "Receives recording completion notifications from Twilio and stores recording information in the database."
 *     requestBody:
 *       description: Twilio recording payload.
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               CallSid:
 *                 type: string
 *                 description: The call identifier.
 *               RecordingSid:
 *                 type: string
 *                 description: The recording identifier.
 *               RecordingUrl:
 *                 type: string
 *                 description: URL where the recording can be accessed.
 *               RecordingDuration:
 *                 type: string
 *                 description: Duration of the recording in seconds.
 *     responses:
 *       '200':
 *         description: Recording information stored successfully.
 *       '500':
 *         description: Server error while processing the recording.
 */
router.post('/webhooks/recording', express.urlencoded({ extended: false }), handleRecordingWebhook);

/**
 * @swagger
 * /test/webhook:
 *   post:
 *     summary: Test endpoint to simulate Twilio webhook calls.
 *     tags: [Testing]
 *     description: "Allows testing of webhook functionality by simulating Twilio webhook payloads without requiring actual Twilio calls."
 *     requestBody:
 *       description: Test webhook parameters.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               CallSid:
 *                 type: string
 *                 description: The call identifier to simulate.
 *                 example: "CA1234567890"
 *               elder_id:
 *                 type: string
 *                 format: uuid
 *                 description: The UUID of the elder to simulate.
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               direction:
 *                 type: string
 *                 description: The call direction to simulate.
 *                 enum: [inbound, outbound]
 *                 example: "outbound"
 *               answered:
 *                 type: boolean
 *                 description: Whether the call was answered.
 *                 example: true
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp to simulate.
 *                 example: "2025-06-20T14:03:00Z"
 *     responses:
 *       '200':
 *         description: Test webhook processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Success message.
 *               payload:
 *                 type: object
 *                 description: The simulated webhook payload.
 *               timestamp:
 *                 type: string
 *                 description: Timestamp of the test.
 */
router.post('/test/webhook', testWebhook);

module.exports = router; 