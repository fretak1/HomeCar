import 'package:dio/dio.dart';
import 'package:dio/browser.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final dioClientProvider = Provider<DioClient>((ref) => DioClient());

class DioClient {
  DioClient();

  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:5000';

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:5000';
      default:
        return 'http://localhost:5000';
    }
  }

  static final Dio instance = _build();

  Dio get dio => instance;

  static Dio _build() {
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 90),
        sendTimeout: const Duration(seconds: 60),
        responseType: ResponseType.json,
        headers: const {
          'Accept': 'application/json',
        },
        validateStatus: (status) {
          return status != null && status >= 200 && status < 500;
        },
      ),
    );

    if (kIsWeb && dio.httpClientAdapter is BrowserHttpClientAdapter) {
      (dio.httpClientAdapter as BrowserHttpClientAdapter).withCredentials =
          true;
    }

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final method = options.method.toUpperCase();

          if (method == 'GET') {
            options.headers.remove(Headers.contentTypeHeader);
          } else {
            options.headers[Headers.contentTypeHeader] =
                Headers.jsonContentType;
          }

          if (kDebugMode) {
            debugPrint('[DIO] ${options.method} ${options.uri}');
          }

          handler.next(options);
        },
        onResponse: (response, handler) {
          if (kDebugMode) {
            debugPrint(
              '[DIO] ${response.requestOptions.method} ${response.requestOptions.uri} -> ${response.statusCode}',
            );
          }
          handler.next(response);
        },
        onError: (error, handler) {
          if (kDebugMode) {
            debugPrint('[DIO] *** DioException ***:');
            debugPrint('[DIO] uri: ${error.requestOptions.uri}');
            debugPrint('[DIO] $error');
          }
          handler.next(error);
        },
      ),
    );

    return dio;
  }
}

