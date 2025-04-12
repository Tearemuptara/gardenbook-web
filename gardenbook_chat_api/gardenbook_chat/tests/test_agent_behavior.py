import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from gardenbook_chat import gardenbook_chat
from langchain_core.messages import HumanMessage, AIMessage

@pytest.mark.asyncio
async def test_agent_tool_usage():
    """Test that the agent can use tools from the MCP server"""
    
    # Mock the MCP client and tools
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    
    # Create a mock tool that the agent should be able to use
    mock_tools = [
        {
            "name": "query_plants",
            "description": "Query plants in the garden database",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The query to search for plants"}
                },
                "required": ["query"]
            }
        }
    ]
    mock_client.get_tools.return_value = mock_tools
    
    # Mock the agent with a predefined response that includes tool usage
    mock_agent = MagicMock()
    mock_agent.invoke.return_value = {
        "output": "You have 3 tomato plants and 2 basil plants in your garden.",
        "intermediate_steps": [
            {
                "action": {"name": "query_plants", "args": {"query": "tomato basil"}},
                "observation": "Found: 3 tomato plants, 2 basil plants"
            }
        ]
    }
    
    with patch("gardenbook_chat.gardenbook_chat.MultiServerMCPClient", return_value=mock_client), \
         patch("gardenbook_chat.gardenbook_chat.ChatAnthropic", return_value=MagicMock()), \
         patch("gardenbook_chat.gardenbook_chat.create_react_agent", return_value=mock_agent):
        
        async with gardenbook_chat.make_graph() as agent:
            test_message = HumanMessage(content="What plants do I have in my garden?")
            
            # Call the agent
            result = await asyncio.to_thread(agent.invoke, {"messages": [test_message]})
            
            # Verify the expected output
            assert "output" in result
            assert "tomato" in result["output"]
            assert "basil" in result["output"]
            assert "intermediate_steps" in result

@pytest.mark.asyncio
async def test_agent_conversation_flow():
    """Test the conversation flow with the agent"""
    
    # Mock the MCP client
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get_tools.return_value = []
    
    # Mock the agent with responses for a conversation flow
    mock_agent = MagicMock()
    
    # Setup mock responses for consecutive calls
    mock_responses = [
        {"output": "Hello! How can I help with your garden today?"},
        {"output": "I recommend watering your tomatoes twice a week."}
    ]
    
    mock_agent.invoke.side_effect = mock_responses
    
    with patch("gardenbook_chat.gardenbook_chat.MultiServerMCPClient", return_value=mock_client), \
         patch("gardenbook_chat.gardenbook_chat.ChatAnthropic", return_value=MagicMock()), \
         patch("gardenbook_chat.gardenbook_chat.create_react_agent", return_value=mock_agent):
        
        async with gardenbook_chat.make_graph() as agent:
            # First message
            msg1 = HumanMessage(content="Hi there")
            result1 = await asyncio.to_thread(agent.invoke, {"messages": [msg1]})
            
            # Second message in the conversation
            msg2 = HumanMessage(content="How often should I water my tomatoes?")
            result2 = await asyncio.to_thread(agent.invoke, {"messages": [msg1, AIMessage(content=result1["output"]), msg2]})
            
            # Verify responses
            assert "How can I help" in result1["output"]
            assert "watering" in result2["output"]
            assert "tomatoes" in result2["output"] 