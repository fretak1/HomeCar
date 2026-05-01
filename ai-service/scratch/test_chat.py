import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from app.services.assistant import AIAssistant

import traceback

async def main():
    assistant = AIAssistant()
    message = "Are there any reliable hospitals or clinics close to the Saris area?"
    history = []
    
    print(f"User: {message}\n")
    print("AI is thinking...\n")
    
    from app.services.intent_parser import intent_parser
    intent_data = await intent_parser.parse(message)
    print("Parsed Intent:", intent_data)
    
    try:
        response = await assistant.get_response(message, history)
        print("Chatbot Response:")
        print("-" * 50)
        print(response)
        print("-" * 50)
    except Exception as e:
        print("An error occurred:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
