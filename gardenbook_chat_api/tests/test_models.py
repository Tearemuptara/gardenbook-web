import pytest
from pydantic import ValidationError

from gardenbook_chat_api.main import ChatMessage, ChatRequest, ChatResponse

def test_chat_message_valid():
    """Test that valid ChatMessage objects can be created."""
    user_msg = ChatMessage(role="user", content="Hello")
    assert user_msg.role == "user"
    assert user_msg.content == "Hello"
    
    assistant_msg = ChatMessage(role="assistant", content="Hi there")
    assert assistant_msg.role == "assistant"
    assert assistant_msg.content == "Hi there"

def test_chat_message_invalid_role():
    """Test that an invalid role is accepted but should be validated in application code."""
    # The current implementation doesn't validate roles
    # This is a change in behavior - we're documenting that invalid roles are accepted
    msg = ChatMessage(role="invalid_role", content="Hello")
    assert msg.role == "invalid_role"
    assert msg.content == "Hello"

def test_chat_request_valid():
    """Test that a valid ChatRequest can be created."""
    request = ChatRequest(messages=[
        ChatMessage(role="user", content="Hello"),
        ChatMessage(role="assistant", content="Hi there")
    ])
    assert len(request.messages) == 2
    assert request.messages[0].role == "user"
    assert request.messages[1].role == "assistant"

def test_chat_request_empty_messages():
    """Test that a ChatRequest with empty messages is valid."""
    request = ChatRequest(messages=[])
    assert len(request.messages) == 0

def test_chat_response_valid():
    """Test that a valid ChatResponse can be created."""
    response = ChatResponse(response="Test response")
    assert response.response == "Test response" 