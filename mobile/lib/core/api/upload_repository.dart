import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
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
    return uploadSelectedFiles(paths: paths);
  }

  Future<List<String>> uploadSelectedFiles({
    List<String> paths = const [],
    List<PlatformFile> files = const [],
  }) async {
    if (paths.isEmpty && files.isEmpty) {
      return const [];
    }

    final formData = FormData();
    for (final path in paths) {
      formData.files.add(MapEntry('files', await MultipartFile.fromFile(path)));
    }
    for (final file in files) {
      final multipart = await _multipartFromPlatformFile(file);
      if (multipart != null) {
        formData.files.add(MapEntry('files', multipart));
      }
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

  Future<MultipartFile?> _multipartFromPlatformFile(PlatformFile file) async {
    final safePath = _safeFilePath(file);
    if (safePath != null) {
      return MultipartFile.fromFile(
        safePath,
        filename: file.name,
      );
    }

    final bytes = file.bytes;
    if (bytes == null || bytes.isEmpty) {
      return null;
    }

    return MultipartFile.fromBytes(
      bytes,
      filename: file.name,
    );
  }

  String? _safeFilePath(PlatformFile file) {
    try {
      final path = file.path;
      if (path == null || path.isEmpty) {
        return null;
      }
      return path;
    } catch (_) {
      return null;
    }
  }
}

