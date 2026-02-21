from fastapi import APIRouter, HTTPException
from app.schemas.prediction import (
    PredictionRequest, PredictionResponse, 
    HousePredictionRequest, HousePredictionResponse,
    RecommendationRequest
)
from app.services.recommendation import recommendation_service
import joblib
import pandas as pd
import os

router = APIRouter()

# Load models on startup
MODELS_DIR = "models"
CAR_MODEL_PATH = os.path.join(MODELS_DIR, "car_price_model.joblib")
HOUSE_MODEL_PATH = os.path.join(MODELS_DIR, "house_price_model.joblib")

car_model = None
house_model = None

if os.path.exists(CAR_MODEL_PATH):
    car_model = joblib.load(CAR_MODEL_PATH)
if os.path.exists(HOUSE_MODEL_PATH):
    house_model = joblib.load(HOUSE_MODEL_PATH)

@router.post("/predict-price", response_model=PredictionResponse)
async def predict_price(request: PredictionRequest):
    if not car_model:
        raise HTTPException(status_code=503, detail="Car prediction model not available")
    
    # Prepare data for model
    data = pd.DataFrame([{
        "brand": request.brand,
        "model": request.model,
        "year": request.year,
        "mileage": request.mileage,
        "condition": request.condition
    }])
    
    prediction = car_model.predict(data)[0]
    
    return {
        "predicted_price": round(max(0, prediction), 2),
        "currency": "USD",
        "confidence": 0.85
    }

@router.post("/predict-house-price", response_model=HousePredictionResponse)
async def predict_house_price(request: HousePredictionRequest):
    if not house_model:
        raise HTTPException(status_code=503, detail="House prediction model not available")
    
    # Prepare data for model
    data = pd.DataFrame([{
        "location": request.location,
        "propertyType": request.propertyType,
        "area": request.area,
        "bedrooms": request.bedrooms,
        "bathrooms": request.bathrooms
    }])
    
    prediction = house_model.predict(data)[0]
    
    return {
        "predicted_price": round(max(0, prediction), 2),
        "currency": "USD",
        "confidence": 0.90
    }

@router.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    recommendations = recommendation_service.get_recommendations(request.history, limit=request.limit)
    return {
        "userId": request.userId,
        "recommendations": recommendations
    }

@router.get("/recommendations/{user_id}")
async def get_recommendations_placeholder(user_id: str):
    # Backward compatibility for the simple GET request
    return {
        "user_id": user_id,
        "recommendations": [
            {"id": "car_1", "category": "CAR", "name": "Tesla Model 3", "score": 0.95},
            {"id": "house_1", "category": "HOME", "name": "Modern Downtown Apartment", "score": 0.88}
        ]
    }
