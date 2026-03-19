from app.services.prediction_service import prediction_service

def test_amenity_logic():
    print("--- Testing Amenity & ListedFor Logic ---")
    references = [
        {"price": 1000000, "area": 100, "bedrooms": 2, "bathrooms": 1},
        {"price": 1000000, "area": 100, "bedrooms": 2, "bathrooms": 1},
        {"price": 1000000, "area": 100, "bedrooms": 2, "bathrooms": 1},
    ]
    
    # Target: Standard House
    standard = {"area": 100, "bedrooms": 2, "bathrooms": 1, "amenities": []}
    res_std = prediction_service.predict_house(standard, references)
    print(f"Standard Price: {res_std['predicted_price']}")

    # Target: House with Pool (+8%) and G+2 (+5%) = +13% total
    luxury = {"area": 100, "bedrooms": 2, "bathrooms": 1, "amenities": ["Swimming Pool", "G+2 Compound"]}
    res_lux = prediction_service.predict_house(luxury, references)
    print(f"Luxury Price: {res_lux['predicted_price']}")
    
    if res_lux['predicted_price'] > res_std['predicted_price'] * 1.12:
        print("PASS: Amenities successfully boosted price.")
        print(f"Reasoning: {res_lux['reasoning']}")
    else:
        print("FAIL: Amenity boost failed.")

def test_car_amenity_logic():
    print("\n--- Testing Car Amenity Logic ---")
    references = [
        {"price": 500000, "year": 2020, "mileage": 40000},
        {"price": 500000, "year": 2020, "mileage": 40000},
        {"price": 500000, "year": 2020, "mileage": 40000},
    ]
    
    # Target: Automatic/Sunroof car (+5% + 4% = +9%)
    luxury_car = {"year": 2020, "mileage": 40000, "amenities": ["Automatic", "Sunroof"]}
    res = prediction_service.predict_car(luxury_car, references)
    print(f"Luxury Car Price: {res['predicted_price']}")
    
    if res['predicted_price'] > 540000:
        print("PASS: Car amenities successfully boosted price.")
        print(f"Reasoning: {res['reasoning']}")
    else:
        print(f"FAIL: Car boost failed. Predicted: {res['predicted_price']}")

if __name__ == "__main__":
    test_amenity_logic()
    test_car_amenity_logic()
