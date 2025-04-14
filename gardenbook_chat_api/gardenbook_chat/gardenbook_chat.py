import asyncio
import os
import logging
import re
from datetime import datetime
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, AIMessage
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from langgraph.graph import END
from langchain_mcp_adapters.client import MultiServerMCPClient
import pytz

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Default MCP server path
DEFAULT_MCP_SERVER_PATH = "/app/gardenbook_chat/plants-mcp/garden_mcp.py"

@asynccontextmanager
async def make_graph(mcp_server_path=DEFAULT_MCP_SERVER_PATH, encyclopedia_data=None, user_timezone=None):
    """Creates a LangGraph agent with MCP tools loaded from the garden server
    
    Args:
        mcp_server_path: Path to the MCP server script
        encyclopedia_data: User's gardening encyclopedia data
        user_timezone: User's timezone as IANA timezone identifier (e.g., "America/New_York")
    """
    async with MultiServerMCPClient(
        {
            "garden": {
                "command": "python",
                "args": [mcp_server_path],
                "transport": "stdio",
            }
        }
    ) as client:
        # Get tools from the MCP server
        tools = client.get_tools()
        
        # Set default timezone and use user-provided timezone if available
        timezone = "UTC"
        if user_timezone:
            try:
                # Validate the timezone identifier by attempting to create a timezone object
                pytz.timezone(user_timezone)
                timezone = user_timezone
                logger.info(f"Using provided timezone: {timezone}")
            except pytz.exceptions.UnknownTimeZoneError:
                logger.warning(f"Unknown timezone: {user_timezone}, defaulting to UTC")
        
        # Get current date and time in the appropriate timezone
        try:
            current_datetime = datetime.now(pytz.timezone(timezone))
            datetime_str = current_datetime.strftime("%B %d, %Y at %I:%M %p %Z")
            location_info = f" in {timezone.replace('_', ' ')}" if timezone != "UTC" else ""
        except Exception as e:
            logger.warning(f"Error formatting datetime: {e}")
            current_datetime = datetime.now(pytz.UTC)
            datetime_str = current_datetime.strftime("%B %d, %Y at %I:%M %p UTC")
            location_info = ""
            
        # Build system prompt with encyclopedia data if available
        system_prompt = f"""You are Gardenbook's AI gardening assistant. You provide helpful advice about plants, gardening, and plant care.
You have access to a set of tools that can help answer questions about plants in the user's garden.
Current date and time{location_info} is {datetime_str}.
Always be friendly, helpful, and focus on gardening-related topics."""

        # Incorporate encyclopedia data if available
        if encyclopedia_data and encyclopedia_data.strip():
            logger.info("Including encyclopedia data in system prompt")
            system_prompt += f"""

USER'S GARDENING ENCYCLOPEDIA:
The following information describes the user's specific gardening context. Consider this information when providing advice:

{encyclopedia_data}

Always tailor your gardening advice to the user's specific context above."""
        else:
            logger.info("No encyclopedia data provided, using default system prompt")
        
        # Initialize LLM with Claude 3.7 and the system prompt
        llm = ChatAnthropic(
            model="claude-3-7-sonnet-latest",
            temperature=0,
            system=system_prompt
        )
        
        # Create the agent without passing system_prompt
        agent = create_react_agent(llm, tools)
        yield agent 