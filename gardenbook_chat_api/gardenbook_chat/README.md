# Gardenbook Chat

A LangGraph agent-based chat interface for the Garden Book application, powered by Claude 3.7 Sonnet.

## Features

- Interfaces with plants-mcp server via MultiServerMCPClient
- Creates a LangGraph REACT agent with Claude 3.7 Sonnet
- Provides conversational access to plant management features
- Dynamically loads tools from the MCP server

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

## Usage

The primary function is `make_graph` which creates a LangGraph agent with the appropriate tools:

```python
from gardenbook_chat import make_graph

async with make_graph() as agent:
    # Example usage with the agent
    response = await agent.ainvoke({
        "messages": [
            {"role": "user", "content": "What plants are in my garden?"}
        ]
    })
    print(response)
```

By default, the agent connects to the MCP server at `../plants-mcp/garden_mcp.py`. You can specify a different path:

```python
async with make_graph(mcp_server_path="/path/to/garden_mcp.py") as agent:
    # Use the agent
```

## Testing

To run tests:

```bash
# Make sure your virtual environment is activated
source .venv/bin/activate

# Run tests using the provided script
./run_tests.sh

# Or run pytest directly
python -m pytest tests
```

See the tests/README.md for more details on the test suite. 