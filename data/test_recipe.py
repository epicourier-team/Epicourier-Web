import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Import the functions from your main script
# Assuming your script is named llama_recipe_pipeline.py
from llama_recipe_pipeline import process_recipe_row, safe_json_loads


class TestSafeJsonLoads(unittest.TestCase):
    """Test the safe_json_loads function"""
    
    def test_valid_json(self):
        """Test parsing valid JSON"""
        json_str = '{"name": "test", "value": 123}'
        result = safe_json_loads(json_str)
        self.assertEqual(result, {"name": "test", "value": 123})
    
    def test_json_with_extra_text_prefix(self):
        """Test parsing JSON with extra text at the beginning"""
        json_str = 'Here is the result: {"name": "test", "value": 123}'
        result = safe_json_loads(json_str)
        self.assertEqual(result, {"name": "test", "value": 123})
    
    def test_json_with_extra_text_suffix(self):
        """Test parsing JSON with extra text at the end"""
        json_str = '{"name": "test", "value": 123} End of result'
        result = safe_json_loads(json_str)
        self.assertEqual(result, {"name": "test", "value": 123})
    
    def test_json_with_extra_text_both_sides(self):
        """Test parsing JSON with extra text on both sides"""
        json_str = 'Prefix text {"name": "test", "value": 123} Suffix text'
        result = safe_json_loads(json_str)
        self.assertEqual(result, {"name": "test", "value": 123})
    
    def test_invalid_json(self):
        """Test parsing invalid JSON raises exception"""
        json_str = 'This is not JSON at all'
        with self.assertRaises(json.JSONDecodeError):
            safe_json_loads(json_str)
    
    def test_nested_json(self):
        """Test parsing nested JSON structures"""
        json_str = '{"recipe": {"name": "Pasta", "ingredients": ["tomato", "cheese"]}}'
        result = safe_json_loads(json_str)
        self.assertEqual(result["recipe"]["name"], "Pasta")
        self.assertEqual(len(result["recipe"]["ingredients"]), 2)
    
    def test_json_with_unicode(self):
        """Test parsing JSON with unicode characters"""
        json_str = '{"name": "김치찌개", "description": "Spicy stew"}'
        result = safe_json_loads(json_str)
        self.assertEqual(result["name"], "김치찌개")
    
    def test_json_with_special_characters(self):
        """Test parsing JSON with special characters"""
        json_str = '{"instruction": "Mix & stir, then add 1/2 cup"}'
        result = safe_json_loads(json_str)
        self.assertIn("Mix & stir", result["instruction"])
    
    def test_empty_json_object(self):
        """Test parsing empty JSON object"""
        json_str = '{}'
        result = safe_json_loads(json_str)
        self.assertEqual(result, {})
    
    def test_json_array(self):
        """Test parsing JSON array"""
        json_str = '[{"id": 1}, {"id": 2}]'
        result = safe_json_loads(json_str)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["id"], 1)


