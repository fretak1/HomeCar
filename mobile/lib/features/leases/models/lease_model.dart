class LeaseParticipant {
  const LeaseParticipant({
    required this.id,
    required this.name,
    this.profileImage,
    this.chapaSubaccountId,
  });

  final String id;
  final String name;
  final String? profileImage;
  final String? chapaSubaccountId;

  factory LeaseParticipant.fromJson(Map<String, dynamic> json) {
    return LeaseParticipant(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'User',
      profileImage: json['profileImage']?.toString(),
      chapaSubaccountId: json['chapaSubaccountId']?.toString(),
    );
  }
}

class LeasePropertySummary {
  const LeasePropertySummary({
    required this.id,
    required this.title,
    this.assetType = 'HOME',
    this.images = const [],
    this.city,
    this.subcity,
    this.region,
  });

  final String id;
  final String title;
  final String assetType;
  final List<String> images;
  final String? city;
  final String? subcity;
  final String? region;

  String get mainImage => images.isNotEmpty ? images.first : '';

  String get locationLabel {
    final parts = [subcity, city, region]
        .where((value) => value?.trim().isNotEmpty ?? false)
        .cast<String>()
        .toList();
    return parts.isEmpty ? 'Unknown location' : parts.join(', ');
  }

  factory LeasePropertySummary.fromJson(Map<String, dynamic> json) {
    final images = <String>[];
    final rawImages = json['images'];
    if (rawImages is List) {
      for (final item in rawImages) {
        if (item is String) {
          images.add(item);
        } else if (item is Map) {
          final url = item['url']?.toString();
          if (url != null && url.isNotEmpty) {
            images.add(url);
          }
        }
      }
    }

    final location = json['location'] is Map
        ? Map<String, dynamic>.from(json['location'] as Map)
        : null;

    return LeasePropertySummary(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Listing',
      assetType: json['assetType']?.toString() ?? 'HOME',
      images: images,
      city: location?['city']?.toString(),
      subcity: location?['subcity']?.toString(),
      region: location?['region']?.toString(),
    );
  }
}

class LeaseModel {
  const LeaseModel({
    required this.id,
    required this.leaseType,
    required this.startDate,
    required this.endDate,
    required this.totalPrice,
    required this.status,
    required this.terms,
    required this.propertyId,
    required this.customerId,
    required this.ownerId,
    required this.ownerAccepted,
    required this.customerAccepted,
    this.recurringAmount,
    this.ownerCancelled = false,
    this.customerCancelled = false,
    this.property,
    this.customer,
    this.owner,
    this.createdAt,
  });

  final String id;
  final String leaseType;
  final DateTime startDate;
  final DateTime endDate;
  final double totalPrice;
  final double? recurringAmount;
  final String status;
  final String terms;
  final String propertyId;
  final String customerId;
  final String ownerId;
  final bool ownerAccepted;
  final bool customerAccepted;
  final bool ownerCancelled;
  final bool customerCancelled;
  final LeasePropertySummary? property;
  final LeaseParticipant? customer;
  final LeaseParticipant? owner;
  final DateTime? createdAt;

  bool get isPending => status.toUpperCase() == 'PENDING';
  bool get isActive => status.toUpperCase() == 'ACTIVE';
  bool get isCancellationPending =>
      status.toUpperCase() == 'CANCELLATION_PENDING';
  bool get isCancelled => status.toUpperCase() == 'CANCELLED';

  factory LeaseModel.fromJson(Map<String, dynamic> json) {
    return LeaseModel(
      id: json['id']?.toString() ?? '',
      leaseType: json['leaseType']?.toString() ?? 'LEASE',
      startDate: _parseDate(json['startDate']),
      endDate: _parseDate(json['endDate']),
      totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? 0,
      recurringAmount: (json['recurringAmount'] as num?)?.toDouble(),
      status: json['status']?.toString() ?? 'PENDING',
      terms: json['terms']?.toString() ?? '',
      propertyId: json['propertyId']?.toString() ?? '',
      customerId: json['customerId']?.toString() ?? '',
      ownerId: json['ownerId']?.toString() ?? '',
      ownerAccepted: json['ownerAccepted'] == true,
      customerAccepted: json['customerAccepted'] == true,
      ownerCancelled: json['ownerCancelled'] == true,
      customerCancelled: json['customerCancelled'] == true,
      property: json['property'] is Map
          ? LeasePropertySummary.fromJson(
              Map<String, dynamic>.from(json['property'] as Map),
            )
          : null,
      customer: json['customer'] is Map
          ? LeaseParticipant.fromJson(
              Map<String, dynamic>.from(json['customer'] as Map),
            )
          : null,
      owner: json['owner'] is Map
          ? LeaseParticipant.fromJson(
              Map<String, dynamic>.from(json['owner'] as Map),
            )
          : null,
      createdAt: json['createdAt'] is String
          ? DateTime.tryParse(json['createdAt'] as String)?.toLocal()
          : null,
    );
  }
}

DateTime _parseDate(dynamic value) {
  if (value is String) {
    final parsed = DateTime.tryParse(value);
    if (parsed != null) {
      return parsed.toLocal();
    }
  }
  return DateTime.now();
}
