import requests

response = requests.post(
    "http://localhost:8000/api/v1/chat",
    json={"message": "Show me a villa for sale under my 10 million in addis abeba", "history": []}
)
print(response.status_code)
print(response.text)
