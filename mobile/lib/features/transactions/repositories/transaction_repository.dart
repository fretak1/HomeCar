import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../models/transaction_model.dart';

final transactionRepositoryProvider = Provider<TransactionRepository>((ref) {
  return TransactionRepository(ref.watch(dioClientProvider).dio);
});

class TransactionRepository {
  TransactionRepository(this._dio);

  final Dio _dio;

  Future<List<TransactionModel>> getTransactions() async {
    try {
      final response = await _dio.get(ApiPaths.transactions);
      final data = response.data;
      if (data is! List) {
        return const [];
      }

      return data
          .whereType<Map>()
          .map(
            (item) =>
                TransactionModel.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList();
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load transactions.'));
    }
  }

  Future<String?> downloadReceipt(String transactionId) async {
    try {
      final response = await _dio.get(
        '${ApiPaths.transactions}/$transactionId/download',
      );
      final data = response.data;
      if (data is Map && data['dataUri'] != null) {
        return data['dataUri'].toString();
      }
      return null;
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load receipt.'));
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

