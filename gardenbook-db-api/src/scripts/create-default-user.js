/**
 * Script to create a default user with a specific ObjectId
 * Run with: node src/scripts/create-default-user.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const DEFAULT_USER_ID = '507f1f77bcf86cd799439011';

async function createDefaultUser() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('[MongoDB] Connected successfully');
    
    const db = client.db('gardenbook');
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(DEFAULT_USER_ID) });
    
    if (existingUser) {
      console.log(`User with ID ${DEFAULT_USER_ID} already exists.`);
      return;
    }
    
    // Create user with specific ID
    const timestamp = new Date();
    const result = await usersCollection.insertOne({
      _id: new ObjectId(DEFAULT_USER_ID),
      username: 'default_user',
      createdAt: timestamp,
      updatedAt: timestamp,
      encyclopedia: ''
    });
    
    console.log(`Created default user with ID ${result.insertedId}`);
  } catch (error) {
    console.error('Error creating default user:', error);
  } finally {
    await client.close();
    console.log('[MongoDB] Connection closed');
  }
}

createDefaultUser().catch(console.error); 