import os
from google import genai

# Read .env manually to avoid dependency issues
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY='):
            os.environ['GEMINI_API_KEY'] = line.split('=', 1)[1].strip().strip('"')

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("Listing available models:")
for m in client.models.list():
    actions = getattr(m, 'supported_actions', [])
    print(f" - {m.name} (Actions: {actions})")
