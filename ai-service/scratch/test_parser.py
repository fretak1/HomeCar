
import asyncio
import os
import json
from app.services.intent_parser import intent_parser

async def test():
    message = "I am a university student in Addis Ababa University (Sidist Kilo campus), looking for a cheap shared apartment 6 Kilo with a budget of 60k–70k birr."
    print(f"Testing message: {message}")
    
    # 1. Normalize like assistant.py does
    message_normalized = message.replace("Addis Abeba", "Addis Ababa")
    if "6 kilo" in message_normalized.lower() or "sidist kilo" in message_normalized.lower():
        message_normalized += " 6 Kilo Sidist Kilo"
        
    print(f"Normalized message: {message_normalized}")
    
    # 2. Parse intent
    result = await intent_parser.parse(message_normalized, [])
    print("\n--- PARSE RESULT ---")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    os.environ["OPENROUTER_API_KEY"] = "YOUR_KEY_HERE" # Not needed for dry run if I just want to see the prompt or logic
    asyncio.run(test())
