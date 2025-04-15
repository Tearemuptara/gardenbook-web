/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The MongoDB ObjectId of the user
 *         username:
 *           type: string
 *           description: The username of the user
 *         email:
 *           type: string
 *           description: The email address of the user
 *         password:
 *           type: string
 *           description: The hashed password of the user
 *         displayName:
 *           type: string
 *           description: The display name of the user
 *         isVerified:
 *           type: boolean
 *           description: Whether the user's email is verified
 *         verificationToken:
 *           type: string
 *           description: Token for email verification
 *         resetPasswordToken:
 *           type: string
 *           description: Token for password reset
 *         resetPasswordExpires:
 *           type: string
 *           format: date-time
 *           description: Expiration date for password reset token
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: The role of the user (user or admin)
 *         preferences:
 *           type: object
 *           properties:
 *             theme:
 *               type: string
 *               description: User's theme preference
 *             notifications:
 *               type: boolean
 *               description: User's notification settings
 *         encyclopedia:
 *           type: string
 *           description: User's encyclopedia data containing gardening context (deprecated)
 *         contextCards:
 *           type: array
 *           description: User's context cards containing gardening information
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The MongoDB ObjectId of the context card
 *               title:
 *                 type: string
 *                 description: The title of the context card
 *               content:
 *                 type: string
 *                 description: The content of the context card
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: The date when the context card was created
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *                 description: The date when the context card was last updated
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
const bcrypt = require('bcrypt');
require('dotenv').config();

// Email regex for validation
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
// Bcrypt salt rounds
const SALT_ROUNDS = 10;

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const client = new MongoClient(mongoUri);

// User roles enum
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

let db;
let usersCollection;
let isConnected = false;

// Validation functions
const validateEmail = (email) => {
  if (!email) throw new Error('Email is required');
  if (!EMAIL_REGEX.test(email)) throw new Error('Invalid email format');
  return true;
};

const validateUser = (userData) => {
  if (!userData.username) throw new Error('Username is required');
  
  // Validate email if provided
  if (userData.email) {
    validateEmail(userData.email);
  }
  
  // Validate role if provided
  if (userData.role && !Object.values(USER_ROLES).includes(userData.role)) {
    throw new Error(`Role must be one of: ${Object.values(USER_ROLES).join(', ')}`);
  }
  
  return true;
};

// Password hashing function
const hashPassword = async (password) => {
  if (!password) return null;
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Password verification function
const verifyPassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
};

// Process user data before creating or updating
const processUserData = async (userData) => {
  const processedData = { ...userData };
  
  // Hash password if provided
  if (processedData.password) {
    processedData.password = await hashPassword(processedData.password);
  }
  
  // Set default role if not provided
  if (!processedData.role) {
    processedData.role = USER_ROLES.USER;
  }
  
  // Set default preferences if not provided
  if (!processedData.preferences) {
    processedData.preferences = {
      theme: 'light',
      notifications: true
    };
  }
  
  return processedData;
};

// Connection functions
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
    
    // Validate user data
    validateUser(userData);
    
    // Process user data (hash password, set defaults)
    const processedData = await processUserData(userData);
    
    const timestamp = new Date();
    const userWithTimestamps = {
      ...processedData,
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
    
    // Process user data (hash password, set defaults)
    const processedData = await processUserData(userData);
    
    const updatedData = {
      ...processedData,
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

// User authentication functions
const authenticateUser = async (email, password) => {
  try {
    await connect();
    
    // Find user by email
    const user = await usersCollection.findOne({ email });
    if (!user) return null;
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) return null;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      id: user._id.toString(),
      _id: undefined
    };
  } catch (error) {
    console.error(`[authenticateUser] Error for email ${email}:`, error);
    throw error;
  }
};

// Token management for password reset
const generatePasswordResetToken = async (email) => {
  try {
    await connect();
    
    // Find user by email
    const user = await usersCollection.findOne({ email });
    if (!user) return null;
    
    // Generate token and expiration date (24 hours from now)
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Update user with token and expiration
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
          updatedAt: new Date()
        }
      }
    );
    
    return {
      resetToken,
      resetExpires
    };
  } catch (error) {
    console.error(`[generatePasswordResetToken] Error for email ${email}:`, error);
    throw error;
  }
};

// Reset password using token
const resetPassword = async (token, newPassword) => {
  try {
    await connect();
    
    // Find user by token and check if token is expired
    const user = await usersCollection.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) return false;
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user with new password and remove reset token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          updatedAt: new Date()
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error(`[resetPassword] Error:`, error);
    throw error;
  }
};

// Email verification functions
const generateVerificationToken = async (userId) => {
  try {
    await connect();
    
    // Generate token
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    
    // Update user with verification token
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          verificationToken,
          updatedAt: new Date()
        }
      }
    );
    
    return verificationToken;
  } catch (error) {
    console.error(`[generateVerificationToken] Error for user ${userId}:`, error);
    throw error;
  }
};

