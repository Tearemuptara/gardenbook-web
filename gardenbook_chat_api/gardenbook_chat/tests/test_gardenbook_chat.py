import pytest
import asyncio
import pytz
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from gardenbook_chat import gardenbook_chat
from langchain_core.messages import HumanMessage

# Test the make_graph context manager
@pytest.mark.asyncio
async def test_make_graph():
    """Test that make_graph initializes and returns an agent"""
    
    # Mock the MultiServerMCPClient
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get_tools.return_value = [
        {
            "name": "test_tool",
            "description": "A test tool",
            "parameters": {}
        }
    ]
    
    # Mock the ChatAnthropic class
    mock_llm = MagicMock()
    
    # Mock the create_react_agent function
    mock_agent = MagicMock()
    
    with patch("gardenbook_chat.gardenbook_chat.MultiServerMCPClient", return_value=mock_client), \
         patch("gardenbook_chat.gardenbook_chat.ChatAnthropic", return_value=mock_llm), \
         patch("gardenbook_chat.gardenbook_chat.create_react_agent", return_value=mock_agent):
        
        async with gardenbook_chat.make_graph() as agent:
            # Verify that the agent was created with expected values
            assert agent == mock_agent
            mock_client.get_tools.assert_called_once()
            
            # Test that the agent can be called
            test_message = HumanMessage(content="Hello")
            agent.invoke.return_value = {"output": "Test response"}
            
            # Mocking the agent invoke method for the test
            result = await asyncio.to_thread(agent.invoke, {"messages": [test_message]})
            assert "output" in result

# Test error handling
@pytest.mark.asyncio
async def test_make_graph_handles_errors():
    """Test that make_graph correctly handles errors from MCP client or agent creation"""
    
    # Mock the MultiServerMCPClient to raise an exception
    mock_client = AsyncMock()
    mock_client.__aenter__.side_effect = Exception("Test exception")
    
    with patch("gardenbook_chat.gardenbook_chat.MultiServerMCPClient", return_value=mock_client):
        with pytest.raises(Exception):
            async with gardenbook_chat.make_graph() as agent:
                pass  # This should not execute 

@pytest.mark.asyncio
async def test_make_graph_includes_current_date():
    """Test that make_graph includes the current date and time in the system prompt"""
    
    # Mock current date
    mock_date = datetime(2023, 4, 15, 14, 30, 0, tzinfo=pytz.UTC)
    mock_datetime_str = "April 15, 2023 at 02:30 PM UTC"
    
    # Mock the MultiServerMCPClient
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get_tools.return_value = []
    
    # Mock the ChatAnthropic class to capture system prompt
    mock_llm = MagicMock()
    
    # Create a mock for create_react_agent
    mock_agent = MagicMock()
    
    with patch("gardenbook_chat.gardenbook_chat.MultiServerMCPClient", return_value=mock_client), \
         patch("gardenbook_chat.gardenbook_chat.ChatAnthropic", return_value=mock_llm) as mock_anthropic, \
         patch("gardenbook_chat.gardenbook_chat.create_react_agent", return_value=mock_agent), \
         patch("gardenbook_chat.gardenbook_chat.datetime") as mock_datetime:
        
        # Configure mocked datetime.now() to return our fixed date
        mock_datetime.now.return_value = mock_date
        mock_datetime.strftime = datetime.strftime
        
        async with gardenbook_chat.make_graph() as agent:
            # Verify the date was included in the system prompt
            # Get the kwargs from the ChatAnthropic instantiation
            call_kwargs = mock_anthropic.call_args.kwargs
            assert "system" in call_kwargs
            assert f"Current date and time is {mock_datetime_str}" in call_kwargs["system"]

