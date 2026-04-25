import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_config.dart';

class AiDioClient {
  final Dio _dio;

  static String get baseUrl => ApiConfig.aiBaseUrl;

  AiDioClient()
    : _dio = Dio(
        BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
        ),
      ) {
    _initializeInterceptors();
  }

  Dio get dio => _dio;

  void _initializeInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final method = options.method.toUpperCase();
          final hasBody =
              options.data != null &&
              method != 'GET' &&
              method != 'DELETE' &&
              method != 'HEAD';

          if (!hasBody) {
            options.headers.remove(Headers.contentTypeHeader);
          } else if (options.data is! FormData &&
              !options.headers.containsKey(Headers.contentTypeHeader)) {
            options.headers[Headers.contentTypeHeader] = Headers.jsonContentType;
          }

          if (kIsWeb) {
            options.extra['withCredentials'] = false;
          }

          handler.next(options);
        },
      ),
    );

    _dio.interceptors.add(
      LogInterceptor(requestBody: true, responseBody: true),
    );
  }
}

final aiDioClientProvider = Provider<AiDioClient>((ref) => AiDioClient());

