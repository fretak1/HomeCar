import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../models/review_model.dart';

final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  return ReviewRepository(ref.watch(dioClientProvider).dio);
});

class ReviewRepository {
  ReviewRepository(this._dio);

  final Dio _dio;

  Future<List<ReviewModel>> getReviews(String propertyId) async {
    try {
      final response = await _dio.get(
        '${ApiPaths.reviews}/property/$propertyId',
      );
      final data = response.data;
      if (data is! List) {
        return const [];
      }

      return data
          .whereType<Map>()
          .map((item) => ReviewModel.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load reviews.'));
    }
  }

  Future<void> submitReview({
    required String propertyId,
    required int rating,
    String? comment,
  }) async {
    try {
      await _dio.post(
        ApiPaths.reviews,
        data: {
          'propertyId': propertyId,
          'rating': rating,
          if (comment != null) 'comment': comment,
        },
      );
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to submit review.'));
    }
  }

  Future<void> deleteReview(String reviewId) async {
    try {
      await _dio.delete('${ApiPaths.reviews}/$reviewId');
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to delete review.'));
    }
  }

  String _extractError(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'] ?? data['error'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
    }
    return fallback;
  }
}

