import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import os

class RecommendationService:
    def __init__(self):
        self.car_pool = pd.read_csv('data/cars_synthetic.csv') if os.path.exists('data/cars_synthetic.csv') else pd.DataFrame()
        self.house_pool = pd.read_csv('data/houses_synthetic.csv') if os.path.exists('data/houses_synthetic.csv') else pd.DataFrame()
        
        # Add property IDs for reference
        if not self.car_pool.empty:
            self.car_pool['propertyId'] = [f"car_{i}" for i in range(len(self.car_pool))]
            self.car_pool['assetType'] = 'CAR'
        if not self.house_pool.empty:
            self.house_pool['propertyId'] = [f"house_{i}" for i in range(len(self.house_pool))]
            self.house_pool['assetType'] = 'HOME'

    def get_recommendations(self, history, limit=10):
        if not history:
            return []

        # For this cold-start version, we'll find similar items in our synthetic pool
        # based on the last item the user interacted with.
        last_item = history[-1]
        
        if last_item.assetType == 'CAR':
            return self._recommend_cars(last_item, limit)
        else:
            return self._recommend_houses(last_item, limit)

    def _recommend_cars(self, item, limit):
        if self.car_pool.empty: return []
        
        # Simple heuristic: filter by brand and price range
        matches = self.car_pool[
            (self.car_pool['brand'] == item.brand) | 
            (self.car_pool['price'].between(item.price * 0.8, item.price * 1.2))
        ].copy()
        
        matches['score'] = 0.9 # Mock similarity score
        return matches.head(limit).to_dict('records')

    def _recommend_houses(self, item, limit):
        if self.house_pool.empty: return []
        
        # Simple heuristic: filter by location and price range
        matches = self.house_pool[
            (self.house_pool['location'] == item.location) | 
            (self.house_pool['price'].between(item.price * 0.8, item.price * 1.2))
        ].copy()
        
        matches['score'] = 0.85 # Mock similarity score
        return matches.head(limit).to_dict('records')

recommendation_service = RecommendationService()
