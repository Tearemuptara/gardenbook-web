const express = require('express');
const router = express.Router();
const userModel = require('../models/user');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth');

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
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user can only access their own data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id/encyclopedia', authenticateToken, async (req, res) => {
  const id = req.params.id;
  console.log(`[GET /users/${id}/encyclopedia] Request received`);
  
  try {
    // Check if ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      console.log(`[GET /users/${id}/encyclopedia] Invalid ObjectId: ${id}`);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Verify that the authenticated user is accessing their own data
    if (req.user.userId !== id) {
      console.log(`[GET /users/${id}/encyclopedia] Unauthorized access attempt by user ${req.user.userId}`);
      return res.status(403).json({ error: 'You can only access your own encyclopedia data' });
    }
    
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
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user can only update their own data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/:id/encyclopedia', authenticateToken, async (req, res) => {
  const id = req.params.id;
  console.log(`[POST /users/${id}/encyclopedia] Request received with body:`, req.body);
  
  try {
    // Check if ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      console.log(`[POST /users/${id}/encyclopedia] Invalid ObjectId: ${id}`);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Verify that the authenticated user is updating their own data
    if (req.user.userId !== id) {
      console.log(`[POST /users/${id}/encyclopedia] Unauthorized access attempt by user ${req.user.userId}`);
      return res.status(403).json({ error: 'You can only update your own encyclopedia data' });
    }
    
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

/**
 * @swagger
 * /users/{id}/context-cards:
 *   get:
 *     summary: Retrieve a user's context cards
 *     description: Retrieve all context cards for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to retrieve context cards for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of context cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contextCards:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user can only access their own data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id/context-cards', authenticateToken, async (req, res) => {
  const id = req.params.id;
  console.log(`[GET /users/${id}/context-cards] Request received`);
  
  try {
    // Check if ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      console.log(`[GET /users/${id}/context-cards] Invalid ObjectId: ${id}`);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Verify that the authenticated user is accessing their own data
    if (req.user.userId !== id) {
      console.log(`[GET /users/${id}/context-cards] Unauthorized access attempt by user ${req.user.userId}`);
      return res.status(403).json({ error: 'You can only access your own context cards' });
    }
    
    const contextCards = await userModel.getContextCards(id);
    if (contextCards === null) {
      console.log(`[GET /users/${id}/context-cards] User not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[GET /users/${id}/context-cards] Successfully retrieved ${contextCards.length} context cards`);
    res.json({ contextCards });
  } catch (error) {
    console.error(`[GET /users/${id}/context-cards] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{id}/context-cards:
 *   post:
 *     summary: Create a new context card
 *     description: Create a new context card for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to create a context card for
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the context card
 *               content:
 *                 type: string
 *                 description: Content of the context card
 *     responses:
 *       201:
 *         description: Created context card
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contextCard:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user can only create their own context cards
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/:id/context-cards', authenticateToken, async (req, res) => {
  const id = req.params.id;
  console.log(`[POST /users/${id}/context-cards] Request received with body:`, req.body);
  
  try {
    // Check if ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      console.log(`[POST /users/${id}/context-cards] Invalid ObjectId: ${id}`);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Verify that the authenticated user is creating context cards for their own account
    if (req.user.userId !== id) {
      console.log(`[POST /users/${id}/context-cards] Unauthorized access attempt by user ${req.user.userId}`);
      return res.status(403).json({ error: 'You can only create context cards for your own account' });
    }
    
    // Validate request body
    if (!req.body || !req.body.title || !req.body.content) {
      console.log(`[POST /users/${id}/context-cards] Invalid request: Missing required fields`);
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Create context card
    const contextCard = await userModel.createContextCard(id, {
      title: req.body.title,
      content: req.body.content
    });
    
    if (contextCard === null) {
      console.log(`[POST /users/${id}/context-cards] User not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[POST /users/${id}/context-cards] Successfully created context card with id ${contextCard.id}`);
    res.status(201).json({ contextCard });
  } catch (error) {
    console.error(`[POST /users/${id}/context-cards] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{userId}/context-cards/{cardId}:
 *   put:
 *     summary: Update a context card
 *     description: Update a specific context card for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user who owns the context card
 *         schema:
 *           type: string
 *       - in: path
 *         name: cardId
 *         required: true
 *         description: ID of the context card to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated title of the context card
 *               content:
 *                 type: string
 *                 description: Updated content of the context card
 *     responses:
 *       200:
 *         description: Updated context card
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contextCard:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user can only update their own context cards
 *       404:
 *         description: User or context card not found
 *       500:
 *         description: Server error
 */
router.put('/:userId/context-cards/:cardId', authenticateToken, async (req, res) => {
  const userId = req.params.userId;
  const cardId = req.params.cardId;
  console.log(`[PUT /users/${userId}/context-cards/${cardId}] Request received with body:`, req.body);
  
  try {
    // Check if IDs are valid MongoDB ObjectIds
    if (!ObjectId.isValid(userId)) {
      console.log(`[PUT /users/${userId}/context-cards/${cardId}] Invalid user ObjectId: ${userId}`);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Verify that the authenticated user is updating their own context card
    if (req.user.userId !== userId) {
      console.log(`[PUT /users/${userId}/context-cards/${cardId}] Unauthorized access attempt by user ${req.user.userId}`);
      return res.status(403).json({ error: 'You can only update your own context cards' });
    }
    
    // Validate request body
    if (!req.body || !req.body.title || !req.body.content) {
      console.log(`[PUT /users/${userId}/context-cards/${cardId}] Invalid request: Missing required fields`);
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Update context card
    const contextCard = await userModel.updateContextCard(userId, cardId, {
      title: req.body.title,
      content: req.body.content
    });
    
    if (contextCard === null) {
      console.log(`[PUT /users/${userId}/context-cards/${cardId}] User or context card not found`);
      return res.status(404).json({ error: 'User or context card not found' });
    }
    
    console.log(`[PUT /users/${userId}/context-cards/${cardId}] Successfully updated context card`);
    res.json({ contextCard });
  } catch (error) {
    console.error(`[PUT /users/${userId}/context-cards/${cardId}] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/{userId}/context-cards/{cardId}:
 *   delete:
 *     summary: Delete a context card
 *     description: Delete a specific context card for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user who owns the context card
 *         schema:
 *           type: string
 *       - in: path
 *         name: cardId
 *         required: true
 *         description: ID of the context card to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Context card deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user can only delete their own context cards
 *       404:
 *         description: User or context card not found
 *       500:
 *         description: Server error
 */
router.delete('/:userId/context-cards/:cardId', authenticateToken, async (req, res) => {
  const userId = req.params.userId;
  const cardId = req.params.cardId;
  console.log(`[DELETE /users/${userId}/context-cards/${cardId}] Request received`);
  
  try {
    // Check if IDs are valid MongoDB ObjectIds
    if (!ObjectId.isValid(userId)) {
      console.log(`[DELETE /users/${userId}/context-cards/${cardId}] Invalid user ObjectId: ${userId}`);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Verify that the authenticated user is deleting their own context card
    if (req.user.userId !== userId) {
      console.log(`[DELETE /users/${userId}/context-cards/${cardId}] Unauthorized access attempt by user ${req.user.userId}`);
      return res.status(403).json({ error: 'You can only delete your own context cards' });
    }
    
    // Delete context card
    const success = await userModel.deleteContextCard(userId, cardId);
    
    if (!success) {
      console.log(`[DELETE /users/${userId}/context-cards/${cardId}] User or context card not found`);
      return res.status(404).json({ error: 'User or context card not found' });
    }
    
    console.log(`[DELETE /users/${userId}/context-cards/${cardId}] Successfully deleted context card`);
    res.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /users/${userId}/context-cards/${cardId}] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 