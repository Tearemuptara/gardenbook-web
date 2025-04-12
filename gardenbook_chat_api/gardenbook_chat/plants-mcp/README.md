# Garden MCP Server

A FastMCP server that provides plant management functionality for Garden Book.

## Features

- Get all plants
- Get a plant by ID
- Create a new plant
- Update an existing plant
- Delete a plant

## Development Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   python -m uv pip install -e ".[test]"
   ```

3. Start the MCP server:
   ```bash
   python -m mcp run garden_mcp
   ```

## Environment Variables

Create a `.env` file with the following variables:

```
MONGO_URI=mongodb://localhost:27017
```

## Running Tests

The project includes comprehensive unit tests for all MCP tool functions. The tests use mocks for MongoDB interactions.

To run tests:

```bash
# Make sure your virtual environment is activated
source .venv/bin/activate

# Run the test script
./run_tests.sh

# Run with coverage report
./run_tests.sh --coverage
```

## Test Structure

- `tests/test_garden_mcp.py`: Tests for all MCP tool functions
  - Success cases for all operations
  - Error handling for all operations
  - Edge cases (not found, exceptions, etc.)
