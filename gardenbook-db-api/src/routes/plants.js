const express = require('express');
const router = express.Router();
const plantModel = require('../models/plant');
const { authenticateToken, optionalAuthentication } = require('../middleware/auth');

/**
 * @swagger
 * /plants:
 *   get:
 *     summary: Retrieve a list of plants
 *     description: Retrieve a list of plants from the Garden Book database. If authenticated, returns only the user's plants.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of plants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Plant'
 */
router.get('/', optionalAuthentication, async (req, res) => {
  console.log('[GET /plants] Request received');
  try {
    let plants;
    // If user is authenticated, return only their plants
    if (req.user && req.user.userId) {
      console.log(`[GET /plants] Getting plants for user ${req.user.userId}`);
      plants = await plantModel.getPlantsByUserId(req.user.userId);
    } else {
      // For backwards compatibility - return all plants if not authenticated
      // This behavior should be removed once authentication is fully implemented
      console.log('[GET /plants] Getting all plants (no user authentication)');
      plants = await plantModel.getAllPlants();
    }
    console.log(`[GET /plants] Successfully retrieved ${plants.length} plants`);
    res.json(plants);
  } catch (error) {
    console.error('[GET /plants] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /plants/{id}:
 *   get:
 *     summary: Get a plant by id
 *     description: Get a plant by id. If authenticated, only returns the plant if it belongs to the user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the plant to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A plant object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plant'
 *       404:
 *         description: Plant not found
 */
router.get('/:id', optionalAuthentication, async (req, res) => {
  const id = req.params.id;
  console.log(`[GET /plants/${id}] Request received`);
  
  try {
    // If user is authenticated, only get their plant
    const userId = req.user?.userId || null;
    const plant = await plantModel.getPlantById(id, userId);
    
    if (!plant) {
      console.log(`[GET /plants/${id}] Plant not found or not owned by user`);
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    console.log(`[GET /plants/${id}] Successfully retrieved plant: ${JSON.stringify(plant)}`);
    res.json(plant);
  } catch (error) {
    console.error(`[GET /plants/${id}] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /plants:
 *   post:
 *     summary: Create a new plant
 *     description: Create a new plant associated with the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Plant'
 *     responses:
 *       201:
 *         description: The created plant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plant'
 *       401:
 *         description: Authentication required
 */
router.post('/', authenticateToken, async (req, res) => {
  console.log('[POST /plants] Request received with body:', req.body);
  
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('[POST /plants] Invalid request: Empty request body');
      return res.status(400).json({ error: 'Request body is empty or invalid' });
    }
    
    // Associate the plant with the current user
    const plantData = {
      ...req.body,
      userId: req.user.userId
    };
    
    const plant = await plantModel.createPlant(plantData);
    console.log('[POST /plants] Plant created successfully:', plant);
    res.status(201).json(plant);
  } catch (error) {
    console.error('[POST /plants] Error creating plant:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /plants/{id}:
 *   put:
 *     summary: Update a plant
 *     description: Update a plant. Only works if the plant belongs to the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the plant to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Plant'
 *     responses:
 *       200:
 *         description: The updated plant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plant'
 *       404:
 *         description: Plant not found or not owned by user
 *       401:
 *         description: Authentication required
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  console.log(`[PUT /plants/${id}] Request received with body:`, req.body);
  
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log(`[PUT /plants/${id}] Invalid request: Empty request body`);
      return res.status(400).json({ error: 'Request body is empty or invalid' });
    }
    
    // Only update if the plant belongs to the user
    const plantData = { ...req.body };
    // Don't allow changing userId via update
    delete plantData.userId;
    
    const plant = await plantModel.updatePlant(id, plantData, req.user.userId);
    if (!plant) {
      console.log(`[PUT /plants/${id}] Plant not found or not owned by user ${req.user.userId}`);
      return res.status(404).json({ error: 'Plant not found or not owned by you' });
    }
    console.log(`[PUT /plants/${id}] Plant updated successfully:`, plant);
    res.json(plant);
  } catch (error) {
    console.error(`[PUT /plants/${id}] Error updating plant:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /plants/{id}:
 *   delete:
 *     summary: Delete a plant
 *     description: Delete a plant. Only works if the plant belongs to the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the plant to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The deleted plant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plant'
 *       404:
 *         description: Plant not found or not owned by user
 *       401:
 *         description: Authentication required
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  console.log(`[DELETE /plants/${id}] Request received`);
  
  try {
    // Only delete if the plant belongs to the user
    const plant = await plantModel.deletePlant(id, req.user.userId);
    if (!plant) {
      console.log(`[DELETE /plants/${id}] Plant not found or not owned by user ${req.user.userId}`);
      return res.status(404).json({ error: 'Plant not found or not owned by you' });
    }
    console.log(`[DELETE /plants/${id}] Plant deleted successfully:`, plant);
    res.json(plant);
  } catch (error) {
    console.error(`[DELETE /plants/${id}] Error deleting plant:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 