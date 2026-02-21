import pandas as pd
import numpy as np
import os

def generate_car_data(n=1000):
    brands = ['Toyota', 'BMW', 'Tesla', 'Ford', 'Honda']
    models = ['Sedan', 'SUV', 'Hybrid', 'Luxury']
    conditions = ['Excellent', 'Good', 'Fair']
    
    data = []
    for _ in range(n):
        brand = np.random.choice(brands)
        model = np.random.choice(models)
        year = np.random.randint(2010, 2024)
        mileage = np.random.randint(0, 150000)
        condition = np.random.choice(conditions)
        
        # Heuristic price calculation for synthetic data
        base_price = 20000
        if brand == 'BMW' or brand == 'Tesla': base_price += 15000
        if model == 'SUV': base_price += 5000
        
        age_penalty = (2024 - year) * 1500
        mileage_penalty = mileage * 0.1
        
        price = max(base_price - age_penalty - mileage_penalty, 2000)
        
        data.append([brand, model, year, mileage, condition, price])
        
    df = pd.DataFrame(data, columns=['brand', 'model', 'year', 'mileage', 'condition', 'price'])
    return df

def generate_house_data(n=1000):
    locations = ['Downtown', 'Suburbs', 'Countryside', 'Uptown']
    types = ['Apartment', 'Villa', 'Studio', 'Penthouse']
    
    data = []
    for _ in range(n):
        location = np.random.choice(locations)
        prop_type = np.random.choice(types)
        area = np.random.randint(500, 5000)
        bedrooms = np.random.randint(1, 6)
        bathrooms = np.random.randint(1, 4)
        
        base_price = 50000
        if location == 'Downtown' or location == 'Uptown': base_price += 100000
        if prop_type == 'Villa' or prop_type == 'Penthouse': base_price += 200000
        
        size_bonus = area * 150
        room_bonus = bedrooms * 10000
        
        price = base_price + size_bonus + room_bonus
        
        data.append([location, prop_type, area, bedrooms, bathrooms, price])
        
    df = pd.DataFrame(data, columns=['location', 'propertyType', 'area', 'bedrooms', 'bathrooms', 'price'])
    return df

if __name__ == "__main__":
    os.makedirs('data', exist_ok=True)
    
    print("Generating car data...")
    car_df = generate_car_data()
    car_df.to_csv('data/cars_synthetic.csv', index=False)
    
    print("Generating house data...")
    house_df = generate_house_data()
    house_df.to_csv('data/houses_synthetic.csv', index=False)
    
    print("Synthetic data saved to data/ directory.")
