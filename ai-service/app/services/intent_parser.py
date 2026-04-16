import os
import json
import asyncio
from typing import Dict, Any, Optional
from groq import Groq

class IntentParser:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.1-8b-instant"
        
        self.SYSTEM_PROMPT = """
        You are a Search Intent Extractor for 'HomeCar', an Ethiopian marketplace for cars and homes.
        Your goal is to convert user messages into a structured JSON object for database filtering.
        
        CRITICAL RULES:
        1. Ignore conversational fillers like "I live in", "My name is", "I am staying", "Hello", "Hi".
        2. Detect Intent: 
           - 'SEARCH_CAR': Searching for vehicles.
           - 'SEARCH_HOME': Searching for properties/houses/apartments.
           - 'GENERAL': Greetings, platform questions, or non-search statements.
        3. Extract Filters: 
           - 'locations': List of detected cities or neighborhoods (e.g. ["Addis Ababa", "Bole"]).
           - 'brand': Detected car brand (e.g. "Toyota").
           - 'prop_type': Detected property type (e.g. "VILLA", "APARTMENT").
           - 'price_max': Maximum price in ETB (convert 'million' to 1,000,000).
           - 'price_min': Minimum price in ETB.
           - 'listing_intent': 'BUY' or 'RENT'.
           - 'bedrooms': Number of bedrooms as an integer (e.g. 1, 2, 3, 4).
           - 'query_text': Any remaining relevant keywords (e.g. "luxury", "automatic").
        
        Example Input: "i am frezer takele live in addis abeba show me tucsons for sale"
        Example Output: 
        {
          "intent": "SEARCH_CAR",
          "is_search": true,
          "filters": {
            "locations": ["Addis Ababa"],
            "brand": "Hyundai",
            "model_fragment": "Tucson",
            "bedrooms": null,
            "price_max": null, 
            "listing_intent": "BUY",
            "query_text": ""
          }
        }

        Example Input: "4 bedroom villa in bole for sale"
        Example Output:
        {
          "intent": "SEARCH_HOME",
          "is_search": true,
          "filters": {
            "locations": ["Bole"],
            "prop_type": "VILLA",
            "bedrooms": 4,
            "listing_intent": "BUY",
            "query_text": ""
          }
        }
        
        NOTE: If user asks "show me", "search", "find", or "is there any", set "is_search" to true.
        Return ONLY valid JSON.
        """

    async def parse(self, message: str) -> Dict[str, Any]:
        """Convert message to structured intent."""
        try:
            completion = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": message}
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            
            result = json.loads(completion.choices[0].message.content)
            # Ensure safe structure
            return {
                "intent": result.get("intent", "GENERAL"),
                "is_search": result.get("is_search", False),
                "filters": result.get("filters", {})
            }
        except Exception as e:
            print(f"IntentParser Error: {e}")
            return {"intent": "GENERAL", "is_search": False, "filters": {}}

intent_parser = IntentParser()
