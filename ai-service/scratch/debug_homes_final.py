import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.assistant import _build_context

async def main():
    ctx = await _build_context("Show me any homes you have.")
    print("--- CONTEXT FOR HOMES ---")
    print(ctx)

asyncio.run(main())
