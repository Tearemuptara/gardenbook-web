# Garden Book API

A REST API for managing plants in the Garden Book application.

## Features

- CRUD operations for plants
- Swagger API documentation
- MongoDB database integration
- Comprehensive test suite

## Getting Started

### Prerequisites

- Node.js >= 14
- npm >= 6
- MongoDB (local or remote)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd gardenbook-api
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```
MONGO_URI=mongodb://localhost:27017
```

### Running the application

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## Testing

The project includes a comprehensive test suite for all components.

### Running tests

Run all tests:

```bash
npm test
```

Run tests with watch mode (for development):

```bash
npm run test:watch
```

Generate test coverage report:

```bash
npm run test:coverage
```

Run tests in CI environment:

```bash
npm run test:ci
```

### Test Structure

The test suite is organized to test different parts of the application:

- `app.test.js` - Tests for the Express application setup
- `db.test.js` - Tests for database connection handling
- `plant.model.test.js` - Unit tests for the plant model
- `plants.test.js` - Integration tests for the plants API endpoints

## API Documentation

API documentation is available at `/api-docs` when the server is running.

## Project Structure

```
gardenbook-api/
├── src/
│   ├── models/       - Data models
│   ├── routes/       - API routes
│   ├── app.js        - Express application setup
│   └── index.js      - Application entry point
├── tests/            - API tests
├── package.json      - Dependencies and scripts
├── .env              - Environment variables
└── README.md         - Project documentation
```

## Future Improvements

- Add authentication and authorization
- Add validation middleware
- Add more comprehensive error handling
- Implement logging middleware 