// Verify email using token
const verifyEmail = async (token) => {
  try {
    await connect();
    
    // Find user by verification token
    const user = await usersCollection.findOne({ verificationToken: token });
    if (!user) return false;
    
    // Update user to mark as verified and remove token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          verificationToken: null,
          updatedAt: new Date()
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error(`[verifyEmail] Error:`, error);
    throw error;
  }
};

const getEncyclopedia = async (id) => {
  try {
    await connect();
    console.log(`[getEncyclopedia] Looking for encyclopedia data for user ${id}`);
    const user = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { encyclopedia: 1, contextCards: 1 } }
    );
    if (!user) return null;
    
    // If user has context cards, format them into a single string
    if (user.contextCards && user.contextCards.length > 0) {
      const formattedContextCards = user.contextCards.map(card => 
        `--- ${card.title} ---\n${card.content}`
      ).join('\n\n');
      return formattedContextCards;
    }
    
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

// New functions for context cards
const getContextCards = async (id) => {
  try {
    await connect();
    console.log(`[getContextCards] Looking for context cards for user ${id}`);
    const user = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { contextCards: 1 } }
    );
    if (!user) return null;
    return user.contextCards || [];
  } catch (error) {
    console.error(`[getContextCards] Error for id ${id}:`, error);
    throw error;
  }
};

const createContextCard = async (id, cardData) => {
  try {
    await connect();
    console.log(`[createContextCard] Creating context card for user ${id}`);
    
    // First, check if the user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      console.log(`[createContextCard] User not found with id ${id}`);
      return null;
    }
    
    const timestamp = new Date();
    const newCard = {
      id: new ObjectId().toString(),
      title: cardData.title,
      content: cardData.content,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Add the new card to the contextCards array
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { contextCards: newCard },
        $set: { updatedAt: timestamp }
      }
    );
    
    console.log(`[createContextCard] Update result: ${JSON.stringify(updateResult)}`);
    
    if (updateResult.modifiedCount === 0) {
      console.log(`[createContextCard] No modifications made for user ${id}`);
      return null;
    }
    
    return newCard;
  } catch (error) {
    console.error(`[createContextCard] Error for id ${id}:`, error);
    throw error;
  }
};

const updateContextCard = async (userId, cardId, cardData) => {
  try {
    await connect();
    console.log(`[updateContextCard] Updating context card ${cardId} for user ${userId}`);
    
    const timestamp = new Date();
    
    // Update the specific card in the contextCards array
    const updateResult = await usersCollection.updateOne(
      { 
        _id: new ObjectId(userId),
        "contextCards.id": cardId 
      },
      {
        $set: {
          "contextCards.$.title": cardData.title,
          "contextCards.$.content": cardData.content,
          "contextCards.$.updatedAt": timestamp,
          updatedAt: timestamp
        }
      }
    );
    
    console.log(`[updateContextCard] Update result: ${JSON.stringify(updateResult)}`);
    
    if (updateResult.modifiedCount === 0) {
      console.log(`[updateContextCard] No modifications made for card ${cardId}`);
      return null;
    }
    
    // Get the updated card
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { contextCards: { $elemMatch: { id: cardId } } } }
    );
    
    if (!user || !user.contextCards || user.contextCards.length === 0) {
      return null;
    }
    
    return user.contextCards[0];
  } catch (error) {
    console.error(`[updateContextCard] Error for user ${userId}, card ${cardId}:`, error);
    throw error;
  }
};

const deleteContextCard = async (userId, cardId) => {
  try {
    await connect();
    console.log(`[deleteContextCard] Deleting context card ${cardId} for user ${userId}`);
    
    // Remove the specific card from the contextCards array
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $pull: { contextCards: { id: cardId } },
        $set: { updatedAt: new Date() }
      }
    );
    
    console.log(`[deleteContextCard] Update result: ${JSON.stringify(updateResult)}`);
    
    if (updateResult.modifiedCount === 0) {
      console.log(`[deleteContextCard] No modifications made for card ${cardId}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`[deleteContextCard] Error for user ${userId}, card ${cardId}:`, error);
    throw error;
  }
};

module.exports = {
  getUserById,
  createUser,
  updateUser,
  authenticateUser,
  generatePasswordResetToken,
  resetPassword,
  generateVerificationToken,
  verifyEmail,
  getEncyclopedia,
  updateEncyclopedia,
  getContextCards,
  createContextCard,
  updateContextCard,
  deleteContextCard,
  closeConnection,
  // Export validation functions for testing
  validateEmail,
  validateUser,
  verifyPassword
}; 