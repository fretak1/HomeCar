import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_config.dart';
import 'session_storage.dart';

class DioClient {
  final Dio _dio;
  final SessionStorage _sessionStorage;

  static String get baseUrl => ApiConfig.apiBaseUrl;

  DioClient(this._sessionStorage)
      : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
          ),
        ) {
    _initializeInterceptors();
  }

  Dio get dio => _dio;

  void _initializeInterceptors() {
    if (kDebugMode) {
      _dio.interceptors.add(
        LogInterceptor(
          request: true,
          requestHeader: true,
          requestBody: true,
          responseHeader: false,
          responseBody: true,
          error: true,
          logPrint: (log) => debugPrint('[DIO] $log'),
        ),
      );
    }

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (kIsWeb) {
            options.extra['withCredentials'] = true;
          } else {
            final cookieHeader = await _sessionStorage.readCookies();
            if (cookieHeader != null && cookieHeader.isNotEmpty) {
              options.headers['Cookie'] = cookieHeader;
            }
          }

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
          return handler.next(options);
        },
        onResponse: (response, handler) async {
          final setCookies = response.headers.map['set-cookie'];
          if (setCookies != null && setCookies.isNotEmpty) {
            final currentCookies = await _sessionStorage.readCookies();
            final mergedCookies = _mergeCookies(currentCookies, setCookies);
            if (mergedCookies.isNotEmpty) {
              await _sessionStorage.writeCookies(mergedCookies);
            }
          }
          return handler.next(response);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            await _sessionStorage.clearSession();
          }
          return handler.next(e);
        },
      ),
    );
  }

  static String _mergeCookies(String? currentCookieHeader, List<String> setCookies) {
    final cookies = <String, String>{};

    if (currentCookieHeader != null && currentCookieHeader.isNotEmpty) {
      for (final rawCookie in currentCookieHeader.split(';')) {
        final pair = rawCookie.trim();
        if (!pair.contains('=')) continue;
        final separatorIndex = pair.indexOf('=');
        final name = pair.substring(0, separatorIndex).trim();
        cookies[name] = pair;
      }
    }

    for (final rawSetCookie in setCookies) {
      final pair = rawSetCookie.split(';').first.trim();
      if (!pair.contains('=')) continue;
      final separatorIndex = pair.indexOf('=');
      final name = pair.substring(0, separatorIndex).trim();
      final value = pair.substring(separatorIndex + 1).trim();
      if (value.isEmpty) {
        cookies.remove(name);
      } else {
        cookies[name] = '$name=$value';
      }
    }

    return cookies.values.join('; ');
  }
}

final dioClientProvider = Provider<DioClient>((ref) {
  return DioClient(ref.watch(sessionStorageProvider));
});
