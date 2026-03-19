from app.services.prediction_service import prediction_service

print("--- VERIFYING CASE-INSENSITIVE SENSITIVITY ---")

scenarios = [
    {"fuel": "Petrol", "trans": "Automatic", "label": "CAPITALIZED PETROL AUTO"},
    {"fuel": "Electric", "trans": "Manual", "label": "CAPITALIZED ELECTRIC MANUAL"},
    {"fuel": "Diesel", "trans": "Automatic", "label": "CAPITALIZED DIESEL AUTO"}
]

for s in scenarios:
    data = {
        "brand": "Hyundai", "model": "Tucson", "year": 2025,
        "fuelType": s["fuel"], "transmission": s["trans"],
        "listingType": "BUY", "city": "Addis Ababa"
    }
    res = prediction_service.predict_car(data)
    print(f"[{s['label']}] -> Predicted: {res.get('predicted_price'):,.2f} ETB")
