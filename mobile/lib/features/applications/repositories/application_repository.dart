import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../models/application_model.dart';

final applicationRepositoryProvider = Provider<ApplicationRepository>((ref) {
  return ApplicationRepository(ref.watch(dioClientProvider).dio);
});

class ApplicationRepository {
  ApplicationRepository(this._dio);

  final Dio _dio;

  Future<List<PropertyApplication>> getApplications({
    String? customerId,
    String? managerId,
  }) async {
    try {
      final response = await _dio.get(
        ApiPaths.applications,
        queryParameters: {
          if (customerId != null && customerId.isNotEmpty)
            'customerId': customerId,
          if (managerId != null && managerId.isNotEmpty) 'managerId': managerId,
        },
      );

      final data = response.data;
      if (data is! List) {
        return const [];
      }

      return data
          .whereType<Map>()
          .map(
            (item) =>
                PropertyApplication.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList();
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load applications.'));
    }
  }

  Future<void> submitApplication({
    required String propertyId,
    String? message,
  }) async {
    try {
      await _dio.post(
        ApiPaths.applications,
        data: {'propertyId': propertyId, 'message': message?.trim()},
      );
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to submit application.'));
    }
  }

  Future<void> updateApplicationStatus({
    required String applicationId,
    required String status,
  }) async {
    try {
      await _dio.patch(
        '${ApiPaths.applications}/$applicationId',
        data: {'status': status},
      );
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to update application.'));
    }
  }

  String _extractError(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map && data['error'] != null) {
      return data['error'].toString();
    }

    if (data is Map && data['message'] != null) {
      return data['message'].toString();
    }

    return fallback;
  }
}

