import 'package:flutter/foundation.dart';

class ApiConfig {
  static const String _apiUrlOverride = String.fromEnvironment('HOMECAR_API_URL');
  static const String _aiUrlOverride = String.fromEnvironment('HOMECAR_AI_URL');

  static String _normalizeAiBaseUrl(String url) {
    final trimmed = url.trim().replaceFirst(RegExp(r'\/+$'), '');
    if (trimmed.endsWith('/api/v1')) {
      return trimmed;
    }
    return '$trimmed/api/v1';
  }

  static String get apiBaseUrl {
    if (_apiUrlOverride.isNotEmpty) {
      return _apiUrlOverride;
    }

    if (kIsWeb) {
      return 'http://localhost:5000';
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:5000';
      default:
        return 'http://localhost:5000';
    }
  }

  static String get aiBaseUrl {
    if (_aiUrlOverride.isNotEmpty) {
      return _normalizeAiBaseUrl(_aiUrlOverride);
    }

    if (kIsWeb) {
      return _normalizeAiBaseUrl('http://localhost:8000');
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return _normalizeAiBaseUrl('http://10.0.2.2:8000');
      default:
        return _normalizeAiBaseUrl('http://localhost:8000');
    }
  }
}
