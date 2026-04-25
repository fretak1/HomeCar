import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from app.services.assistant import _search_db

def test_search():
    print("Searching for Toyota Vitz in Addis...")
    res1 = _search_db(asset_type="CAR", brand="Toyota", model="Vitz", location="Addis")
    print(f"Toyota Vitz Results:\n{res1}\n")

    print("Searching for Hyundai Tucson in Addis...")
    res2 = _search_db(asset_type="CAR", brand="Hyundai", model="Tucson", location="Addis")
    print(f"Hyundai Tucson Results:\n{res2}\n")

if __name__ == "__main__":
    test_search()
