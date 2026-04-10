import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../../auth/models/user_model.dart';
import '../../listings/models/property_model.dart';

final adminRepositoryProvider = Provider<AdminRepository>((ref) {
  return AdminRepository(ref.watch(dioClientProvider).dio);
});

class AdminRepository {
  AdminRepository(this._dio);

  final Dio _dio;

  Future<List<UserModel>> getUsers() async {
    try {
      final response = await _dio.get(ApiPaths.users);
      final data = response.data;
      if (data is! List) {
        return const [];
      }

      return data
          .whereType<Map>()
          .map((item) => UserModel.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load users.'));
    }
  }

  Future<UserModel> getUserById(String userId) async {
    try {
      final response = await _dio.get('${ApiPaths.users}/$userId');
      return UserModel.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load user details.'));
    }
  }

  Future<PropertyModel> getPropertyById(String propertyId) async {
    try {
      final response = await _dio.get('${ApiPaths.properties}/$propertyId');
      return PropertyModel.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load property details.'));
    }
  }

  Future<String> getPropertyDocumentDataUri(String docId) async {
    try {
      final response = await _dio.get(
        '${ApiPaths.properties}/document/$docId/view',
      );
      final data = response.data;
      if (data is Map && data['dataUri'] != null) {
        return data['dataUri'].toString();
      }
      throw Exception('Document bundle missing.');
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load document preview.'));
    }
  }

  Future<String> getPropertyDocumentSignedUrl(String docId) async {
    try {
      final response = await _dio.get(
        '${ApiPaths.properties}/document/$docId/signed-url',
      );
      final data = response.data;
      if (data is Map && data['signedUrl'] != null) {
        return data['signedUrl'].toString();
      }
      throw Exception('Signed URL missing.');
    } on DioException catch (error) {
      throw Exception(
        _extractError(error, 'Failed to generate document link.'),
      );
    }
  }

  Future<void> verifyUser({
    required String userId,
    required bool verified,
    String? rejectionReason,
  }) async {
    try {
      await _dio.patch(
        '${ApiPaths.users}/$userId/verify',
        data: {
          'verified': verified,
          if (!verified &&
              rejectionReason != null &&
              rejectionReason.trim().isNotEmpty)
            'rejectionReason': rejectionReason.trim(),
        },
      );
    } on DioException catch (error) {
      throw Exception(
        _extractError(error, 'Failed to update user verification.'),
      );
    }
  }

  Future<void> verifyProperty({
    required String propertyId,
    required bool isVerified,
    String? rejectionReason,
  }) async {
    try {
      await _dio.patch(
        '${ApiPaths.properties}/$propertyId/verify',
        data: {
          'isVerified': isVerified,
          if (!isVerified &&
              rejectionReason != null &&
              rejectionReason.trim().isNotEmpty)
            'rejectionReason': rejectionReason.trim(),
        },
      );
    } on DioException catch (error) {
      throw Exception(
        _extractError(error, 'Failed to update property verification.'),
      );
    }
  }

  String _extractError(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map && data['error'] != null) {
      return data['error'].toString();
    }
    return fallback;
  }
}
