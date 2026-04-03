import pandas as pd
from app.services.prediction_service import PredictionService

ps = PredictionService()

data_455 = {
    "propertyType": "building",
    "area": 455,
    "bathrooms": 3,
    "bedrooms": 3,
    "city": "Addis abeba",
    "listingType": "RENT",
    "region": "Addis abeba",
    "subcity": "Lideta",
    "village": "Cherkos"
}

data_543 = data_455.copy()
data_543["area"] = 543

print("Running 455...")
res_455 = ps.predict_house(data_455)
print("Price 455:", res_455.get('predicted_price'))
print("Reason:", res_455.get('reasoning'))
listings = res_455.get('similar_listings', [])
if listings:
    print("Top reason string:", listings[0].get('reason'))

print("\nRunning 543...")
res_543 = ps.predict_house(data_543)
print("Price 543:", res_543.get('predicted_price'))
print("Reason:", res_543.get('reasoning'))
listings_543 = res_543.get('similar_listings', [])
if listings_543:
    print("Top reason string:", listings_543[0].get('reason'))
