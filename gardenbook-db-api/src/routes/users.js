const express = require('express');
const router = express.Router();
const userModel = require('../models/user');

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user in the Garden Book database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for the user account
 *     responses:
 *       201:
 *         description: Created user object
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  console.log('[POST /users] Request received with body:', req.body);
  
  try {
    // Validate request body
    if (!req.body || !req.body.username) {
      console.log('[POST /users] Invalid request: Missing username');
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Create user
    const user = await userModel.createUser(req.body);
    console.log('[POST /users] User created successfully:', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('[POST /users] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{id}/encyclopedia:
 *   get:
 *     summary: Retrieve a user's encyclopedia data
 *     description: Retrieve the encyclopedia data for a specific user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to retrieve encyclopedia data for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Encyclopedia data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 encyclopedia:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id/encyclopedia', async (req, res) => {
  const id = req.params.id;
  console.log(`[GET /users/${id}/encyclopedia] Request received`);
  
  try {
    const encyclopedia = await userModel.getEncyclopedia(id);
    if (encyclopedia === null) {
      console.log(`[GET /users/${id}/encyclopedia] User not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[GET /users/${id}/encyclopedia] Successfully retrieved encyclopedia data`);
    res.json({ encyclopedia });
  } catch (error) {
    console.error(`[GET /users/${id}/encyclopedia] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{id}/encyclopedia:
 *   post:
 *     summary: Create or update a user's encyclopedia data
 *     description: Create or update the encyclopedia data for a specific user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to update encyclopedia data for
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - encyclopedia
 *             properties:
 *               encyclopedia:
 *                 type: string
 *                 description: Encyclopedia data containing gardening context
 *     responses:
 *       200:
 *         description: Updated encyclopedia data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 encyclopedia:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/:id/encyclopedia', async (req, res) => {
  const id = req.params.id;
  console.log(`[POST /users/${id}/encyclopedia] Request received with body:`, req.body);
  
  try {
    // Validate request body
    if (!req.body || !req.body.encyclopedia) {
      console.log(`[POST /users/${id}/encyclopedia] Invalid request: Missing encyclopedia data`);
      return res.status(400).json({ error: 'Encyclopedia data is required' });
    }
    
    // Update encyclopedia
    const encyclopedia = await userModel.updateEncyclopedia(id, req.body.encyclopedia);
    if (encyclopedia === null) {
      console.log(`[POST /users/${id}/encyclopedia] User not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[POST /users/${id}/encyclopedia] Successfully updated encyclopedia data`);
    res.json({ encyclopedia });
  } catch (error) {
    console.error(`[POST /users/${id}/encyclopedia] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 