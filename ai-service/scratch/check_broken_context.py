import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.assistant import _build_context

async def main():
    ctx = await _build_context("What is the cheapest studio for sale?")
    print("--- CONTEXT FOR CHEAPEST STUDIO FOR SALE ---")
    print(ctx)

asyncio.run(main())
