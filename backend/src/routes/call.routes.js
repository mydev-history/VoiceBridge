const express = require('express');
const { getCalls, createCall } = require('../controllers/call.controller');
const {
  initiateCall,
  updateCallStatus,
  missedRetry,
  voicemailHandler
} = require('../controllers/twilio.controller');
const router = express.Router();

/**
 * @swagger
 * /calls:
 *   get:
 *     summary: Get all calls
 *     tags: [Calls]
 *     responses:
 *       200:
 *         description: List of calls
 */
router.get('/', getCalls);

/**
 * @swagger
 * /calls:
 *   post:
 *     summary: Create a new call
 *     tags: [Calls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               elder_id:
 *                 type: string
 *               caregiver_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Call created
 */
router.post('/', createCall);

// Twilio-related APIs for Milestone 1

// Initiate a call
router.post('/initiate', initiateCall);

// Update call status
router.post('/update-status', updateCallStatus);

// Handle missed call and retry logic
router.post('/missed-retry', missedRetry);

// Handle voicemail detection and logging
router.post('/voicemail', voicemailHandler);

module.exports = router; 