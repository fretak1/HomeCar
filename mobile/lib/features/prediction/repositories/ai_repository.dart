import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/ai_dio_client.dart';
import '../../listings/models/property_model.dart';
import '../models/prediction_model.dart';

class AiRepository {
  final AiDioClient _client;

  AiRepository(this._client);

  Future<PredictionResponse> predictCarPrice(
    CarPredictionRequest request,
  ) async {
    final response = await _client.dio.post(
      '/predict-price',
      data: request.toJson(),
    );
    return PredictionResponse.fromJson(response.data);
  }

  Future<PredictionResponse> predictHousePrice(
    HousePredictionRequest request,
  ) async {
    final response = await _client.dio.post(
      '/predict-house-price',
      data: request.toJson(),
    );
    return PredictionResponse.fromJson(response.data);
  }

  Future<List<PropertyModel>> getRecommendations({
    String? userId,
    List<String>? history,
    int limit = 10,
  }) async {
    final response = await _client.dio.post(
      '/recommendations',
      data: {'userId': userId, 'history': history, 'limit': limit},
    );

    final List<dynamic> data = response.data['recommendations'] ?? [];
    return data.map((json) => PropertyModel.fromJson(json)).toList();
  }

  Future<String> explainRecommendation(String userId) async {
    final explanation = await getExplanationData(userId);
    if (explanation is String) {
      return explanation;
    }
    return const JsonEncoder.withIndent('  ').convert(explanation);
  }

  Future<dynamic> getExplanationData(String userId) async {
    final response = await _client.dio.post(
      '/recommendations/explain',
      data: {'userId': userId},
    );
    return response.data['explanation'];
  }

  Future<String> sendAssistantMessage({
    required String message,
    List<Map<String, String>> history = const [],
  }) async {
    final response = await _client.dio.post(
      '/chat',
      data: {'message': message, 'history': history},
    );
    return response.data['response']?.toString() ??
        "I'm sorry, I couldn't generate a response right now.";
  }
}

final aiRepositoryProvider = Provider<AiRepository>((ref) {
  return AiRepository(ref.watch(aiDioClientProvider));
});

