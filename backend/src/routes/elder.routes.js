const express = require('express');
const { getElders, createElder } = require('../controllers/elder.controller');
const router = express.Router();

/**
 * @swagger
 * /elders:
 *   get:
 *     summary: Get all elders
 *     tags: [Elders]
 *     responses:
 *       200:
 *         description: List of elders
 */
router.get('/', getElders);

/**
 * @swagger
 * /elders:
 *   post:
 *     summary: Create a new elder
 *     tags: [Elders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               timezone:
 *                 type: string
 *               voice_preference:
 *                 type: string
 *     responses:
 *       201:
 *         description: Elder created
 */
router.post('/', createElder);

module.exports = router; 