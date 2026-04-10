class TransactionParty {
  const TransactionParty({
    required this.id,
    required this.name,
    this.email,
    this.profileImage,
  });

  final String id;
  final String name;
  final String? email;
  final String? profileImage;

  factory TransactionParty.fromJson(Map<String, dynamic> json) {
    return TransactionParty(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'User',
      email: json['email']?.toString(),
      profileImage: json['profileImage']?.toString(),
    );
  }
}

class TransactionPropertySummary {
  const TransactionPropertySummary({
    required this.id,
    required this.title,
    this.assetType = 'HOME',
    this.city,
    this.subcity,
  });

  final String id;
  final String title;
  final String assetType;
  final String? city;
  final String? subcity;

  String get locationLabel {
    final parts = [subcity, city]
        .where((value) => value?.trim().isNotEmpty ?? false)
        .cast<String>()
        .toList();
    return parts.isEmpty ? 'Unknown location' : parts.join(', ');
  }

  factory TransactionPropertySummary.fromJson(Map<String, dynamic> json) {
    final location = json['location'] is Map
        ? Map<String, dynamic>.from(json['location'] as Map)
        : null;
    return TransactionPropertySummary(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Listing',
      assetType: json['assetType']?.toString() ?? 'HOME',
      city: location?['city']?.toString(),
      subcity: location?['subcity']?.toString(),
    );
  }
}

class TransactionModel {
  const TransactionModel({
    required this.id,
    required this.amount,
    required this.status,
    required this.type,
    required this.createdAt,
    this.currency = 'ETB',
    this.chapaReference,
    this.leaseId,
    this.propertyId,
    this.metadata,
    this.payer,
    this.payee,
    this.property,
  });

  final String id;
  final double amount;
  final String currency;
  final String status;
  final String type;
  final DateTime createdAt;
  final String? chapaReference;
  final String? leaseId;
  final String? propertyId;
  final Map<String, dynamic>? metadata;
  final TransactionParty? payer;
  final TransactionParty? payee;
  final TransactionPropertySummary? property;

  bool get isCompleted => status.toUpperCase() == 'COMPLETED';

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id']?.toString() ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      currency: json['currency']?.toString() ?? 'ETB',
      status: json['status']?.toString() ?? 'PENDING',
      type: json['type']?.toString() ?? 'FULL_PURCHASE',
      createdAt: json['createdAt'] is String
          ? DateTime.tryParse(json['createdAt'] as String)?.toLocal() ??
                DateTime.now()
          : DateTime.now(),
      chapaReference: json['chapaReference']?.toString(),
      leaseId: json['leaseId']?.toString(),
      propertyId: json['propertyId']?.toString(),
      metadata: json['metadata'] is Map
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : null,
      payer: json['payer'] is Map
          ? TransactionParty.fromJson(
              Map<String, dynamic>.from(json['payer'] as Map),
            )
          : null,
      payee: json['payee'] is Map
          ? TransactionParty.fromJson(
              Map<String, dynamic>.from(json['payee'] as Map),
            )
          : null,
      property: json['property'] is Map
          ? TransactionPropertySummary.fromJson(
              Map<String, dynamic>.from(json['property'] as Map),
            )
          : null,
    );
  }
}
