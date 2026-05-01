from pydantic import BaseModel
from typing import Optional, List, Dict

class PredictionRequest(BaseModel):
    brand: str
    model: str
    year: int
    mileage: float
    fuelType: str
    transmission: str
    listingType: str  # This is RENT/BUY in the form
    city: str
    subcity: str
    region: str
    village: str
    amenities: Optional[List[str]] = []

class HousePredictionRequest(BaseModel):
    city: str
    subcity: str
    region: str
    village: str
    listingType: str  # This is RENT/BUY in the form
    propertyType: str
    area: float
    bedrooms: int
    bathrooms: Optional[int] = 1
    amenities: Optional[List[str]] = []

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class SimilarListing(BaseModel):
    id: str
    title: str
    price: float
    image: Optional[str] = None
    reason: str

class PredictionResponse(BaseModel):
    predicted_price: float
    currency: str
    confidence: float
    method: str
    reasoning: Optional[str] = None
    similar_listings: Optional[List[SimilarListing]] = []

class HousePredictionResponse(BaseModel):
    predicted_price: float
    currency: str
    confidence: float
    method: str
    reasoning: Optional[str] = None
    similar_listings: Optional[List[SimilarListing]] = []

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
    userId: Optional[str] = None
    history: Optional[List[InteractionHistory]] = None
    limit: int = 15
