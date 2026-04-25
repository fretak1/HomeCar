import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../models/property_model.dart';

final listingRepositoryProvider = Provider<ListingRepository>((ref) {
  return ListingRepository(ref.watch(dioClientProvider).dio);
});

class ListingRepository {
  ListingRepository(this._dio);

  final Dio _dio;

  Future<List<PropertyModel>> getProperties({
    String? assetType,
    Map<String, dynamic>? extraParams,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (assetType != null) queryParams['assetType'] = assetType;
      if (extraParams != null) queryParams.addAll(extraParams);

      final response = await _dio.get(
        ApiPaths.properties,
        queryParameters: queryParams,
      );

      // Handle paginated response structure
      if (response.data is Map<String, dynamic> && response.data.containsKey('properties')) {
        final List propertiesList = response.data['properties'] as List;
        final mapped = propertiesList
            .map((json) => PropertyModel.fromJson(json as Map<String, dynamic>))
            .toList();
        return mapped;
      }

      // Handle direct array response (legacy/fallback)
      if (response.data is! List) return [];
      return (response.data as List)
          .map((json) => PropertyModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (error) {
      throw Exception('Failed to fetch properties: $error');
    }
  }

  Future<PropertyModel> getPropertyById(String id) async {
    try {
      final response = await _dio.get('${ApiPaths.properties}/$id');
      return PropertyModel.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw Exception('Failed to fetch property details: $error');
    }
  }

  Future<List<PropertyModel>> getPropertiesByOwnerId(String ownerId) async {
    try {
      final response = await _dio.get('${ApiPaths.properties}/owner/$ownerId');
      if (response.data is! List) return [];
      return (response.data as List)
          .map((json) => PropertyModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (error) {
      throw Exception('Failed to fetch owner listings: $error');
    }
  }

  Future<List<PropertyModel>> getManagedListings(String userId) async {
    return getProperties(extraParams: {'listedById': userId});
  }

  Future<PropertyModel> createListing(FormData formData) async {
    try {
      final response = await _dio.post(
        '${ApiPaths.properties}/create',
        data: formData,
      );
      return PropertyModel.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw Exception('Failed to create listing: $error');
    }
  }

  Future<PropertyModel> updateListing(String id, FormData formData) async {
    try {
      final response = await _dio.patch(
        '${ApiPaths.properties}/$id',
        data: formData,
      );
      return PropertyModel.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw Exception('Failed to update listing: $error');
    }
  }

  Future<void> deleteListing(String id) async {
    try {
      await _dio.delete('${ApiPaths.properties}/$id');
    } catch (error) {
      throw Exception('Failed to delete listing: $error');
    }
  }
}

