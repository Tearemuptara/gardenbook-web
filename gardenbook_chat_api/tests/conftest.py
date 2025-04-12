import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from gardenbook_chat_api.main import app, ChatMessage

@pytest.fixture
def test_client():
    """Return a TestClient instance for the FastAPI app."""
    return TestClient(app)

@pytest.fixture
def user_message():
    """Return a sample user message."""
    return ChatMessage(role="user", content="Test message")

@pytest.fixture
def assistant_message():
    """Return a sample assistant message."""
    return ChatMessage(role="assistant", content="Test response")

@pytest.fixture
def mock_make_graph():
    """Return a mocked version of the make_graph async context manager."""
    with patch("gardenbook_chat_api.main.make_graph") as mock:
        mock_agent = AsyncMock()
        mock_agent.ainvoke.return_value = {
            "messages": [
                {"role": "user", "content": "Test message"},
                {"role": "assistant", "content": "Test response"}
            ]
        }
        mock_cm = AsyncMock()
        mock_cm.__aenter__.return_value = mock_agent
        mock.return_value = mock_cm
        yield mock 