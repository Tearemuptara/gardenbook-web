# Gardenbook Chat API

A FastAPI server that provides REST API access to the gardenbook_chat functionality.

## Overview

This service acts as a REST API wrapper around the gardenbook_chat module, allowing clients to interact with the LangGraph agent via HTTP requests. It serves as the bridge between client applications and the underlying chat functionality powered by Claude 3.7 Sonnet.

## Features

- REST API for the gardenbook_chat functionality
- FastAPI-based server with automatic OpenAPI documentation
- Handles chat requests and forwards them to the LangGraph agent
- Configurable MCP server path

## Setup

1. Create and activate a virtual environment:
```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
uv pip install -r requirements.txt
```

3. Set up environment variables:
   Create a `.env` file with your API keys:
```
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Start the server:
```bash
python run.py
```

or

```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000 with documentation at http://localhost:8000/docs

## API Endpoints

- `GET /` - Health check endpoint
- `POST /chat` - Chat endpoint that processes a single request

## Example Usage

### Chat:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "What plants are in the database?"}], "userId": "507f1f77bcf86cd799439011"}'
```

The `userId` parameter is optional. When provided, the API will fetch the user's encyclopedia data from the database API and include it in the chat context. This allows the chat assistant to provide personalized responses based on the user's gardening context.

## Project Structure

```
gardenbook_chat_api/
├── main.py          - FastAPI application and routes
├── models.py        - Pydantic data models
├── run.py           - Application entry point
├── tests/           - API tests
├── requirements.txt - Dependencies
└── README.md        - Project documentation
```

## Relationship to Other Components

This service depends on the following components:
- `gardenbook_chat`: Provides the core chat functionality with the LangGraph agent
- `plants-mcp`: The MCP server that provides plant management tools

Flow:
1. Client sends request to this API
2. API uses gardenbook_chat to create a LangGraph agent
3. Agent connects to plants-mcp for garden management tools
4. Response is returned to the client

## Testing

See the tests/README.md for information on running tests for this component. 
``` 