import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../models/maintenance_request_model.dart';

final maintenanceRepositoryProvider = Provider<MaintenanceRepository>((ref) {
  return MaintenanceRepository(ref.watch(dioClientProvider).dio);
});

class MaintenanceRepository {
  MaintenanceRepository(this._dio);

  final Dio _dio;

  Future<List<MaintenanceRequestModel>> getRequests() async {
    try {
      final response = await _dio.get(ApiPaths.maintenance);
      final data = response.data;
      if (data is! List) {
        return const [];
      }

      return data
          .whereType<Map>()
          .map(
            (item) => MaintenanceRequestModel.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw Exception(
        _extractError(error, 'Failed to load maintenance requests.'),
      );
    }
  }

  Future<void> createRequest({
    required String propertyId,
    required String category,
    required String description,
    List<String> images = const [],
  }) async {
    try {
      await _dio.post(
        ApiPaths.maintenance,
        data: {
          'propertyId': propertyId,
          'category': category,
          'description': description,
          'images': images,
        },
      );
    } on DioException catch (error) {
      throw Exception(
        _extractError(error, 'Failed to create maintenance request.'),
      );
    }
  }

  Future<void> updateStatus({
    required String requestId,
    required String status,
  }) async {
    try {
      await _dio.patch(
        '${ApiPaths.maintenance}/$requestId',
        data: {'status': status},
      );
    } on DioException catch (error) {
      throw Exception(
        _extractError(error, 'Failed to update maintenance request.'),
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

