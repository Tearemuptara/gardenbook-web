#!/bin/bash

# This script tests the User API endpoints for the Gardenbook DB API

echo "Creating test user..."
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test2@example.com",
    "password": "password123",
    "displayName": "Test User 2"
  }'
echo -e "\n\nUser created successfully!" 