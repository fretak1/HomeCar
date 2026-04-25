import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(ref.watch(dioClientProvider).dio);
});

class PaymentRepository {
  PaymentRepository(this._dio);

  final Dio _dio;

  Future<String?> initializePayment(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(
        '${ApiPaths.payments}/initialize',
        data: data,
      );
      if (response.data['status'] == 'success') {
        return response.data['data']['checkout_url'] as String?;
      }
      return null;
    } catch (error) {
      throw Exception('Failed to initialize payment: $error');
    }
  }

  Future<Map<String, dynamic>> verifyPayment(String txRef) async {
    try {
      final response = await _dio.get('${ApiPaths.payments}/verify/$txRef');
      return Map<String, dynamic>.from(response.data as Map);
    } catch (error) {
      throw Exception('Failed to verify payment: $error');
    }
  }

  Future<List<dynamic>> getBanks() async {
    try {
      final response = await _dio.get('${ApiPaths.payments}/banks');
      return response.data['data'] as List<dynamic>? ?? [];
    } catch (error) {
      throw Exception('Failed to fetch banks: $error');
    }
  }

  Future<void> createSubaccount({
    required String userId,
    required String bankCode,
    required String accountNumber,
    required String accountName,
    String? businessName,
  }) async {
    try {
      await _dio.post(
        '${ApiPaths.payments}/subaccount',
        data: {
          'userId': userId,
          'bankCode': bankCode,
          'accountNumber': accountNumber,
          'accountName': accountName,
          if (businessName != null && businessName.trim().isNotEmpty)
            'businessName': businessName.trim(),
        },
      );
    } catch (error) {
      throw Exception('Failed to save payout details: $error');
    }
  }
}

