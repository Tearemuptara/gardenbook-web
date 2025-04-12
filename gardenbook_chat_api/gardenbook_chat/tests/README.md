# Gardenbook Chat Tests

Unit tests for the gardenbook_chat module.

## Running Tests

Make sure you have the required dependencies installed:

```bash
# Make sure your virtual environment is activated
source ../.venv/bin/activate

# Install dependencies
uv pip install -r ../requirements.txt
```

Run the tests using pytest:

```bash
pytest
```

Or for more verbose output:

```bash
pytest -v
```

## Test Structure

- `test_gardenbook_chat.py`: Tests for the main functionality in gardenbook_chat.py
  - Tests the `make_graph` function
  - Mocks external dependencies like MultiServerMCPClient and LLM
- `test_agent_behavior.py`: Tests for the agent's behavior
  - Tests tool usage
  - Tests conversation flow 