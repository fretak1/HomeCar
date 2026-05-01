import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.assistant import _build_context

async def main():
    res = await _build_context('I need an apartment for my family of four. What do you have available?')
    print('CONTEXT:', res)

asyncio.run(main())
