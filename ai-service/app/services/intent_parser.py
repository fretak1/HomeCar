import os
import json
import asyncio
from typing import Dict, Any, Optional, List
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
           - 'SEARCH_HOME': Searching for properties/houses/apartments/studios. If a property type or vehicle is mentioned in a question about availability or price, it is ALWAYS a search intent.
           - 'GENERAL': Greetings, platform questions, or non-search statements. If the user asks "do you have", "what is", or "show me" regarding properties, it is NOT GENERAL.
        3. Extract Filters: 
           - 'locations': List of detected cities or neighborhoods (e.g. ["Addis Ababa", "Bole"]).
           - 'entities': A list of objects, each containing:
                - 'brand': Detected car brand (e.g. "Toyota").
                - 'model': Detected car model or fragment (e.g. "Vitz", "Tucson").
                - 'transmission': Detected transmission (e.g. "Manual", "Automatic").
                - 'prop_type': Detected property type (e.g. "VILLA", "APARTMENT").
                - 'bedrooms': Number of bedrooms (integer).
           - 'price_max': Maximum price in ETB.
           - 'price_min': Minimum price in ETB.
           - 'price_min': Minimum price in ETB.
           - 'listing_intent': 'BUY', 'RENT', or null if the user does not specify (e.g., "what's the cheapest studio" should be null).
           - 'query_text': Any remaining relevant keywords. DO NOT include adjectives like "fuel-efficient", "cheap", "cheapest", "affordable", "nice" here as they are unlikely to be in listing titles. Only include concrete features like "automatic", "luxury", "furnished", "pool".
        4. Strict History Isolation: Do NOT carry over price limits (price_max/min), property types, or brands from the conversation history into the new filters UNLESS the user explicitly asks to modify them (e.g., "what about under 5 million?" or "show me Toyota instead"). If the user asks a completely complete standalone sentence like "Show me a villa in addis ababa", DROP all previous constraints like budget.
        
        Example Input: "compare toyota vitz and hyundai tucson for sale in addis"
        Example Output: 
        {
          "intent": "SEARCH_CAR",
          "is_search": true,
          "filters": {
            "locations": ["Addis Ababa"],
            "entities": [
                {"brand": "Toyota", "model": "Vitz"},
                {"brand": "Hyundai", "model": "Tucson"}
            ],
            "listing_intent": "BUY",
            "query_text": "compare"
          }
        }
        
        NOTE: If user asks "show me", "search", "find", "is there any", "what is", or asks about availability, you MUST set "is_search" to true and extract the proper intent (SEARCH_HOME or SEARCH_CAR).
        Return ONLY valid JSON.
        """

    async def parse(self, message: str, history: List[Dict[str, str]] = []) -> Dict[str, Any]:
        """Convert message to structured intent, considering conversation history for context."""
        try:
            # Prepare conversation context for the parser
            parsing_messages = [
                {"role": "system", "content": self.SYSTEM_PROMPT},
            ]
            
            # Add last 5 messages for context to keep it concise but relevant
            recent_history = history[-5:] if history else []
            for h in recent_history:
                role = h.get('role', 'user')
                if role == 'model': role = 'assistant'
                
                content = h.get('parts', h.get('content', ''))
                if isinstance(content, list):
                    content = " ".join([p.get('text', '') if isinstance(p, dict) else str(p) for p in content])
                
                if content:
                    parsing_messages.append({"role": role, "content": content})
            
            # Add the current message
            parsing_messages.append({"role": "user", "content": f"Extract intent from this new message, maintaining context from above if it's a follow-up: {message}"})

            completion = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=parsing_messages,
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
