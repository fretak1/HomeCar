import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';

final interactionRepositoryProvider = Provider<InteractionRepository>((ref) {
  return InteractionRepository(ref.watch(dioClientProvider).dio);
});

class InteractionRepository {
  InteractionRepository(this._dio);

  final Dio _dio;

  Future<void> logSearchFilter({
    required String userId,
    required String searchType,
    required Map<String, dynamic> filters,
  }) async {
    try {
      await _dio.post(
        '${ApiPaths.interactions}/search',
        data: {'userId': userId, 'searchType': searchType, 'filters': filters},
      );
    } catch (_) {}
  }

  Future<void> logMapInteraction({
    required String userId,
    required double lat,
    required double lng,
    required double zoom,
  }) async {
    try {
      await _dio.post(
        '${ApiPaths.interactions}/map',
        data: {'userId': userId, 'lat': lat, 'lng': lng, 'zoom': zoom},
      );
    } catch (_) {}
  }
}
