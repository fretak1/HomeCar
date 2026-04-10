import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../../listings/models/property_model.dart';

final favoriteRepositoryProvider = Provider<FavoriteRepository>((ref) {
  return FavoriteRepository(ref.watch(dioClientProvider).dio);
});

class FavoriteRepository {
  FavoriteRepository(this._dio);

  final Dio _dio;

  Future<List<PropertyModel>> getFavorites() async {
    final response = await _dio.get(ApiPaths.favorites);
    if (response.data is! List) return [];
    return (response.data as List)
        .map(
          (item) =>
              PropertyModel.fromJson(item['property'] as Map<String, dynamic>),
        )
        .toList();
  }

  Future<void> addFavorite(String propertyId) async {
    await _dio.post(ApiPaths.favorites, data: {'propertyId': propertyId});
  }

  Future<void> removeFavorite(String propertyId) async {
    await _dio.delete('${ApiPaths.favorites}/$propertyId');
  }
}
