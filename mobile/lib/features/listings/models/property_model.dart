class PropertyDocument {
  const PropertyDocument({
    required this.id,
    required this.type,
    required this.url,
    this.verified = false,
  });

  final String id;
  final String type;
  final String url;
  final bool verified;

  bool get isImage {
    final lower = url.toLowerCase();
    return lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.gif');
  }

  factory PropertyDocument.fromJson(Map<String, dynamic> json) {
    return PropertyDocument(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'DOCUMENT',
      url: json['url']?.toString() ?? '',
      verified: json['verified'] == true,
    );
  }
}

class PropertyOwner {
  const PropertyOwner({
    required this.id,
    required this.name,
    this.profileImage,
    this.role,
    this.chapaSubaccountId,
    this.verificationPhoto,
  });

  final String id;
  final String name;
  final String? profileImage;
  final String? role;
  final String? chapaSubaccountId;
  final String? verificationPhoto;

  factory PropertyOwner.fromJson(Map<String, dynamic> json) {
    return PropertyOwner(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown owner',
      profileImage: json['profileImage']?.toString(),
      role: json['role']?.toString(),
      chapaSubaccountId: json['chapaSubaccountId']?.toString(),
      verificationPhoto: json['verificationPhoto']?.toString(),
    );
  }
}

class PropertyModel {
  const PropertyModel({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.assetType,
    this.isVerified = false,
    this.brand,
    this.model,
    this.year,
    this.mileage,
    this.fuelType,
    this.transmission,
    this.propertyType,
    this.bedrooms,
    this.bathrooms,
    this.area,
    this.status,
    this.rating = 0,
    this.reviewCount = 0,
    this.listingTypes = const [],
    this.amenities = const [],
    this.images = const [],
    this.city,
    this.subcity,
    this.region,
    this.village,
    this.lat,
    this.lng,
    this.owner,
    this.rejectionReason,
    this.ownershipDocuments = const [],
    this.createdAt,
  });

  final String id;
  final String title;
  final String description;
  final double price;
  final String assetType;
  final bool isVerified;
  final String? brand;
  final String? model;
  final int? year;
  final double? mileage;
  final String? fuelType;
  final String? transmission;
  final String? propertyType;
  final int? bedrooms;
  final int? bathrooms;
  final double? area;
  final String? status;
  final double rating;
  final int reviewCount;
  final List<String> listingTypes;
  final List<String> amenities;
  final List<String> images;
  final String? city;
  final String? subcity;
  final String? region;
  final String? village;
  final double? lat;
  final double? lng;
  final PropertyOwner? owner;
  final String? rejectionReason;
  final List<PropertyDocument> ownershipDocuments;
  final DateTime? createdAt;

  bool get isHome => assetType.toUpperCase() == 'HOME';
  bool get isCar => assetType.toUpperCase() == 'CAR';

  String get mainImage => images.isNotEmpty ? images.first : '';

  String get locationLabel {
    final parts = [subcity, city, region]
        .where((part) => part?.trim().isNotEmpty ?? false)
        .cast<String>()
        .toList();
    return parts.isEmpty ? 'Unknown location' : parts.join(', ');
  }

  factory PropertyModel.fromJson(Map<String, dynamic> json) {
    final rawImages = json['images'];
    final imageUrls = <String>[];
    if (rawImages is List) {
      for (final item in rawImages) {
        if (item is String) {
          imageUrls.add(item);
        } else if (item is Map<String, dynamic>) {
          final url = item['url']?.toString();
          if (url != null && url.isNotEmpty) {
            imageUrls.add(url);
          }
        }
      }
    }

    final rawAmenities = json['amenities'];
    final amenities = <String>[];
    if (rawAmenities is List) {
      amenities.addAll(rawAmenities.map((item) => item.toString()));
    }

    final rawListingTypes = json['listingType'];
    final listingTypes = <String>[];
    if (rawListingTypes is List) {
      listingTypes.addAll(rawListingTypes.map((item) => item.toString()));
    } else if (rawListingTypes is String && rawListingTypes.isNotEmpty) {
      listingTypes.add(rawListingTypes);
    }

    final location = json['location'] as Map<String, dynamic>?;
    final ownershipDocuments = <PropertyDocument>[];
    final rawOwnershipDocuments = json['ownershipDocuments'];
    if (rawOwnershipDocuments is List) {
      for (final item in rawOwnershipDocuments) {
        if (item is Map) {
          ownershipDocuments.add(
            PropertyDocument.fromJson(Map<String, dynamic>.from(item)),
          );
        }
      }
    }

    return PropertyModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      assetType: json['assetType']?.toString() ?? 'HOME',
      isVerified: json['isVerified'] == true,
      brand: json['brand']?.toString(),
      model: json['model']?.toString(),
      year: (json['year'] as num?)?.toInt(),
      mileage: (json['mileage'] as num?)?.toDouble(),
      fuelType: json['fuelType']?.toString(),
      transmission: json['transmission']?.toString(),
      propertyType: json['propertyType']?.toString(),
      bedrooms: (json['bedrooms'] as num?)?.toInt(),
      bathrooms: (json['bathrooms'] as num?)?.toInt(),
      area: (json['area'] as num?)?.toDouble(),
      status: json['status']?.toString(),
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      listingTypes: listingTypes,
      amenities: amenities,
      images: imageUrls,
      city: location?['city']?.toString(),
      subcity: location?['subcity']?.toString(),
      region: location?['region']?.toString(),
      village: location?['village']?.toString(),
      lat: (location?['lat'] as num?)?.toDouble(),
      lng: (location?['lng'] as num?)?.toDouble(),
      owner: json['owner'] is Map<String, dynamic>
          ? PropertyOwner.fromJson(json['owner'] as Map<String, dynamic>)
          : null,
      rejectionReason: json['rejectionReason']?.toString(),
      ownershipDocuments: ownershipDocuments,
      createdAt: json['createdAt'] is String
          ? DateTime.tryParse(json['createdAt'] as String)?.toLocal()
          : null,
    );
  }
}
