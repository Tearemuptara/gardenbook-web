import asyncio
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, AIMessage
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from langgraph.graph import END
from langchain_mcp_adapters.client import MultiServerMCPClient

# Load environment variables from .env file
load_dotenv()

# Default MCP server path
DEFAULT_MCP_SERVER_PATH = "/app/gardenbook_chat/plants-mcp/garden_mcp.py"

@asynccontextmanager
async def make_graph(mcp_server_path=DEFAULT_MCP_SERVER_PATH):
    """Creates a LangGraph agent with MCP tools loaded from the garden server"""
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
        
        # Initialize LLM with Claude 3.7
        llm = ChatAnthropic(
            model="claude-3-7-sonnet-latest",
            temperature=0
        )
        
        # Create the agent
        agent = create_react_agent(llm, tools)
        yield agent 