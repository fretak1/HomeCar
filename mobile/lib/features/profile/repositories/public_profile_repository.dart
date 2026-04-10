import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../../auth/models/user_model.dart';

final publicProfileRepositoryProvider = Provider<PublicProfileRepository>((
  ref,
) {
  return PublicProfileRepository(ref.watch(dioClientProvider).dio);
});

class PublicProfileRepository {
  PublicProfileRepository(this._dio);

  final Dio _dio;

  Future<UserModel> getUserById(String userId) async {
    try {
      final response = await _dio.get('${ApiPaths.users}/$userId');
      return UserModel.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw Exception('Failed to load profile: $error');
    }
  }
}
