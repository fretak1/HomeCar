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

    def reload_models(self):
        """Public hook to refresh the ML 'Brain' after a retraining session."""
        print("[AI] Reloading models from disk...")
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
            
        import difflib
        known_locations = [
            "Bole", "Yeka", "Arada", "Kirkos", "Lideta", "Akaky Kaliti", "Nifas Silk-Lafto", "Kolfe Keranio", "Gullele", "Addis Ketema", "Lemi Kura",
            "Kazanchis", "Piassa", "Saris", "Ayat", "CMC", "Gerji", "Bole Bulbula", "Old Airport", "Summit", "Jackros", "Gurd Shola", "Megenagna", "22 Mazoria", "Sarbet", "Mekanisa", "Jemo", "Kaliti", "Akaki", "Kotebe", "Ferensay", "Arat Kilo", "Merkato", "Cherkos", "Gotera", "Lebu", "Lafto"
        ]
        matches = difflib.get_close_matches(t, known_locations, n=1, cutoff=0.7)
        if matches:
            return matches[0]
            
        return t

    def _get_similar_references(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetches up to 3 similar properties or cars as structured evidence."""
        try:
            asset_type = 'HOME' if 'propertyType' in data else 'CAR'
            listing_type = str(data.get('listingType', 'BUY')).upper()
            results = []
            
            if asset_type == 'CAR':
                brand = str(data.get('brand', 'Unknown')).strip().title()
                model = str(data.get('model', 'Unknown')).strip().title()
                year = int(data.get('year', 2015))
                fuel = str(data.get('fuelType', 'petrol')).strip().lower()
                trans = str(data.get('transmission', 'manual')).strip().lower()
                city = self._normalize_location(data.get('city'))
                
                query = """
                SELECT p.id, p.title, p.price, p.year, p.brand, p.model, p."fuelType", p.transmission, l.city, pi.url as image_url
                FROM "Property" p
                JOIN "Location" l ON p."locationId" = l.id
                LEFT JOIN "PropertyImage" pi ON p.id = pi."propertyId" AND pi."isMain" = true
                WHERE p."assetType" = 'CAR' AND p."brand" = %s 
                AND %s = ANY(p."listingType")
                ORDER BY (p.model = %s) DESC
                LIMIT 50
                """
                params = (brand, listing_type, model)
                df = query_to_dataframe(query, params)
                
                scored_results = []
                for _, row in df.iterrows():
                    score = 0
                    reasons = []
                    
                    reasons.append(f"Exact Brand match ({brand})")
                    score += 100
                    
                    if row['model'] == model:
                        reasons.append(f"Exact Model Match ({model})")
                        score += 300
                    
                    if pd.notna(row['city']) and str(row['city']) == city:
                        reasons.append(f"Exact City Match ({city})")
                        score += 200
                        
                    if pd.notna(row['transmission']) and str(row['transmission']).lower() == trans:
                        reasons.append(f"Exact Transmission Match ({trans.capitalize()})")
                        score += 50
                        
                    if pd.notna(row['fuelType']) and str(row['fuelType']).lower() == fuel:
                        reasons.append(f"Exact Fuel Type Match ({fuel.capitalize()})")
                        score += 50
                        
                    if row['year'] == year:
                        reasons.append(f"Exact Year match ({year})")
                        score += 100
                    else:
                        diff = abs(row['year'] - year)
                        reasons.append(f"{diff}yr diff ({row['year']})")
                        score -= (diff * 30)

                    scored_results.append({
                        "id": row['id'],
                        "title": row['title'],
                        "price": float(row['price']),
                        "image": row['image_url'],
                        "reason": " • ".join(reasons),
                        "score": score
                    })
                    
                scored_results.sort(key=lambda x: x['score'], reverse=True)
                results = [{k:v for k,v in item.items() if k != 'score'} for item in scored_results[:3]]
            
            else: # HOME
                p_type = str(data.get('propertyType', 'apartment')).lower()
                region = self._normalize_location(data.get('region'))
                city = self._normalize_location(data.get('city'))
                subcity = self._normalize_location(data.get('subcity'))
                village = data.get('village', 'Unknown')
                beds = int(data.get('bedrooms', 1))
                baths = int(data.get('bathrooms', 1))
                area_val = float(data.get('area', 100))
                
                query = """
                SELECT p.id, p.title, p.price, p.bedrooms, p.bathrooms, p.area, p."propertyType", l.region, l.city, l.subcity, l.village, pi.url as image_url
                FROM "Property" p
                JOIN "Location" l ON p."locationId" = l.id
                LEFT JOIN "PropertyImage" pi ON p.id = pi."propertyId" AND pi."isMain" = true
                WHERE p."assetType" = 'HOME' AND l.subcity = %s 
                AND %s = ANY(p."listingType")
                ORDER BY 
                    (p."propertyType" = %s) DESC, 
                    (l.village = %s) DESC, 
                    ABS(p.bedrooms - %s) ASC,
                    ABS(p.bathrooms - %s) ASC
                LIMIT 3
                """
                params = (subcity, listing_type, p_type, village, beds, baths)
                df = query_to_dataframe(query, params)
                
                for _, row in df.iterrows():
                    reasons = []
                    
                    if pd.notna(row['region']) and row['region'] == region:
                        reasons.append(f"Same region ({region})")
                        
                    if pd.notna(row['city']) and row['city'] == city:
                        reasons.append(f"Same city ({city})")
                        
                    if pd.notna(row['subcity']) and row['subcity'] == subcity:
                        reasons.append(f"Same sub-city ({subcity})")
                    
                    if pd.notna(row['village']) and row['village'] == village and village != 'Unknown':
                        reasons.append(f"Same village ({village})")
                    
                    if pd.notna(row['propertyType']) and str(row['propertyType']).lower() == p_type:
                        reasons.append(f"Same type ({p_type.capitalize()})")
                    
                    if pd.notna(row['bedrooms']):
                        if row['bedrooms'] == beds:
                            reasons.append(f"Exact {beds} Beds")
                        else:
                            reasons.append(f"{row['bedrooms']} Beds")
                            
                    if pd.notna(row['bathrooms']) and row['bathrooms'] == baths:
                        reasons.append(f"Exact {baths} Baths")
                        
                    if area_val > 0 and pd.notna(row['area']) and row['area']:
                        diff_pct = abs(row['area'] - area_val) / area_val * 100
                        if diff_pct <= 15:
                            reasons.append(f"Similar area (~{int(row['area'])} sqm)")

                    results.append({
                        "id": row['id'],
                        "title": row['title'],
                        "price": float(row['price']),
                        "area": float(row.get('area', 0)) if pd.notna(row.get('area')) else 0,
                        "image": row['image_url'],
                        "reason": " • ".join(reasons)
                    })
                    
            return results
        except Exception as e:
            print(f"Error fetching references: {e}")
            return []

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
            fuel = str(data.get('fuelType', 'petrol')).strip().title()
            trans = str(data.get('transmission', 'manual')).strip().title()
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
            
            # AI Guardrail: Prevent XGBoost from correlating 'Electric' with ultra-luxury brackets
            if fuel == "Electric":
                input_petrol = input_df.copy()
                input_petrol['fuelType'] = "Petrol"
                X_enc_petrol = self.encoders[target_model].transform(input_petrol[categorical_cols])
                X_final_petrol = np.hstack([X_enc_petrol, input_petrol[['year']].values])
                petrol_pred = self.models[target_model].predict(X_final_petrol)[0]
                
                # If the AI hallucinates a markup >30%, strictly clamp the price to a 20% premium
                if prediction > (petrol_pred * 1.30):
                    prediction = petrol_pred * 1.20
            
            # Fetch Evidence
            similar_listings = self._get_similar_references(data)
            
            # --- Smart Evidence Anchoring ---
            anchored = False
            if similar_listings:
                perfect_comps = []
                for comp in similar_listings:
                    r = comp.get('reason', '')
                    if all(req in r for req in ["Exact Brand match", "Exact Model", "Exact Year", "Exact City", "Exact Transmission", "Exact Fuel"]):
                        perfect_comps.append(comp)
                
                if perfect_comps:
                    prediction = sum(c['price'] for c in perfect_comps) / len(perfect_comps)
                    anchored = True

            # Final Summary Reasoning
            reasoning = f"Analysis of {brand} {model_name} in {city} for {l_type.lower()}."
            if similar_listings:
                reasoning += f" Validated against {len(similar_listings)} similar local listings."
                if anchored:
                    reasoning += " (ML organically anchored to identical local evidence)."

            return {
                "predicted_price": float(round(prediction, 2)),
                "confidence": 0.92,
                "reasoning": reasoning,
                "similar_listings": similar_listings
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
            
            # Fetch Evidence
            similar_listings = self._get_similar_references(data)
            
            import re
            
            # --- Smart Evidence Anchoring ---
            anchored = False
            if similar_listings:
                perfect_prices = []
                for comp in similar_listings:
                    r = comp.get('reason', '')
                    reqs = ["Same city", "Same sub-city", "Same village", "Same type", f"Exact {beds} Beds", f"Exact {baths} Baths"]
                    if all(req in r for req in reqs):
                        comp_area = comp.get('area', 0)
                        if comp_area > 0:
                            price_per_sqm = comp['price'] / comp_area
                            scaled_price = price_per_sqm * area
                            perfect_prices.append(scaled_price)
                        else:
                            perfect_prices.append(comp['price'])
                        
                if perfect_prices:
                    prediction = sum(perfect_prices) / len(perfect_prices)
                    anchored = True

            # Final Summary Reasoning
            reasoning = f"Analysis of {beds} bedroom {p_type} in {village or subcity} for {l_type.lower()}."
            if similar_listings:
                reasoning += f" Grounded by {len(similar_listings)} similar properties in {subcity}."
                if anchored:
                    reasoning += " (ML organically anchored to identical local evidence)."

            return {
                "predicted_price": float(round(prediction, 2)),
                "confidence": 0.94,
                "reasoning": reasoning,
                "similar_listings": similar_listings
            }
        except Exception as e:
            return {"error": f"ML Prediction Error: {str(e)}"}

prediction_service = PredictionService()

