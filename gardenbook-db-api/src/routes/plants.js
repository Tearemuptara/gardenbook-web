const express = require('express');
const router = express.Router();
const plantModel = require('../models/plant');

/**
 * @swagger
 * /plants:
 *   get:
 *     summary: Retrieve a list of plants
 *     description: Retrieve a list of plants from the Garden Book database
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
router.get('/', async (req, res) => {
  console.log('[GET /plants] Request received');
  try {
    const plants = await plantModel.getAllPlants();
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the plant to retrieve
 *         schema:
 *           type: integer
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
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`[GET /plants/${id}] Request received`);
  
  try {
    const plant = await plantModel.getPlantById(id);
    if (!plant) {
      console.log(`[GET /plants/${id}] Plant not found`);
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
 */
router.post('/', async (req, res) => {
  console.log('[POST /plants] Request received with body:', req.body);
  
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('[POST /plants] Invalid request: Empty request body');
      return res.status(400).json({ error: 'Request body is empty or invalid' });
    }
    
    const plant = await plantModel.createPlant(req.body);
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the plant to update
 *         schema:
 *           type: integer
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
 *         description: Plant not found
 */
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`[PUT /plants/${id}] Request received with body:`, req.body);
  
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log(`[PUT /plants/${id}] Invalid request: Empty request body`);
      return res.status(400).json({ error: 'Request body is empty or invalid' });
    }
    
    const plant = await plantModel.updatePlant(id, req.body);
    if (!plant) {
      console.log(`[PUT /plants/${id}] Plant not found`);
      return res.status(404).json({ error: 'Plant not found' });
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the plant to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The deleted plant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plant'
 *       404:
 *         description: Plant not found
 */
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`[DELETE /plants/${id}] Request received`);
  
  try {
    const plant = await plantModel.deletePlant(id);
    if (!plant) {
      console.log(`[DELETE /plants/${id}] Plant not found`);
      return res.status(404).json({ error: 'Plant not found' });
    }
    console.log(`[DELETE /plants/${id}] Plant deleted successfully:`, plant);
    res.json(plant);
  } catch (error) {
    console.error(`[DELETE /plants/${id}] Error deleting plant:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 