class TestProcessRecipeRowWithMock(unittest.TestCase):
    """Test the process_recipe_row function with mocked LLaMA calls"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir) / "cache"
        self.cache_dir.mkdir(exist_ok=True)
        
        self.sample_row = {
            "idMeal": "12345",
            "strMeal": "Test Pasta",
            "strCategory": "Italian",
            "strArea": "Italy",
            "strTags": "Pasta,Dinner",
            "strInstructions": "Cook pasta. Add sauce.",
            "strMealThumb": "http://example.com/thumb.jpg",
            "strSource": "http://example.com",
            "strYoutube": "http://youtube.com/watch",
            "strIngredient1": "Pasta",
            "strMeasure1": "200g",
            "strIngredient2": "Tomato Sauce",
            "strMeasure2": "100ml",
            "strIngredient3": "",
            "strMeasure3": ""
        }
        
        # Add empty ingredients for slots 4-20
        for i in range(4, 21):
            self.sample_row[f"strIngredient{i}"] = ""
            self.sample_row[f"strMeasure{i}"] = ""
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir)
    
    # @patch('llama_recipe_pipeline.CACHE_DIR')
    # def test_process_recipe_cached(self, mock_cache_dir):
    #     """Test processing a cached recipe (no LLaMA call needed)"""
    #     mock_cache_dir.__truediv__ = lambda self, other: self.cache_dir / other
        
    #     # Create a cached file
    #     cache_file = self.cache_dir / "12345.json"
    #     cached_data = {"recipe": "Cached Pasta", "from_cache": True, "category": "Italian"}
    #     cache_file.write_text(json.dumps(cached_data, ensure_ascii=False))
        
    #     result = process_recipe_row(self.sample_row)
        
    #     self.assertEqual(result["recipe"], "Cached Pasta")
    #     self.assertTrue(result["from_cache"])
    #     self.assertEqual(result["category"], "Italian")
    
    # @patch('llama_recipe_pipeline.CACHE_DIR')
    # @patch('llama_recipe_pipeline.query_llama')
    # def test_process_recipe_new_valid_json(self, mock_query, mock_cache_dir):
    #     """Test processing a new recipe with valid JSON response"""
    #     mock_cache_dir.__truediv__ = lambda self, other: self.cache_dir / other
    #     mock_cache_dir.return_value = self.cache_dir
        
    #     # Mock LLaMA to return valid JSON
    #     mock_query.return_value = json.dumps({
    #         "recipe": "Test Pasta",
    #         "category": "Italian",
    #         "area": "Italy",
    #         "ingredients": ["Pasta (200g)", "Tomato Sauce (100ml)"]
    #     })
        
    #     result = process_recipe_row(self.sample_row)
        
    #     self.assertEqual(result["recipe"], "Test Pasta")
    #     self.assertEqual(result["category"], "Italian")
    #     self.assertEqual(len(result["ingredients"]), 2)
        
    #     # Verify cache file was created
    #     cache_file = self.cache_dir / "12345.json"
    #     self.assertTrue(cache_file.exists())
    
    # @patch('llama_recipe_pipeline.CACHE_DIR')
    # @patch('llama_recipe_pipeline.query_llama')
    # def test_process_recipe_json_with_extra_text(self, mock_query, mock_cache_dir):
    #     """Test processing when LLaMA returns JSON with extra text"""
    #     mock_cache_dir.__truediv__ = lambda self, other: self.cache_dir / other
    #     mock_cache_dir.return_value = self.cache_dir
        
    #     # Mock LLaMA to return JSON with extra text
    #     mock_query.return_value = 'Here is your recipe data: {"recipe": "Test Pasta", "category": "Italian"} Hope this helps!'
        
    #     result = process_recipe_row(self.sample_row)
        
    #     self.assertEqual(result["recipe"], "Test Pasta")
    #     self.assertEqual(result["category"], "Italian")
    
    # @patch('llama_recipe_pipeline.CACHE_DIR')
    # @patch('llama_recipe_pipeline.query_llama')
    # def test_process_recipe_invalid_json(self, mock_query, mock_cache_dir):
    #     """Test processing when LLaMA returns invalid JSON"""
    #     mock_cache_dir.__truediv__ = lambda self, other: self.cache_dir / other
    #     mock_cache_dir.return_value = self.cache_dir
        
    #     # Mock LLaMA to return invalid JSON
    #     invalid_response = 'This is not valid JSON at all, sorry!'
    #     mock_query.return_value = invalid_response
        
    #     result = process_recipe_row(self.sample_row)
        
    #     # Should contain error information
    #     self.assertIn("error", result)
    #     self.assertIn("raw", result)
    #     self.assertEqual(result["raw"], invalid_response)
        
    #     # Verify cache file still created (with error info)
    #     cache_file = self.cache_dir / "12345.json"
    #     self.assertTrue(cache_file.exists())


class TestIngredientExtraction(unittest.TestCase):
    """Test ingredient extraction logic"""
    
    def test_extract_valid_ingredients(self):
        """Test extracting valid ingredients from row"""
        row = {
            "strIngredient1": "Chicken",
            "strMeasure1": "500g",
            "strIngredient2": "Onion",
            "strMeasure2": "1 large",
            "strIngredient3": "Garlic",
            "strMeasure3": "3 cloves",
        }
        
        ingredients = []
        for i in range(1, 4):
            name = row.get(f"strIngredient{i}")
            measure = row.get(f"strMeasure{i}")
            if name and name.strip():
                ingredients.append(f"- {name.strip()} ({measure.strip()})")
        
        self.assertEqual(len(ingredients), 3)
        self.assertIn("Chicken (500g)", ingredients[0])
        self.assertIn("Onion (1 large)", ingredients[1])
        self.assertIn("Garlic (3 cloves)", ingredients[2])
    
    def test_extract_ingredients_with_empty_slots(self):
        """Test extracting ingredients with some empty slots"""
        row = {
            "strIngredient1": "Pasta",
            "strMeasure1": "200g",
            "strIngredient2": "",
            "strMeasure2": "",
            "strIngredient3": "Salt",
            "strMeasure3": "to taste",
        }
        
        ingredients = []
        for i in range(1, 4):
            name = row.get(f"strIngredient{i}")
            measure = row.get(f"strMeasure{i}")
            if name and name.strip():
                ingredients.append(f"- {name.strip()} ({measure.strip()})")
        
        # Should only extract non-empty ingredients
        self.assertEqual(len(ingredients), 2)
        self.assertIn("Pasta", ingredients[0])
        self.assertIn("Salt", ingredients[1])
    
    def test_extract_ingredients_with_whitespace(self):
        """Test extracting ingredients with extra whitespace"""
        row = {
            "strIngredient1": "  Tomato  ",
            "strMeasure1": "  2 cups  ",
            "strIngredient2": "Basil",
            "strMeasure2": "handful",
        }
        
        ingredients = []
        for i in range(1, 3):
            name = row.get(f"strIngredient{i}")
            measure = row.get(f"strMeasure{i}")
            if name and name.strip():
                ingredients.append(f"- {name.strip()} ({measure.strip()})")
        
        # Whitespace should be stripped
        self.assertIn("Tomato (2 cups)", ingredients[0])
        self.assertIn("Basil (handful)", ingredients[1])


class TestCacheFileHandling(unittest.TestCase):
    """Test cache file reading and writing"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir) / "cache"
        self.cache_dir.mkdir(exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir)
    
    def test_cache_file_exists_check(self):
        """Test checking if cache file exists"""
        cache_file = self.cache_dir / "test_recipe.json"
        
        # Initially should not exist
        self.assertFalse(cache_file.exists())
        
        # Create the file
        cache_file.write_text('{"test": "data"}')
        
        # Now should exist
        self.assertTrue(cache_file.exists())
    
    def test_read_cache_file(self):
        """Test reading from cache file"""
        cache_file = self.cache_dir / "test_recipe.json"
        test_data = {"recipe": "Test", "category": "Italian"}
        cache_file.write_text(json.dumps(test_data, ensure_ascii=False))
        
        # Read and parse
        loaded_data = json.loads(cache_file.read_text())
        
        self.assertEqual(loaded_data["recipe"], "Test")
        self.assertEqual(loaded_data["category"], "Italian")
    
    def test_write_cache_file_utf8(self):
        """Test writing cache file with UTF-8 encoding"""
        cache_file = self.cache_dir / "test_recipe.json"
        test_data = {"recipe": "김치볶음밥", "category": "Korean"}
        
        # Write with UTF-8
        cache_file.write_text(json.dumps(test_data, indent=2, ensure_ascii=False))
        
        # Read back
        loaded_data = json.loads(cache_file.read_text())
        
        self.assertEqual(loaded_data["recipe"], "김치볶음밥")
    
    def test_cache_file_overwrite(self):
        """Test overwriting existing cache file"""
        cache_file = self.cache_dir / "test_recipe.json"
        
        # Write initial data
        cache_file.write_text('{"version": 1}')
        
        # Overwrite with new data
        cache_file.write_text('{"version": 2}')
        
        # Verify new data
        loaded_data = json.loads(cache_file.read_text())
        self.assertEqual(loaded_data["version"], 2)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error conditions"""
    
    def test_safe_json_loads_with_nested_braces(self):
        """Test JSON parsing with nested braces in strings"""
        json_str = '{"instruction": "Use {brackets} in text", "value": 123}'
        result = safe_json_loads(json_str)
        self.assertIn("{brackets}", result["instruction"])
    
    def test_safe_json_loads_with_newlines(self):
        """Test JSON parsing with newlines"""
        json_str = '{\n  "name": "test",\n  "value": 123\n}'
        result = safe_json_loads(json_str)
        self.assertEqual(result["name"], "test")
    
    def test_safe_json_loads_with_escaped_quotes(self):
        """Test JSON parsing with escaped quotes"""
        json_str = '{"quote": "He said \\"hello\\""}'
        result = safe_json_loads(json_str)
        self.assertIn('He said "hello"', result["quote"])


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)