const express = require('express');
const bodyParser = require('body-parser');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const plantRoutes = require('./routes/plants');
const userRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(bodyParser.json());

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

module.exports = app; 