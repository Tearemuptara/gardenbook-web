import os
import sys
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
        
        # Use the make_graph context manager
        async with make_graph() as agent:
            # Invoke the agent with the messages
            response = await agent.ainvoke({"messages": langchain_messages})
            assistant_response = response["messages"][-1].content
            
        return ChatResponse(response=assistant_response)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 