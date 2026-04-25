class ReviewAuthor {
  const ReviewAuthor({required this.id, required this.name, this.profileImage});

  final String id;
  final String name;
  final String? profileImage;

  factory ReviewAuthor.fromJson(Map<String, dynamic> json) {
    return ReviewAuthor(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'User',
      profileImage: json['profileImage']?.toString(),
    );
  }
}

class ReviewModel {
  const ReviewModel({
    required this.id,
    required this.propertyId,
    required this.reviewerId,
    required this.rating,
    this.comment,
    this.author,
    this.createdAt,
  });

  final String id;
  final String propertyId;
  final String reviewerId;
  final int rating;
  final String? comment;
  final ReviewAuthor? author;
  final DateTime? createdAt;

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['id']?.toString() ?? '',
      propertyId: json['propertyId']?.toString() ?? '',
      reviewerId: json['reviewerId']?.toString() ?? '',
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      comment: json['comment']?.toString(),
      author: json['reviewer'] is Map
          ? ReviewAuthor.fromJson(
              Map<String, dynamic>.from(json['reviewer'] as Map),
            )
          : null,
      createdAt: json['createdAt'] is String
          ? DateTime.tryParse(json['createdAt'] as String)?.toLocal()
          : null,
    );
  }
}

