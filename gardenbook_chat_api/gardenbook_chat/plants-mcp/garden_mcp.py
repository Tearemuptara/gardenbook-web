from typing import Any, List, Dict, Optional
import requests
from mcp.server.fastmcp import FastMCP
from mcp import types
from pymongo import MongoClient
import os
from bson.objectid import ObjectId
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# initialize FastMCP server
mcp = FastMCP("garden")

# MongoDB connection
mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(mongo_uri)
db = client.gardenbook
plants_collection = db.plants

@mcp.tool()
def get_plants() -> List[types.TextContent]:
    """
    Retrieve a list of all plants from the Garden Book database.
    
    Returns:
        List[types.TextContent]: A list of all plants formatted as MCP content
    """
    try:
        result = list(plants_collection.find())
        # Convert ObjectId to string for each plant
        for plant in result:
            plant["id"] = str(plant["_id"])
            del plant["_id"]
        
        return [
            types.TextContent(
                type="text",
                text=f"Plants in the garden:\n\n{result}"
            )
        ]
    except Exception as e:
        return [
            types.TextContent(
                type="text",
                text=f"Error retrieving plants: {str(e)}"
            )
        ]

@mcp.tool()
def get_plant_by_id(
    id: str
) -> List[types.TextContent]:
    """
    Retrieve a plant by its ID.
    
    Args:
        id (str): The ID of the plant to retrieve
        
    Returns:
        List[types.TextContent]: The plant information formatted as MCP content
        
    Raises:
        ValueError: If the plant is not found
    """
    try:
        plant = plants_collection.find_one({"_id": ObjectId(id)})
        if not plant:
            return [
                types.TextContent(
                    type="text",
                    text=f"Plant with ID {id} not found"
                )
            ]
        
        # Convert ObjectId to string
        plant["id"] = str(plant["_id"])
        del plant["_id"]
        
        return [
            types.TextContent(
                type="text",
                text=f"Plant details:\n\n{plant}"
            )
        ]
    except Exception as e:
        return [
            types.TextContent(
                type="text",
                text=f"Error retrieving plant: {str(e)}"
            )
        ]

@mcp.tool()
def create_plant(
    name: str,
    scientific_name: str,
    care_level: str,
    water_frequency: int
) -> List[types.TextContent]:
    """
    Create a new plant in the Garden Book database.
    
    Args:
        name (str): The name of the plant
        scientific_name (str): The scientific name of the plant
        care_level (str): The care level of the plant (EASY, MODERATE, DIFFICULT)
        water_frequency (int): How often the plant needs to be watered (in days)
        
    Returns:
        List[types.TextContent]: The created plant information formatted as MCP content
    """
    try:
        plant = {
            "name": name,
            "scientificName": scientific_name,
            "careLevel": care_level,
            "waterFrequency": water_frequency
        }
        result = plants_collection.insert_one(plant)
        
        # Get the inserted plant with its ID
        inserted_plant = plants_collection.find_one({"_id": result.inserted_id})
        inserted_plant["id"] = str(inserted_plant["_id"])
        del inserted_plant["_id"]
        
        return [
            types.TextContent(
                type="text",
                text=f"Plant created successfully:\n\n{inserted_plant}"
            )
        ]
    except Exception as e:
        return [
            types.TextContent(
                type="text",
                text=f"Error creating plant: {str(e)}"
            )
        ]

@mcp.tool()
def update_plant(
    id: str,
    name: str,
    scientific_name: str,
    care_level: str,
    water_frequency: int
) -> List[types.TextContent]:
    """
    Update an existing plant in the Garden Book database.
    
    Args:
        id (str): The ID of the plant to update
        name (str): The updated name of the plant
        scientific_name (str): The updated scientific name of the plant
        care_level (str): The updated care level of the plant (EASY, MODERATE, DIFFICULT)
        water_frequency (int): The updated watering frequency (in days)
        
    Returns:
        List[types.TextContent]: The updated plant information formatted as MCP content
        
    Raises:
        ValueError: If the plant is not found
    """
    try:
        updated_data = {
            "name": name,
            "scientificName": scientific_name,
            "careLevel": care_level,
            "waterFrequency": water_frequency
        }
        
        result = plants_collection.update_one(
            {"_id": ObjectId(id)}, 
            {"$set": updated_data}
        )
        
        if result.matched_count == 0:
            return [
                types.TextContent(
                    type="text",
                    text=f"Plant with ID {id} not found"
                )
            ]
        
        # Get the updated plant
        updated_plant = plants_collection.find_one({"_id": ObjectId(id)})
        updated_plant["id"] = str(updated_plant["_id"])
        del updated_plant["_id"]
        
        return [
            types.TextContent(
                type="text",
                text=f"Plant updated successfully:\n\n{updated_plant}"
            )
        ]
    except Exception as e:
        return [
            types.TextContent(
                type="text",
                text=f"Error updating plant: {str(e)}"
            )
        ]

@mcp.tool()
def delete_plant(
    id: str
) -> List[types.TextContent]:
    """
    Delete a plant from the Garden Book database.
    
    Args:
        id (str): The ID of the plant to delete
        
    Returns:
        List[types.TextContent]: Confirmation message formatted as MCP content
        
    Raises:
        ValueError: If the plant is not found
    """
    try:
        # First get the plant to return its details after deletion
        plant = plants_collection.find_one({"_id": ObjectId(id)})
        if not plant:
            return [
                types.TextContent(
                    type="text",
                    text=f"Plant with ID {id} not found"
                )
            ]
        
        # Convert ObjectId to string for response
        plant["id"] = str(plant["_id"])
        del plant["_id"]
        
        # Delete the plant
        plants_collection.delete_one({"_id": ObjectId(id)})
        
        return [
            types.TextContent(
                type="text",
                text=f"Plant deleted successfully:\n\n{plant}"
            )
        ]
    except Exception as e:
        return [
            types.TextContent(
                type="text",
                text=f"Error deleting plant: {str(e)}"
            )
        ]

if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='stdio') 