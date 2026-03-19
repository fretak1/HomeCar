from app.services.prediction_service import prediction_service

scenarios = [
    {"year": 1998, "label": "VERY OLD (1998)"},
    {"year": 2012, "label": "OLD (2012)"},
    {"year": 2021, "label": "MODERN (2021)"},
    {"year": 2025, "label": "BRAND NEW (2025)"}
]

for s in scenarios:
    data = {
        "brand": "Hyundai", "model": "Tucson", "year": s["year"],
        "fuelType": "Petrol", "transmission": "Automatic",
        "listingType": "BUY", "city": "Addis Ababa"
    }
    res = prediction_service.predict_car(data)
    print(f"[{s['label']}] Year: {s['year']} -> Predicted: {res.get('predicted_price'):,.2f} ETB")
