import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.intent_parser import intent_parser

async def main():
    res = await intent_parser.parse('I need an apartment for my family of four. What do you have available?')
    print('INTENT:', res)

asyncio.run(main())
