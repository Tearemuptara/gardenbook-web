const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const plantRoutes = require('./routes/plants');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cookieParser()); // Parse cookies

// Configure CORS for production
app.use((req, res, next) => {
  // Allow specific origins in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Allow credentials (cookies)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Garden Book API',
      version: '1.0.0',
      description: 'API for managing plants in the Garden Book application',
    },
    servers: [
      {
        url: 'http://137.184.176.143/api',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API Router
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Plant routes
apiRouter.use('/plants', plantRoutes);

// User routes
apiRouter.use('/users', userRoutes);

// Auth routes
apiRouter.use('/auth', authRoutes);

module.exports = app; 