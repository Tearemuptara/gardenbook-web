const app = require('./app');
const port = process.env.PORT || 3001;
const plantModel = require('./models/plant');

const server = app.listen(port, () => {
  console.log(`Garden Book API running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  shutdown();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  shutdown();
});

function shutdown() {
  console.log('Closing HTTP server...');
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      // Close database connection
      await plantModel.closeConnection();
      console.log('Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
  
  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Forcing shutdown after timeout...');
    process.exit(1);
  }, 10000);
} 