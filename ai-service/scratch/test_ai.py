import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.assistant import assistant

async def main():
    res = await assistant.get_response('Do you have any penthouses available?', [])
    print('RESPONSE:', res)

asyncio.run(main())
