import 'package:flutter_riverpod/flutter_riverpod.dart';

class FilterState {
  // Shared
  final String listingType; // 'any', 'rent', 'buy'
  final String region;
  final String city;
  final String subCity;
  final String village;
  final double? priceMin;
  final double? priceMax;
  final List<String> amenities;

  // HOME specific
  final String propertyType; // 'any', 'Villa', 'Apartment', etc.
  final String beds; // 'any', '1', '2', '3', '4+'
  final String baths; // 'any', '1', '2', '3+'

  // CAR specific
  final String brand; // 'any', 'Toyota', etc.
  final String fuelType; // 'any', 'Petrol', 'Diesel', 'Electric', 'Hybrid'
  final String transmission; // 'any', 'Automatic', 'Manual'
  final int yearMin;
  final int yearMax;
  final double? mileageMax;

  const FilterState({
    this.listingType = 'any',
    this.region = '',
    this.city = '',
    this.subCity = '',
    this.village = '',
    this.priceMin,
    this.priceMax,
    this.amenities = const [],
    this.propertyType = 'any',
    this.beds = 'any',
    this.baths = 'any',
    this.brand = 'any',
    this.fuelType = 'any',
    this.transmission = 'any',
    this.yearMin = 1990,
    this.yearMax = 2025,
    this.mileageMax,
  });

  FilterState copyWith({
    String? listingType,
    String? region,
    String? city,
    String? subCity,
    String? village,
    double? priceMin,
    double? priceMax,
    List<String>? amenities,
    String? propertyType,
    String? beds,
    String? baths,
    String? brand,
    String? fuelType,
    String? transmission,
    int? yearMin,
    int? yearMax,
    double? mileageMax,
    bool clearPriceMin = false,
    bool clearPriceMax = false,
    bool clearMileage = false,
  }) {
    return FilterState(
      listingType: listingType ?? this.listingType,
      region: region ?? this.region,
      city: city ?? this.city,
      subCity: subCity ?? this.subCity,
      village: village ?? this.village,
      priceMin: clearPriceMin ? null : (priceMin ?? this.priceMin),
      priceMax: clearPriceMax ? null : (priceMax ?? this.priceMax),
      amenities: amenities ?? this.amenities,
      propertyType: propertyType ?? this.propertyType,
      beds: beds ?? this.beds,
      baths: baths ?? this.baths,
      brand: brand ?? this.brand,
      fuelType: fuelType ?? this.fuelType,
      transmission: transmission ?? this.transmission,
      yearMin: yearMin ?? this.yearMin,
      yearMax: yearMax ?? this.yearMax,
      mileageMax: clearMileage ? null : (mileageMax ?? this.mileageMax),
    );
  }

  static const FilterState empty = FilterState();

  Map<String, dynamic> toApiParams(String searchType) {
    final params = <String, dynamic>{};
    if (region.isNotEmpty) params['region'] = region;
    if (city.isNotEmpty) params['city'] = city;
    if (subCity.isNotEmpty) params['subCity'] = subCity;
    if (village.isNotEmpty) params['village'] = village;
    if (listingType != 'any') params['listingType'] = listingType;
    if (priceMin != null) params['priceMin'] = priceMin;
    if (priceMax != null) params['priceMax'] = priceMax;

    if (searchType == 'HOME') {
      if (propertyType != 'any') params['propertyType'] = propertyType;
      if (beds != 'any') params['beds'] = beds;
      if (baths != 'any') params['baths'] = baths;
      if (amenities.isNotEmpty) params['amenities'] = amenities.join(',');
    } else {
      if (brand != 'any') params['brand'] = brand;
      if (fuelType != 'any') params['fuelType'] = fuelType;
      if (transmission != 'any') params['transmission'] = transmission;
      params['yearMin'] = yearMin;
      params['yearMax'] = yearMax;
      if (mileageMax != null) params['mileageMax'] = mileageMax;
      if (amenities.isNotEmpty) params['amenities'] = amenities.join(',');
    }
    return params;
  }
}

class FilterNotifier extends StateNotifier<FilterState> {
  FilterNotifier() : super(const FilterState());

  void update(FilterState Function(FilterState) updater) {
    state = updater(state);
  }

  void reset() {
    state = const FilterState();
  }

  void toggleAmenity(String amenity) {
    final updated = List<String>.from(state.amenities);
    if (updated.contains(amenity)) {
      updated.remove(amenity);
    } else {
      updated.add(amenity);
    }
    state = state.copyWith(amenities: updated);
  }
}

final filterProvider = StateNotifierProvider<FilterNotifier, FilterState>(
  (ref) => FilterNotifier(),
);

