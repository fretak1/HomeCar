import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from app.services.intent_parser import intent_parser

async def main():
    message = "Can you tell me if there are any good international schools in CMC Addis Abeba?"
    print(f"Message: {message}")
    intent_data = await intent_parser.parse(message)
    print("Parsed Intent:", intent_data)

if __name__ == "__main__":
    asyncio.run(main())
