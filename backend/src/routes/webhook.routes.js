const express = require('express');
const { handleCallHookWebhook } = require('../controllers/twilio.controller');
const { handleStripeWebhook } = require('../controllers/stripe.controller');

const router = express.Router();

/**
 * @swagger
 * /twilio/call-hook:
 *   post:
 *     summary: Handle incoming Twilio call webhook
 *     tags: [Twilio]
 *     description: Receives a webhook from Twilio when a call is received and returns TwiML to record the call.
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               From:
 *                 type: string
 *                 description: The caller's phone number
 *               CallSid:
 *                 type: string
 *                 description: The unique call SID
 *     responses:
 *       200:
 *         description: TwiML response to Twilio
 */
// router.post('/call-hook', handleCallHookWebhook);
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router; 