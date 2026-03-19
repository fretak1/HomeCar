from app.services.prediction_service import prediction_service

print("--- VERIFYING GEOGRAPHIC SENSITIVITY (Standard Villa) ---")

scenarios = [
    {"region": "Addis Ababa", "city": "Addis Ababa", "subcity": "Bole", "village": "Bulbula", "label": "BOLE BULBULA"},
    {"region": "Addis Ababa", "city": "Addis Ababa", "subcity": "Arada", "village": "Piassa", "label": "ARADA PIASSA (Premium City Center)"},
    {"region": "SNNPR", "city": "Hawassa", "subcity": "Tabor", "village": "Tabor 2", "label": "HAWASSA TABOR"},
]

for s in scenarios:
    data = {
        "region": s["region"],
        "city": s["city"], "subcity": s["subcity"], "village": s["village"],
        "propertyType": "villa", "bedrooms": 4, "bathrooms": 3,
        "area": 250, "listingType": "BUY"
    }
    res = prediction_service.predict_house(data)
    print(f"[{s['label']}] -> Predicted: {res.get('predicted_price'):,.2f} ETB")
