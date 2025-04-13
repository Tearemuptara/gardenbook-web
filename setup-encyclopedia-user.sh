#!/bin/bash

echo "Setting up default user for encyclopedia feature..."

# Create the scripts directory if it doesn't exist
mkdir -p gardenbook-db-api/src/scripts

# Check if the script file already exists
if [ ! -f gardenbook-db-api/src/scripts/create-default-user.js ]; then
  echo "Creating script file..."
else
  echo "Script file already exists."
fi

# Copy the create-default-user.js script to the container
echo "Executing script in container..."
docker-compose exec gardenbook-db-api node src/scripts/create-default-user.js

echo "Default user setup complete!"
echo "The frontend has been updated to use a valid MongoDB ObjectId (507f1f77bcf86cd799439011)"
echo "Please restart your application services to apply all changes." 