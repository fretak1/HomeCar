import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../models/lease_model.dart';

final leaseRepositoryProvider = Provider<LeaseRepository>((ref) {
  return LeaseRepository(ref.watch(dioClientProvider).dio);
});

class LeaseRepository {
  LeaseRepository(this._dio);

  final Dio _dio;

  Future<List<LeaseModel>> getLeases() async {
    try {
      final response = await _dio.get(ApiPaths.leases);
      final data = response.data;
      if (data is! List) {
        return const [];
      }

      return data
          .whereType<Map>()
          .map((item) => LeaseModel.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load leases.'));
    }
  }

  Future<void> acceptLease({
    required String leaseId,
    required String role,
  }) async {
    try {
      await _dio.post(
        '${ApiPaths.leases}/$leaseId/accept',
        data: {'role': role},
      );
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to accept lease.'));
    }
  }

  Future<void> createLease({
    required String leaseType,
    required String startDate,
    required String endDate,
    required double totalPrice,
    double? recurringAmount,
    required String terms,
    required String propertyId,
    required String customerId,
    required String ownerId,
  }) async {
    try {
      await _dio.post(
        ApiPaths.leases,
        data: {
          'leaseType': leaseType,
          'startDate': startDate,
          'endDate': endDate,
          'totalPrice': totalPrice,
          if (recurringAmount != null) 'recurringAmount': recurringAmount,
          'terms': terms,
          'propertyId': propertyId,
          'customerId': customerId,
          'tenantId': customerId,
          'ownerId': ownerId,
        },
      );
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to create lease.'));
    }
  }

  Future<void> requestCancellation({
    required String leaseId,
    required String role,
  }) async {
    try {
      await _dio.post(
        '${ApiPaths.leases}/$leaseId/cancel',
        data: {'role': role},
      );
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to update cancellation.'));
    }
  }

  Future<String?> downloadContract(String leaseId) async {
    try {
      final response = await _dio.get('${ApiPaths.leases}/$leaseId/contract');
      final data = response.data;
      if (data is Map && data['dataUri'] != null) {
        return data['dataUri'].toString();
      }
      return null;
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load lease agreement.'));
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
