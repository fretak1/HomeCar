import os
import pandas as pd
import numpy as np
import datetime
import joblib
from typing import Dict, Any, List, Optional
from app.database import query_to_dataframe

MODEL_DIR = "models"

class PredictionService:
    def __init__(self):
        self.current_year = datetime.datetime.now().year
        self.models = {}
        self.encoders = {}
        self._load_models()

    def _load_models(self):
        """Loads the pre-trained Brain Files on startup."""
        try:
            model_paths = {
                "house_buy": ("house_buy_model.joblib", "house_buy_encoder.joblib"),
                "house_rent": ("house_rent_model.joblib", "house_rent_encoder.joblib"),
                "car_buy": ("car_buy_model.joblib", "car_buy_encoder.joblib"),
                "car_rent": ("car_rent_model.joblib", "car_rent_encoder.joblib")
            }
            
            for key, (m_file, e_file) in model_paths.items():
                m_path = os.path.join(MODEL_DIR, m_file)
                e_path = os.path.join(MODEL_DIR, e_file)
                
                if os.path.exists(m_path) and os.path.exists(e_path):
                    self.models[key] = joblib.load(m_path)
                    self.encoders[key] = joblib.load(e_path)
                    print(f"Loaded {key} ML model successfully.")
                else:
                    print(f"Warning: {key} model or encoder not found.")
        except Exception as e:
            print(f"Error loading models: {e}")

    def _normalize_location(self, text: Any) -> str:
        if not text: return "Unknown"
        t = str(text).strip().title()
        if "Addis" in t:
            return "Addis Ababa"
        return t

    def _get_similar_references(self, data: Dict[str, Any]) -> str:
        """Fetches up to 3 similar properties or cars as 'evidence'."""
        try:
            asset_type = 'HOME' if 'propertyType' in data else 'CAR'
            listing_type = str(data.get('listingType', 'BUY')).upper()
            
            if asset_type == 'CAR':
                brand = str(data.get('brand', 'Unknown')).strip().title()
                model = str(data.get('model', 'Unknown')).strip().title()
                year = int(data.get('year', 2015))
                
                query = """
                SELECT year, price FROM "Property" 
                WHERE "assetType" = 'CAR' AND "brand" = %s AND "model" = %s 
                AND %s = ANY("listingType")
                ORDER BY ABS(year - %s) ASC 
                LIMIT 3
                """
                params = (brand, model, listing_type, year)
                df = query_to_dataframe(query, params)
                
                if not df.empty:
                    action = "purchasing" if listing_type == "BUY" else "renting"
                    refs = [f"{row['year']} {brand} - {row['price']:,.0f} ETB" for _, row in df.iterrows()]
                    return f"\n\nSimilar cars are {action} like this in the system:\n" + "\n".join([f"{i+1}. {r}" for i, r in enumerate(refs)])
            
            else: # HOME
                p_type = str(data.get('propertyType', 'apartment')).lower()
                subcity = self._normalize_location(data.get('subcity'))
                
                query = """
                SELECT p.bedrooms, p.price, l.village FROM "Property" p
                JOIN "Location" l ON p."locationId" = l.id
                WHERE p."assetType" = 'HOME' AND p."propertyType" = %s 
                AND l.subcity = %s AND %s = ANY(p."listingType")
                ORDER BY p."createdAt" DESC
                LIMIT 3
                """
                params = (p_type, subcity, listing_type)
                df = query_to_dataframe(query, params)
                
                if not df.empty:
                    action = "purchasing" if listing_type == "BUY" else "renting"
                    refs = [f"{row['bedrooms']} Bed in {row['village'] or subcity} - {row['price']:,.0f} ETB" for _, row in df.iterrows()]
                    return f"\n\nSimilar properties are {action} like this in the system:\n" + "\n".join([f"{i+1}. {r}" for i, r in enumerate(refs)])
                    
            return ""
        except Exception as e:
            print(f"Error fetching references: {e}")
            return ""

    def predict_car(self, data: Dict[str, Any], references: Optional[List[Dict[str, Any]]] = None, grounding_level: str = "City") -> Dict[str, Any]:
        l_type = str(data.get('listingType', 'BUY')).upper()
        target_model = "car_rent" if "RENT" in l_type else "car_buy"

        if target_model not in self.models:
            return {"error": f"{target_model} Brain File is not yet trained."}

        try:
            city = self._normalize_location(data.get('city'))
            # Standardize casing to match training data (which we forced to lowercase/Title case)
            brand = str(data.get('brand', 'Unknown')).strip().title()
            model_name = str(data.get('model', 'Unknown')).strip().title()
            fuel = str(data.get('fuelType', 'petrol')).strip().lower()
            trans = str(data.get('transmission', 'manual')).strip().lower()
            city = self._normalize_location(data.get('city'))

            input_df = pd.DataFrame([{
                'brand': brand,
                'model': model_name,
                'year': int(data.get('year', 2015)),
                'fuelType': fuel,
                'transmission': trans,
                'city': city
            }])

            categorical_cols = ['brand', 'model', 'fuelType', 'transmission', 'city']
            X_encoded = self.encoders[target_model].transform(input_df[categorical_cols])
            X_final = np.hstack([X_encoded, input_df[['year']].values])

            prediction = self.models[target_model].predict(X_final)[0]
            
            # Initial empty reasoning
            reasoning = ""
            
            # Add Evidence
            reasoning += self._get_similar_references(data)
            
            # Final Suggestion
            reasoning += f"\n\nBased on this analysis, I suggest you use this price: {prediction:,.0f} ETB."

            return {
                "predicted_price": float(round(prediction, 2)),
                "confidence": 0.92,
                "reasoning": reasoning.strip()
            }
        except Exception as e:
            return {"error": f"ML Prediction Error: {str(e)}"}

    def predict_house(self, data: Dict[str, Any], references: Optional[List[Dict[str, Any]]] = None, grounding_level: str = "City") -> Dict[str, Any]:
        l_type = str(data.get('listingType', 'BUY')).upper()
        target_model = "house_rent" if "RENT" in l_type else "house_buy"

        if target_model not in self.models:
            return {"error": f"{target_model} Brain File is not yet trained."}

        try:
            city = self._normalize_location(data.get('city'))
            region = self._normalize_location(data.get('region'))
            subcity = self._normalize_location(data.get('subcity'))
            village = data.get('village', 'Unknown')
            p_type = str(data.get('propertyType', 'apartment')).lower()
            beds = int(data.get('bedrooms', 1))
            baths = int(data.get('bathrooms', 1))
            area = float(data.get('area', 100))

            input_df = pd.DataFrame([{
                'region': region,
                'city': city,
                'subcity': subcity,
                'village': village,
                'propertyType': p_type,
                'bedrooms': beds,
                'bathrooms': baths,
                'area': area
            }])

            categorical_cols = ['region', 'city', 'subcity', 'village', 'propertyType']
            X_encoded = self.encoders[target_model].transform(input_df[categorical_cols])
            X_final = np.hstack([X_encoded, input_df[['bedrooms', 'bathrooms', 'area']].values])

            prediction = self.models[target_model].predict(X_final)[0]
            
            # Initial empty reasoning
            reasoning = ""

            # Add Evidence
            reasoning += self._get_similar_references(data)

            # Final Suggestion
            reasoning += f"\n\nBased on this analysis, I suggest you use this price: {prediction:,.0f} ETB."

            return {
                "predicted_price": float(round(prediction, 2)),
                "confidence": 0.94,
                "reasoning": reasoning.strip()
            }
        except Exception as e:
            return {"error": f"ML Prediction Error: {str(e)}"}

prediction_service = PredictionService()
# Trigger hot reload v2

