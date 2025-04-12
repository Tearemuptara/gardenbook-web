# Gardenbook

## Architecture:

docker-compose.yml launches three services: 1. gardenbook-ui - Frontend user interface 2. gardenbook-db-api - Main backend API for database operations 3. gardenbook-chat-api - Chat API with integrated plant management capabilities

```
┌───────────────┐     ┌───────────────┐
│ gardenbook-ui │─────► gardenbook-db-api
│ (Frontend)    │     └───────┬───────┘
└───────────────┘             │
                              ▼
                     ┌───────────────┐
                     │ gardenbook-chat-api
                     └───────┬───────┘
                             │
                             ▼
                    ┌───────────────┐     ┌───────────────┐
                    │ gardenbook_chat├─────► plants-mcp   │
                    │ (LangGraph)   │     │ (MCP Server)  │
                    └───────────────┘     └───────────────┘
```

## Getting Started

To run the application:

```bash
docker-compose up
```

The frontend will be available at http://localhost:3000

## Structure

- `gardenbook-ui`: Next.js frontend application
- `gardenbook-db-api`: Node.js API for database operations
  - CRUD operations for plants
  - Swagger API documentation
  - MongoDB integration
- `gardenbook_chat_api`: Python API for chat functionality, which includes:
  - `gardenbook_chat`: LangGraph agent-based chat interface powered by Claude 3.7 Sonnet
  - `plants-mcp`: Plant management MCP server providing data access

## Development Environment

### For Python components:

```bash
cd component_directory
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### For Node.js components:

```bash
cd component_directory
npm install
```

## Requirements

- Python 3.11+ for the Python components
- Node.js 14+ for the gardenbook-db-api
- MongoDB (local or remote)
- Anthropic API key for the chat components

## Testing

To verify that all components of the system are running correctly, use the provided test script:

### On Windows:

```bash
run_test.bat
```

### On Linux/macOS:

```bash
chmod +x run_test.sh
./run_test.sh
```

The test script will:

1. Check if all Docker containers are running
2. Test connectivity to each service
3. Verify that the frontend, database API, and chat API are responding correctly

### Requirements for Running Tests

- Python 3.6 or higher
- The `requests` Python package (automatically installed by the test scripts)
