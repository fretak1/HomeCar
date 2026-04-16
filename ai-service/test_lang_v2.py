import os
import asyncio
from dotenv import load_dotenv
from app.services.assistant import assistant
import sys

# Ensure UTF-8 output even on Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

load_dotenv()

async def test_language():
    # Attempt 1: English
    history = []
    msg = "Hello, tell me about HomeCar in English please."
    print(f"User: {msg}")
    resp = await assistant.get_response(msg, history)
    
    # Check if response contains typical English words and NOT Amharic characters (range 0x1200-0x137F)
    has_amharic = any('\u1200' <= char <= '\u137F' for char in resp)
    print(f"Response received. Length: {len(resp)}")
    print(f"Has Amharic: {has_amharic}")
    
    if not has_amharic:
        print("SUCCESS: Response is likely in English.")
    else:
        print("FAILURE: Response contains Amharic characters.")

if __name__ == "__main__":
    asyncio.run(test_language())
