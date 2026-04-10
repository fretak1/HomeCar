class MaintenancePerson {
  const MaintenancePerson({
    required this.id,
    required this.name,
    this.profileImage,
  });

  final String id;
  final String name;
  final String? profileImage;

  factory MaintenancePerson.fromJson(Map<String, dynamic> json) {
    return MaintenancePerson(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'User',
      profileImage: json['profileImage']?.toString(),
    );
  }
}

class MaintenanceProperty {
  const MaintenanceProperty({
    required this.id,
    required this.title,
    this.images = const [],
  });

  final String id;
  final String title;
  final List<String> images;

  String get mainImage => images.isNotEmpty ? images.first : '';

  factory MaintenanceProperty.fromJson(Map<String, dynamic> json) {
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

    return MaintenanceProperty(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Listing',
      images: images,
    );
  }
}

class MaintenanceRequestModel {
  const MaintenanceRequestModel({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    required this.category,
    required this.description,
    required this.status,
    this.dateLabel,
    this.images = const [],
    this.property,
    this.customer,
    this.customerId,
  });

  final String id;
  final String propertyId;
  final String propertyTitle;
  final String category;
  final String description;
  final String status;
  final String? dateLabel;
  final List<String> images;
  final MaintenanceProperty? property;
  final MaintenancePerson? customer;
  final String? customerId;

  bool get isPending => status.toLowerCase() == 'pending';
  bool get isInProgress => status.toLowerCase() == 'inprogress';
  bool get isCompleted => status.toLowerCase() == 'completed';

  factory MaintenanceRequestModel.fromJson(Map<String, dynamic> json) {
    final images = <String>[];
    final rawImages = json['images'];
    if (rawImages is List) {
      images.addAll(rawImages.map((item) => item.toString()));
    } else if (json['image'] != null) {
      images.add(json['image'].toString());
    }

    return MaintenanceRequestModel(
      id: json['id']?.toString() ?? '',
      propertyId: json['propertyId']?.toString() ?? '',
      propertyTitle: json['propertyTitle']?.toString() ?? 'Listing',
      category: json['category']?.toString() ?? 'OTHER',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      dateLabel: json['date']?.toString(),
      images: images,
      property: json['property'] is Map
          ? MaintenanceProperty.fromJson(
              Map<String, dynamic>.from(json['property'] as Map),
            )
          : null,
      customer: json['customer'] is Map
          ? MaintenancePerson.fromJson(
              Map<String, dynamic>.from(json['customer'] as Map),
            )
          : null,
      customerId: json['customerId']?.toString(),
    );
  }
}
