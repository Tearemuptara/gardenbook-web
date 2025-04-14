/**
 * Script to remove the contextCards field from the default user document
 * Run with: node src/scripts/remove-context-cards-field.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const DEFAULT_USER_ID = '507f1f77bcf86cd799439011';

async function removeContextCardsField() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('[MongoDB] Connected successfully');
    
    const db = client.db('gardenbook');
    const usersCollection = db.collection('users');
    
    // Remove the contextCards field from the default user
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(DEFAULT_USER_ID) },
      { $unset: { contextCards: "" } }
    );
    
    if (result.modifiedCount === 1) {
      console.log(`Successfully removed contextCards field from user ${DEFAULT_USER_ID}`);
    } else {
      console.log(`User ${DEFAULT_USER_ID} not found or field already removed`);
    }
  } catch (error) {
    console.error('Error removing contextCards field:', error);
  } finally {
    await client.close();
    console.log('[MongoDB] Connection closed');
  }
}

removeContextCardsField().catch(console.error); 