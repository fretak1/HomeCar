from pydantic import BaseModel
from typing import Optional, List

class PredictionRequest(BaseModel):
    brand: str
    model: str
    year: int
    mileage: float
    condition: Optional[str] = "Good"

class HousePredictionRequest(BaseModel):
    location: str
    propertyType: str
    area: float
    bedrooms: int
    bathrooms: Optional[int] = 1

class PredictionResponse(BaseModel):
    predicted_price: float
    currency: str
    confidence: float

class HousePredictionResponse(BaseModel):
    predicted_price: float
    currency: str
    confidence: float

class InteractionHistory(BaseModel):
    propertyId: str
    assetType: str  # 'CAR' or 'HOME'
    brand: Optional[str] = None
    model: Optional[str] = None
    propertyType: Optional[str] = None
    location: Optional[str] = None
    area: Optional[float] = None
    price: Optional[float] = None

class RecommendationRequest(BaseModel):
    userId: str
    history: List[InteractionHistory]
    limit: Optional[int] = 10
