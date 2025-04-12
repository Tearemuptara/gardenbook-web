#!/usr/bin/env python
"""
Run script for the Gardenbook Chat API.
"""
import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration from environment
port = int(os.getenv("PORT", 8000))
host = os.getenv("HOST", "0.0.0.0")

if __name__ == "__main__":
    print(f"Starting Gardenbook Chat API on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True) 