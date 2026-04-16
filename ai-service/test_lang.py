import os
import asyncio
from dotenv import load_dotenv
from app.services.assistant import assistant

load_dotenv()

async def test_language():
    # Attempt 1: Just English
    history = []
    msg = "Hello, tell me about HomeCar"
    print(f"\nUser: {msg}")
    resp = await assistant.get_response(msg, history)
    print(f"Assistant: {resp}")

    # Attempt 2: English after Amharic history
    history = [
        {"role": "user", "content": "ሰላም"},
        {"role": "assistant", "content": "ሰላም! እንዴት ልረዳዎት እችላለሁ?"}
    ]
    msg = "Show me cars in Addis Ababa"
    print(f"\nUser: {msg} (after Amharic history)")
    resp = await assistant.get_response(msg, history)
    print(f"Assistant: {resp}")

if __name__ == "__main__":
    asyncio.run(test_language())
