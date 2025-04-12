import unittest
from unittest.mock import patch, MagicMock
import sys
import os
from bson.objectid import ObjectId

# Add the parent directory to the Python path to import garden_mcp
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import after modifying the path
import garden_mcp
from mcp import types

class TestGardenMCP(unittest.TestCase):
    def setUp(self):
        # Create a mock for the plants collection
        self.mock_plants_collection = MagicMock()
        
        # Save the original plants_collection
        self.original_plants_collection = garden_mcp.plants_collection
        
        # Replace with our mock
        garden_mcp.plants_collection = self.mock_plants_collection

    def tearDown(self):
        # Restore the original plants_collection
        garden_mcp.plants_collection = self.original_plants_collection

    def test_get_plants_success(self):
        # Mock data to be returned by find()
        mock_plants = [
            {"_id": ObjectId("60d5ec7a1c9d4410d43a1234"), "name": "Snake Plant", "scientificName": "Sansevieria", "careLevel": "EASY", "waterFrequency": 14},
            {"_id": ObjectId("60d5ec7a1c9d4410d43a5678"), "name": "Monstera", "scientificName": "Monstera deliciosa", "careLevel": "MODERATE", "waterFrequency": 7}
        ]
        
        # Configure the mock to return our mock data
        self.mock_plants_collection.find.return_value = mock_plants
        
        # Call the function
        result = garden_mcp.get_plants()
        
        # Assert the function was called
        self.mock_plants_collection.find.assert_called_once()
        
        # Assert the result is of the correct type
        self.assertIsInstance(result, list)
        self.assertIsInstance(result[0], types.TextContent)
        
        # Assert the text contains expected information
        self.assertIn("Plants in the garden", result[0].text)
        self.assertIn("Snake Plant", result[0].text)
        self.assertIn("Monstera", result[0].text)

    def test_get_plants_exception(self):
        # Configure the mock to raise an exception
        self.mock_plants_collection.find.side_effect = Exception("Database error")
        
        # Call the function
        result = garden_mcp.get_plants()
        
        # Assert the result is of the correct type
        self.assertIsInstance(result, list)
        self.assertIsInstance(result[0], types.TextContent)
        
        # Assert the text contains error information
        self.assertIn("Error retrieving plants", result[0].text)
        self.assertIn("Database error", result[0].text)

    def test_get_plant_by_id_success(self):
        # Mock data to be returned by find_one()
        mock_plant = {"_id": ObjectId("60d5ec7a1c9d4410d43a1234"), "name": "Snake Plant", "scientificName": "Sansevieria", "careLevel": "EASY", "waterFrequency": 14}
        
        # Configure the mock to return our mock data
        self.mock_plants_collection.find_one.return_value = mock_plant
        
        # Call the function
        result = garden_mcp.get_plant_by_id("60d5ec7a1c9d4410d43a1234")
        
        # Assert the function was called with the correct parameters
        self.mock_plants_collection.find_one.assert_called_once()
        
        # Assert the result is of the correct type
        self.assertIsInstance(result, list)
        self.assertIsInstance(result[0], types.TextContent)
        
        # Assert the text contains expected information
        self.assertIn("Plant details", result[0].text)
        self.assertIn("Snake Plant", result[0].text)

    def test_get_plant_by_id_not_found(self):
        # Configure the mock to return None (plant not found)
        self.mock_plants_collection.find_one.return_value = None
        
        # Call the function
        result = garden_mcp.get_plant_by_id("60d5ec7a1c9d4410d43a1234")
        
        # Assert the result is of the correct type
        self.assertIsInstance(result, list)
        self.assertIsInstance(result[0], types.TextContent)
        
        # Assert the text contains error information
        self.assertIn("not found", result[0].text)

    def test_create_plant_success(self):
        # Mock an ObjectId that will be returned on insert
        mock_id = ObjectId("60d5ec7a1c9d4410d43a1234")
        
        # Configure insert_one to return a mock with inserted_id
        mock_insert_result = MagicMock()
        mock_insert_result.inserted_id = mock_id
        self.mock_plants_collection.insert_one.return_value = mock_insert_result
        
        # Configure find_one to return the newly created plant with the ID
        self.mock_plants_collection.find_one.return_value = {
            "_id": mock_id,
            "name": "Snake Plant",
            "scientificName": "Sansevieria",
            "careLevel": "EASY",
            "waterFrequency": 14
        }
        
        # Call the function
        result = garden_mcp.create_plant(
            name="Snake Plant",
            scientific_name="Sansevieria",
            care_level="EASY",
            water_frequency=14
        )
        
        # Assert insert_one was called with the correct data
        self.mock_plants_collection.insert_one.assert_called_once()
        
        # Assert the result is of the correct type
        self.assertIsInstance(result, list)
        self.assertIsInstance(result[0], types.TextContent)
        
        # Assert the text contains expected information
        self.assertIn("Plant created successfully", result[0].text)
        self.assertIn("Snake Plant", result[0].text)

    def test_update_plant_success(self):
        # Configure update_one to return a successful result
        mock_update_result = MagicMock()
        mock_update_result.matched_count = 1
        self.mock_plants_collection.update_one.return_value = mock_update_result
        
        # Configure find_one to return the updated plant
        self.mock_plants_collection.find_one.return_value = {
            "_id": ObjectId("60d5ec7a1c9d4410d43a1234"),
            "name": "Updated Snake Plant",
            "scientificName": "Sansevieria Updated",
            "careLevel": "MODERATE",
            "waterFrequency": 10
        }
        
        # Call the function
        result = garden_mcp.update_plant(
            id="60d5ec7a1c9d4410d43a1234",
            name="Updated Snake Plant",
            scientific_name="Sansevieria Updated",
            care_level="MODERATE",
            water_frequency=10
        )
        
        # Assert update_one was called with the correct parameters
        self.mock_plants_collection.update_one.assert_called_once()
        
        # Assert the result is of the correct type
        self.assertIsInstance(result, list)
        self.assertIsInstance(result[0], types.TextContent)
        
        # Assert the text contains expected information
        self.assertIn("Plant updated successfully", result[0].text)
        self.assertIn("Updated Snake Plant", result[0].text)

    def test_update_plant_not_found(self):
        # Configure update_one to return no matches
        mock_update_result = MagicMock()
        mock_update_result.matched_count = 0
        self.mock_plants_collection.update_one.return_value = mock_update_result
        
        # Call the function
        result = garden_mcp.update_plant(
            id="60d5ec7a1c9d4410d43a1234",
            name="Updated Snake Plant",
            scientific_name="Sansevieria Updated",
            care_level="MODERATE",
            water_frequency=10
        )
        
        # Assert the result is of the correct type
        self.assertIsInstance(result, list)
        self.assertIsInstance(result[0], types.TextContent)
        
        # Assert the text contains error information
        self.assertIn("not found", result[0].text)

    def test_delete_plant_success(self):
        # Configure find_one to return the plant to be deleted
        self.mock_plants_collection.find_one.return_value = {
            "_id": ObjectId("60d5ec7a1c9d4410d43a1234"),
            "name": "Snake Plant",
            "scientificName": "Sansevieria",
            "careLevel": "EASY",
            "waterFrequency": 14
        }
        
        # Call the function
        result = garden_mcp.delete_plant(id="60d5ec7a1c9d4410d43a1234")
        
        # Assert delete_one was called with the correct parameters
        self.mock_plants_collection.delete_one.assert_called_once()
        
        # Assert the result is of the correct type
        self.assertIsInstance(result, list)
        self.assertIsInstance(result[0], types.TextContent)
        
        # Assert the text contains expected information
        self.assertIn("Plant deleted successfully", result[0].text)
        self.assertIn("Snake Plant", result[0].text)

    def test_delete_plant_not_found(self):
        # Configure find_one to return None (plant not found)
        self.mock_plants_collection.find_one.return_value = None
        
        # Call the function
        result = garden_mcp.delete_plant(id="60d5ec7a1c9d4410d43a1234")
        
        # Assert the result is of the correct type
        self.assertIsInstance(result, list)
        self.assertIsInstance(result[0], types.TextContent)
        
        # Assert the text contains error information
        self.assertIn("not found", result[0].text)

if __name__ == '__main__':
    unittest.main() 