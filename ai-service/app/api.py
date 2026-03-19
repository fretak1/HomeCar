from fastapi import APIRouter, HTTPException
from app.schemas.prediction import (
    PredictionRequest, PredictionResponse,
    HousePredictionRequest, HousePredictionResponse,
    RecommendationRequest, ChatRequest
)
from app.services.recommendation import recommendation_service
from app.services.assistant import assistant
from app.services.prediction_service import prediction_service
from app.database import query_to_dataframe
import os
import sys

router = APIRouter()

@router.post("/predict-price", response_model=PredictionResponse)
async def predict_price(request: PredictionRequest):
    # Pure Machine Learning Approach: No database search needed
    result = prediction_service.predict_car(data=request.dict())
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return {
        "predicted_price": result["predicted_price"],
        "currency": "ETB",
        "confidence": result["confidence"],
        "method": "PURE_XGBOOST_ML",
        "reasoning": result["reasoning"]
    }

@router.post("/predict-house-price", response_model=HousePredictionResponse)
async def predict_house_price(request: HousePredictionRequest):
    # Pure Machine Learning Approach: No database search needed
    result = prediction_service.predict_house(data=request.dict())
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return {
        "predicted_price": result["predicted_price"],
        "currency": "ETB",
        "confidence": result["confidence"],
        "method": "PURE_XGBOOST_ML",
        "reasoning": result["reasoning"]
    }

@router.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    if request.history:
        recommendations = recommendation_service.get_recommendations(request.history, limit=request.limit)
    else:
        recommendations = recommendation_service.get_recommendations_for_user(request.userId, limit=request.limit)
    return {"userId": request.userId, "recommendations": recommendations}

@router.post("/recommendations/explain")
async def explain_recommendations(request: RecommendationRequest):
    try:
        explanation = recommendation_service.explain_recommendations(request.userId)
        return {"status": "success", "explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_with_assistant(request: ChatRequest):
    try:
        response = await assistant.get_response(request.message, request.history)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
