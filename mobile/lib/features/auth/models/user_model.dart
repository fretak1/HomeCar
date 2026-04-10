class UserDocument {
  const UserDocument({
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

  factory UserDocument.fromJson(Map<String, dynamic> json) {
    return UserDocument(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'DOCUMENT',
      url: json['url']?.toString() ?? '',
      verified: json['verified'] == true,
    );
  }
}

class UserModel {
  final String id;
  final String name;
  final String email;
  final String role; // 'CUSTOMER', 'OWNER', 'AGENT', 'ADMIN'
  final String? profileImage;
  final String? phoneNumber;
  final bool emailVerified;
  final bool verified;
  final String? rejectionReason;
  final String? chapaSubaccountId;
  final String? payoutBankCode;
  final String? payoutAccountNumber;
  final String? payoutAccountName;
  final String? verificationPhoto;
  final DateTime? createdAt;
  final List<UserDocument> documents;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.profileImage,
    this.phoneNumber,
    this.emailVerified = false,
    this.verified = false,
    this.rejectionReason,
    this.chapaSubaccountId,
    this.payoutBankCode,
    this.payoutAccountNumber,
    this.payoutAccountName,
    this.verificationPhoto,
    this.createdAt,
    this.documents = const [],
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final documents = <UserDocument>[];
    final rawDocuments = json['documents'];
    if (rawDocuments is List) {
      for (final item in rawDocuments) {
        if (item is Map) {
          documents.add(UserDocument.fromJson(Map<String, dynamic>.from(item)));
        }
      }
    }

    return UserModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'CUSTOMER',
      profileImage: json['profileImage'],
      phoneNumber: json['phoneNumber'],
      emailVerified: json['emailVerified'] ?? false,
      verified: json['verified'] ?? false,
      rejectionReason: json['rejectionReason']?.toString(),
      chapaSubaccountId: json['chapaSubaccountId']?.toString(),
      payoutBankCode: json['payoutBankCode']?.toString(),
      payoutAccountNumber: json['payoutAccountNumber']?.toString(),
      payoutAccountName: json['payoutAccountName']?.toString(),
      verificationPhoto: json['verificationPhoto']?.toString(),
      createdAt: json['createdAt'] is String
          ? DateTime.tryParse(json['createdAt'] as String)?.toLocal()
          : null,
      documents: documents,
    );
  }

  bool get isAdmin => role.toUpperCase() == 'ADMIN';
  bool get isCustomer => role.toUpperCase() == 'CUSTOMER';
  bool get isOwner => role.toUpperCase() == 'OWNER';
  bool get isAgent => role.toUpperCase() == 'AGENT';
  bool get isOwnerOrAgent =>
      role.toUpperCase() == 'OWNER' || role.toUpperCase() == 'AGENT';
  bool get isAgentVerificationPending =>
      isAgent &&
      !verified &&
      rejectionReason == null &&
      verificationPhoto != null &&
      verificationPhoto!.isNotEmpty;
  bool get isAgentVerificationRejected =>
      isAgent &&
      !verified &&
      rejectionReason != null &&
      rejectionReason!.trim().isNotEmpty;

  UserDocument? get licenseDocument {
    for (final document in documents) {
      if (document.type.toUpperCase() == 'AGENT_LICENSE' &&
          document.url.isNotEmpty) {
        return document;
      }
    }
    return null;
  }
}
