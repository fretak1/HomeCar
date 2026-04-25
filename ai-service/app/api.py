from fastapi import APIRouter, HTTPException, BackgroundTasks
import asyncio
import train_model
from app.schemas.prediction import (
    PredictionRequest, PredictionResponse,
    HousePredictionRequest, HousePredictionResponse,
    RecommendationRequest, ChatRequest
)
from app.services.recommendation import recommendation_service
from app.services.assistant import assistant
from app.services.prediction_service import prediction_service
from scripts.train_recommendation import train_model as train_rec_model
from app.database import query_to_dataframe
import os
import sys

router = APIRouter()

@router.post("/predict-price", response_model=PredictionResponse)
async def predict_price(request: PredictionRequest):
    result = prediction_service.predict_car(data=request.dict())
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return {
        "predicted_price": result["predicted_price"],
        "currency": "ETB",
        "confidence": result["confidence"],
        "method": "PURE_XGBOOST_ML",
        "reasoning": result["reasoning"],
        "similar_listings": result.get("similar_listings", [])
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
        "reasoning": result["reasoning"],
        "similar_listings": result.get("similar_listings", [])
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

is_training = False

@router.post("/retrain")
async def trigger_retrain(background_tasks: BackgroundTasks):
    global is_training
    if is_training:
        return {"status": "busy", "message": "Training is already in progress."}
    
    def run_training_task():
        global is_training
        try:
            is_training = True
            train_model.train_and_save()
            prediction_service.reload_models()
            print("[AI] Price Prediction retraining completed.")
        except Exception as e:
            print(f"[AI] Error during price training: {e}")
        finally:
            is_training = False

    background_tasks.add_task(run_training_task)
    return {"status": "success", "message": "Price model retraining started."}

@router.post("/recommendations/train")
async def trigger_rec_train(background_tasks: BackgroundTasks):
    global is_training
    if is_training:
        return {"status": "busy", "message": "Another training task is in progress."}
    
    def run_rec_training_task():
        global is_training
        try:
            is_training = True
            train_rec_model() # This is from scripts/train_recommendation.py
            recommendation_service.reload_model()
            print("[AI] Recommendation Engine retraining completed.")
        except Exception as e:
            print(f"[AI] Error during recommendation training: {e}")
        finally:
            is_training = False

    background_tasks.add_task(run_rec_training_task)
    return {"status": "success", "message": "Recommendation model training started."}
