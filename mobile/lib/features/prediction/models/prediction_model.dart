class HousePredictionRequest {
  final String city;
  final String subcity;
  final String region;
  final String village;
  final String listingType;
  final String propertyType;
  final double area;
  final int bedrooms;
  final int bathrooms;

  HousePredictionRequest({
    required this.city,
    required this.subcity,
    required this.region,
    required this.village,
    required this.listingType,
    required this.propertyType,
    required this.area,
    required this.bedrooms,
    required this.bathrooms,
  });

  Map<String, dynamic> toJson() => {
    'city': city,
    'subcity': subcity,
    'region': region,
    'village': village,
    'listingType': listingType,
    'propertyType': propertyType,
    'area': area,
    'bedrooms': bedrooms,
    'bathrooms': bathrooms,
  };
}

class CarPredictionRequest {
  final String brand;
  final String model;
  final int year;
  final double mileage;
  final String fuelType;
  final String transmission;
  final String listingType;
  final String city;
  final String subcity;
  final String region;
  final String village;

  CarPredictionRequest({
    required this.brand,
    required this.model,
    required this.year,
    required this.mileage,
    required this.fuelType,
    required this.transmission,
    required this.listingType,
    required this.city,
    required this.subcity,
    required this.region,
    required this.village,
  });

  Map<String, dynamic> toJson() => {
    'brand': brand,
    'model': model,
    'year': year,
    'mileage': mileage,
    'fuelType': fuelType,
    'transmission': transmission,
    'listingType': listingType,
    'city': city,
    'subcity': subcity,
    'region': region,
    'village': village,
  };
}

class PredictionResponse {
  final double? predictedPrice;
  final String currency;
  final double? confidence;
  final String? method;
  final String? reasoning;
  final List<dynamic>? similarListings;

  PredictionResponse({
    this.predictedPrice,
    required this.currency,
    this.confidence,
    this.method,
    this.reasoning,
    this.similarListings = const [],
  });

  factory PredictionResponse.fromJson(Map<String, dynamic> json) {
    return PredictionResponse(
      predictedPrice: (json['predicted_price'] as num?)?.toDouble(),
      currency: json['currency'] ?? 'ETB',
      confidence: (json['confidence'] as num?)?.toDouble(),
      method: json['method'],
      reasoning: json['reasoning'],
      similarListings: json['similar_listings'],
    );
  }
}
