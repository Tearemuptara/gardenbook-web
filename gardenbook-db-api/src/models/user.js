/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *       properties:
 *         id:
 *           type: string
 *           description: The MongoDB ObjectId of the user
 *         username:
 *           type: string
 *           description: The username of the user
 *         encyclopedia:
 *           type: string
 *           description: User's encyclopedia data containing gardening context
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the user was last updated
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const client = new MongoClient(mongoUri);

let db;
let usersCollection;
let isConnected = false;

const connect = async () => {
  if (!isConnected) {
    await client.connect();
    db = client.db('gardenbook');
    usersCollection = db.collection('users');
    isConnected = true;
    console.log('[MongoDB] Connected successfully');
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
    usersCollection = undefined;
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

const getUserById = async (id) => {
  try {
    await connect();
    console.log(`[getUserById] Looking for user with id ${id}`);
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) return null;
    return {
      ...user,
      id: user._id.toString(),
      _id: undefined
    };
  } catch (error) {
    console.error(`[getUserById] Error for id ${id}:`, error);
    throw error;
  }
};

const createUser = async (userData) => {
  try {
    await connect();
    const timestamp = new Date();
    const userWithTimestamps = {
      ...userData,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const result = await usersCollection.insertOne(userWithTimestamps);
    console.log(`[createUser] Created user with id ${result.insertedId}`);
    return {
      ...userWithTimestamps,
      id: result.insertedId.toString()
    };
  } catch (error) {
    console.error('[createUser] Error:', error);
    throw error;
  }
};

const updateUser = async (id, userData) => {
  try {
    await connect();
    const updatedData = {
      ...userData,
      updatedAt: new Date()
    };
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnDocument: 'after' }
    );
    if (!result.value) return null;
    return {
      ...result.value,
      id: result.value._id.toString(),
      _id: undefined
    };
  } catch (error) {
    console.error(`[updateUser] Error for id ${id}:`, error);
    throw error;
  }
};

const getEncyclopedia = async (id) => {
  try {
    await connect();
    console.log(`[getEncyclopedia] Looking for encyclopedia data for user ${id}`);
    const user = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { encyclopedia: 1 } }
    );
    if (!user) return null;
    return user.encyclopedia || '';
  } catch (error) {
    console.error(`[getEncyclopedia] Error for id ${id}:`, error);
    throw error;
  }
};

const updateEncyclopedia = async (id, encyclopediaData) => {
  try {
    await connect();
    console.log(`[updateEncyclopedia] Updating encyclopedia for user ${id}`);
    
    // First, check if the user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      console.log(`[updateEncyclopedia] User not found with id ${id}`);
      return null;
    }
    
    // Update the encyclopedia field
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          encyclopedia: encyclopediaData,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`[updateEncyclopedia] Update result: ${JSON.stringify(updateResult)}`);
    
    if (updateResult.modifiedCount === 0) {
      console.log(`[updateEncyclopedia] No modifications made for user ${id}`);
    }
    
    // Fetch the updated document
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { encyclopedia: 1 } }
    );
    
    return updatedUser.encyclopedia;
  } catch (error) {
    console.error(`[updateEncyclopedia] Error for id ${id}:`, error);
    throw error;
  }
};

module.exports = {
  getUserById,
  createUser,
  updateUser,
  getEncyclopedia,
  updateEncyclopedia,
  closeConnection
}; 