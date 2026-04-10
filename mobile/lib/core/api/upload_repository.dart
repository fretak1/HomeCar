import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_paths.dart';
import 'dio_client.dart';

final uploadRepositoryProvider = Provider<UploadRepository>((ref) {
  return UploadRepository(ref.watch(dioClientProvider).dio);
});

class UploadRepository {
  UploadRepository(this._dio);

  final Dio _dio;

  Future<List<String>> uploadFiles(List<String> paths) async {
    if (paths.isEmpty) {
      return const [];
    }

    final formData = FormData();
    for (final path in paths) {
      formData.files.add(MapEntry('files', await MultipartFile.fromFile(path)));
    }

    final response = await _dio.post(
      '${ApiPaths.upload}/multiple',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );

    final data = response.data;
    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map>()
        .map((item) => item['url']?.toString() ?? '')
        .where((url) => url.isNotEmpty)
        .toList();
  }
}