@pytest.mark.asyncio
async def test_make_graph_with_timezone():
    """Test that make_graph correctly uses the provided timezone identifier"""
    
    # Mock current date with timezone
    mock_date = datetime(2023, 4, 15, 14, 30, 0, tzinfo=pytz.timezone("America/New_York"))
    # The exact timezone abbreviation can vary (EDT, EST, LMT), so we'll check partial match
    datetime_partial = "April 15, 2023 at 02:30 PM"
    
    # Mock encyclopedia data
    encyclopedia_data = """
    Name: John's Garden
    Climate: Temperate
    Soil Type: Loamy
    """
    
    # User timezone as IANA identifier
    user_timezone = "America/New_York"
    
    # Mock the MultiServerMCPClient
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get_tools.return_value = []
    
    # Mock the ChatAnthropic class to capture system prompt
    mock_llm = MagicMock()
    
    # Create a mock for create_react_agent
    mock_agent = MagicMock()
    
    with patch("gardenbook_chat.gardenbook_chat.MultiServerMCPClient", return_value=mock_client), \
         patch("gardenbook_chat.gardenbook_chat.ChatAnthropic", return_value=mock_llm) as mock_anthropic, \
         patch("gardenbook_chat.gardenbook_chat.create_react_agent", return_value=mock_agent), \
         patch("gardenbook_chat.gardenbook_chat.datetime") as mock_datetime, \
         patch("gardenbook_chat.gardenbook_chat.pytz") as mock_pytz:
        
        # Set up mock for timezone handling
        mock_pytz.timezone.return_value = pytz.timezone("America/New_York")
        mock_pytz.all_timezones = ["America/New_York"]
        mock_pytz.UTC = pytz.UTC
        
        # Configure mocked datetime.now() to return our fixed date
        mock_datetime.now.return_value = mock_date
        mock_datetime.strftime = datetime.strftime
        
        async with gardenbook_chat.make_graph(encyclopedia_data=encyclopedia_data, user_timezone=user_timezone) as agent:
            # Verify the timezone-aware date was included in the system prompt
            call_kwargs = mock_anthropic.call_args.kwargs
            assert "system" in call_kwargs
            system_prompt = call_kwargs["system"]
            assert "in America/New York" in system_prompt
            assert datetime_partial in system_prompt
            assert encyclopedia_data in system_prompt

@pytest.mark.asyncio
async def test_make_graph_with_invalid_timezone():
    """Test that make_graph handles invalid timezone identifiers gracefully"""
    
    # Mock current date
    mock_date = datetime(2023, 4, 15, 14, 30, 0, tzinfo=pytz.UTC)
    
    # Invalid timezone
    invalid_timezone = "NonExistent/Timezone"
    
    # Mock the MultiServerMCPClient
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.get_tools.return_value = []
    
    # Mock the ChatAnthropic class
    mock_llm = MagicMock()
    
    # Create a mock for create_react_agent
    mock_agent = MagicMock()
    
    with patch("gardenbook_chat.gardenbook_chat.MultiServerMCPClient", return_value=mock_client), \
         patch("gardenbook_chat.gardenbook_chat.ChatAnthropic", return_value=mock_llm) as mock_anthropic, \
         patch("gardenbook_chat.gardenbook_chat.create_react_agent", return_value=mock_agent), \
         patch("gardenbook_chat.gardenbook_chat.datetime") as mock_datetime, \
         patch("gardenbook_chat.gardenbook_chat.pytz") as mock_pytz:
        
        # Set up mock for timezone handling
        def mock_timezone_side_effect(tz_name):
            if tz_name == "UTC":
                return pytz.UTC
            raise pytz.exceptions.UnknownTimeZoneError(tz_name)
        
        mock_pytz.timezone.side_effect = mock_timezone_side_effect
        mock_pytz.exceptions.UnknownTimeZoneError = pytz.exceptions.UnknownTimeZoneError
        mock_pytz.UTC = pytz.UTC
        
        # Configure mocked datetime.now() to return our fixed date
        mock_datetime.now.return_value = mock_date
        mock_datetime.strftime = datetime.strftime
        
        async with gardenbook_chat.make_graph(user_timezone=invalid_timezone) as agent:
            # Verify we defaulted to UTC
            call_kwargs = mock_anthropic.call_args.kwargs
            assert "system" in call_kwargs
            system_prompt = call_kwargs["system"]
            assert "UTC" in system_prompt 