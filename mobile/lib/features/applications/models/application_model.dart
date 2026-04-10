class PropertyApplication {
  const PropertyApplication({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    required this.propertyLocation,
    required this.status,
    required this.price,
    required this.listingType,
    required this.assetType,
    required this.customerId,
    required this.managerId,
    this.propertyImage,
    this.message,
    this.dateLabel,
    this.managerName,
    this.managerEmail,
    this.managerProfileImage,
    this.managerChapaSubaccountId,
    this.customerName,
    this.customerEmail,
    this.customerProfileImage,
  });

  final String id;
  final String propertyId;
  final String propertyTitle;
  final String? propertyImage;
  final String propertyLocation;
  final String status;
  final String? message;
  final String? dateLabel;
  final double price;
  final String listingType;
  final String assetType;
  final String customerId;
  final String managerId;
  final String? managerName;
  final String? managerEmail;
  final String? managerProfileImage;
  final String? managerChapaSubaccountId;
  final String? customerName;
  final String? customerEmail;
  final String? customerProfileImage;

  bool get isPending => status.toLowerCase() == 'pending';
  bool get isAccepted => status.toLowerCase() == 'accepted';
  bool get isRejected => status.toLowerCase() == 'rejected';

  String get listingLabel {
    final normalized = listingType.replaceAll('_', ' ').trim().toLowerCase();
    if (normalized.isEmpty) {
      return assetType.toUpperCase() == 'CAR'
          ? 'Vehicle inquiry'
          : 'Listing inquiry';
    }

    return normalized[0].toUpperCase() + normalized.substring(1);
  }

  factory PropertyApplication.fromJson(Map<String, dynamic> json) {
    final manager = json['manager'] is Map<String, dynamic>
        ? json['manager'] as Map<String, dynamic>
        : (json['manager'] is Map
              ? Map<String, dynamic>.from(json['manager'] as Map)
              : null);
    final customer = json['customer'] is Map<String, dynamic>
        ? json['customer'] as Map<String, dynamic>
        : (json['customer'] is Map
              ? Map<String, dynamic>.from(json['customer'] as Map)
              : null);

    return PropertyApplication(
      id: json['id']?.toString() ?? '',
      propertyId: json['propertyId']?.toString() ?? '',
      propertyTitle: json['propertyTitle']?.toString() ?? 'Listing',
      propertyImage: json['propertyImage']?.toString(),
      propertyLocation:
          json['propertyLocation']?.toString() ?? 'Unknown location',
      status: json['status']?.toString() ?? 'pending',
      message: json['message']?.toString(),
      dateLabel: json['date']?.toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0,
      listingType: json['listingType']?.toString() ?? '',
      assetType: json['assetType']?.toString() ?? 'HOME',
      customerId: json['customerId']?.toString() ?? '',
      managerId: json['managerId']?.toString() ?? '',
      managerName: manager?['name']?.toString(),
      managerEmail: manager?['email']?.toString(),
      managerProfileImage: manager?['profileImage']?.toString(),
      managerChapaSubaccountId: manager?['chapaSubaccountId']?.toString(),
      customerName: customer?['name']?.toString(),
      customerEmail: customer?['email']?.toString(),
      customerProfileImage: customer?['profileImage']?.toString(),
    );
  }
}
