/**
 * @swagger
 * components:
 *   schemas:
 *     Plant:
 *       type: object
 *       required:
 *         - name
 *         - scientificName
 *         - careLevel
 *         - waterFrequency
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           description: The MongoDB ObjectId of the plant
 *         userId:
 *           type: string
 *           description: The MongoDB ObjectId of the user who owns this plant
 *         name:
 *           type: string
 *           description: The name of the plant
 *         scientificName:
 *           type: string
 *           description: The scientific name of the plant
 *         careLevel:
 *           type: string
 *           description: The care level of the plant (EASY, MODERATE, DIFFICULT)
 *         waterFrequency:
 *           type: integer
 *           description: How often the plant needs to be watered (in days)
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const client = new MongoClient(mongoUri);

let db;
let plantsCollection;
let isConnected = false;

const connect = async () => {
  if (!isConnected) {
    await client.connect();
    db = client.db('gardenbook');
    plantsCollection = db.collection('plants');
    isConnected = true;
  }
};

// Connect when the module is loaded
connect().catch(console.error);

// Graceful shutdown function to be called when the application is terminating
const closeConnection = async () => {
  if (isConnected) {
    await client.close();
    isConnected = false;
    db = undefined;
    plantsCollection = undefined;
  }
};

// Add event listeners for application termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

const getAllPlants = async () => {
  try {
    await connect();
    const plants = await plantsCollection.find({}).toArray();
    return plants.map(plant => ({
      ...plant,
      id: plant._id.toString(),
      _id: undefined
    }));
  } catch (error) {
    console.error('[getAllPlants] Error:', error);
    throw error;
  }
};

// Get plants for a specific user
const getPlantsByUserId = async (userId) => {
  try {
    await connect();
    const plants = await plantsCollection.find({ userId }).toArray();
    return plants.map(plant => ({
      ...plant,
      id: plant._id.toString(),
      _id: undefined
    }));
  } catch (error) {
    console.error(`[getPlantsByUserId] Error for userId ${userId}:`, error);
    throw error;
  }
};

const getPlantById = async (id, userId = null) => {
  try {
    await connect();
    const query = { _id: new ObjectId(id) };
    // If userId is provided, ensure the plant belongs to this user
    if (userId) {
      query.userId = userId;
    }
    const plant = await plantsCollection.findOne(query);
    if (!plant) return null;
    return {
      ...plant,
      id: plant._id.toString(),
      _id: undefined
    };
  } catch (error) {
    console.error(`[getPlantById] Error for id ${id}:`, error);
    throw error;
  }
};

const createPlant = async (plantData) => {
  try {
    await connect();
    const result = await plantsCollection.insertOne(plantData);
    return {
      ...plantData,
      id: result.insertedId.toString()
    };
  } catch (error) {
    console.error('[createPlant] Error:', error);
    throw error;
  }
};

const updatePlant = async (id, plantData, userId = null) => {
  try {
    await connect();
    const query = { _id: new ObjectId(id) };
    // If userId is provided, ensure the plant belongs to this user
    if (userId) {
      query.userId = userId;
    }
    const result = await plantsCollection.findOneAndUpdate(
      query,
      { $set: plantData },
      { returnDocument: 'after' }
    );
    if (!result.value) return null;
    return {
      ...result.value,
      id: result.value._id.toString(),
      _id: undefined
    };
  } catch (error) {
    console.error(`[updatePlant] Error for id ${id}:`, error);
    throw error;
  }
};

const deletePlant = async (id, userId = null) => {
  try {
    await connect();
    const query = { _id: new ObjectId(id) };
    // If userId is provided, ensure the plant belongs to this user
    if (userId) {
      query.userId = userId;
    }
    const result = await plantsCollection.findOneAndDelete(query);
    if (!result.value) return null;
    return {
      ...result.value,
      id: result.value._id.toString(),
      _id: undefined
    };
  } catch (error) {
    console.error(`[deletePlant] Error for id ${id}:`, error);
    throw error;
  }
};

module.exports = {
  getAllPlants,
  getPlantsByUserId,
  getPlantById,
  createPlant,
  updatePlant,
  deletePlant,
  closeConnection
}; 