from app.services.prediction_service import prediction_service

print("--- VERIFYING FEATURE SENSITIVITY (2025 Hyundai Tucson) ---")

scenarios = [
    {"fuel": "petrol", "trans": "automatic", "label": "PETROL AUTOMATIC"},
    {"fuel": "electric", "trans": "manual", "label": "ELECTRIC MANUAL"},
    {"fuel": "diesel", "trans": "automatic", "label": "DIESEL AUTOMATIC"}
]

for s in scenarios:
    data = {
        "brand": "Hyundai", "model": "Tucson", "year": 2025,
        "fuelType": s["fuel"], "transmission": s["trans"],
        "listingType": "BUY", "city": "Addis Ababa"
    }
    res = prediction_service.predict_car(data)
    print(f"[{s['label']}] -> Predicted: {res.get('predicted_price'):,.2f} ETB")
