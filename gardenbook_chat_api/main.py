import os
import sys
import requests
import traceback
from typing import List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add parent directory to path to import gardenbook_chat
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from gardenbook_chat.gardenbook_chat import make_graph

from langchain_core.messages import HumanMessage, AIMessage

# Chat models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    userId: str = None  # Optional userId parameter to fetch encyclopedia data

class ChatResponse(BaseModel):
    response: str

# Simple FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the Gardenbook Chat API"}

# Add health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "gardenbook-chat-api"}

@app.post("/chat", response_model=ChatResponse)
async def chat(chat_request: ChatRequest):
    try:
        # Convert Pydantic messages to LangChain messages
        langchain_messages = []
        for msg in chat_request.messages:
            if msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                langchain_messages.append(AIMessage(content=msg.content))
        
        # Fetch encyclopedia data if userId is provided
        encyclopedia_data = None
        if chat_request.userId:
            try:
                # In Docker environment, use service name; otherwise use localhost
                api_url = os.getenv("NODE_API_URL", "http://gardenbook-db-api:3001")
                response = requests.get(f"{api_url}/api/users/{chat_request.userId}/encyclopedia")
                
                if response.status_code == 200:
                    encyclopedia_data = response.json().get("encyclopedia", "")
                    print(f"Successfully fetched encyclopedia data for user {chat_request.userId}")
                else:
                    print(f"Failed to fetch encyclopedia data: {response.status_code}, {response.text}")
            except Exception as e:
                print(f"Error fetching encyclopedia data: {str(e)}")
                # Continue with the chat even if encyclopedia data can't be fetched
        
        try:
            # Use the make_graph context manager
            print("Creating agent with make_graph...")
            async with make_graph(encyclopedia_data=encyclopedia_data) as agent:
                # Invoke the agent with the messages
                print(f"Invoking agent with {len(langchain_messages)} messages...")
                response = await agent.ainvoke({"messages": langchain_messages})
                print("Agent invocation successful")
                assistant_response = response["messages"][-1].content
                
            return ChatResponse(response=assistant_response)
        except Exception as e:
            print(f"Error in agent processing: {str(e)}")
            print(traceback.format_exc())
            raise e
    
    except Exception as e:
        print(f"Uncaught error in chat endpoint: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 