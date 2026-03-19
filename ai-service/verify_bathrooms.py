from app.services.prediction_service import prediction_service

print("--- VERIFYING BATHROOM SENSITIVITY (Hosaina Apartment) ---")

scenarios = [
    {"beds": 3, "baths": 1, "label": "3 BED, 1 BATH"},
    {"beds": 3, "baths": 3, "label": "3 BED, 3 BATH"},
]

for s in scenarios:
    data = {
        "region": "Central Ethiopia", "city": "Hosaina", "subcity": "Sech-Duna",
        "propertyType": "apartment", "bedrooms": s["beds"], "bathrooms": s["baths"],
        "area": 120, "listingType": "BUY"
    }
    res = prediction_service.predict_house(data)
    print(f"[{s['label']}] -> Predicted: {res.get('predicted_price'):,.2f} ETB")
