import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.assistant import assistant

history = [
    {'role': 'user', 'content': 'Show me 5 penthouses'},
    {'role': 'assistant', 'content': 'Here are 5 penthouses:\n- [PENTHOUSE in Dubti](/property/123) — 18,790,000 ETB'}
]

async def main():
    res = await assistant.get_response('Do you have any penthouses available?', history)
    print('RESPONSE:', res)

asyncio.run(main())
