import asyncio
import os
import json
from dotenv import load_dotenv
load_dotenv()

from app.services.intent_parser import intent_parser

async def test():
    messages = [
        "I can't decide between a Toyota Vitz and a Hyundai Atos. Which one is more fuel-efficient for driving in Addis?",
        "I can't decide between a Toyota Vitz and a Hyundai Tucson. Which one is more fuel-efficient for driving in Addis?"
    ]
    
    for msg in messages:
        print(f"\nTesting message: {msg}")
        result = await intent_parser.parse(msg)
        print(f"Result: {json.dumps(result, indent=2)}")

if __name__ == "__main__":
    asyncio.run(test())
