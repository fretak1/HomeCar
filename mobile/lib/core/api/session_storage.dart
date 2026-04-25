import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SessionStorage {
  SessionStorage([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  static const String _cookieKey = 'session_cookies';
  static const String _pendingEmailKey = 'pending_auth_email';

  final FlutterSecureStorage _storage;

  Future<String?> readCookies() => _storage.read(key: _cookieKey);

  Future<void> writeCookies(String cookies) =>
      _storage.write(key: _cookieKey, value: cookies);

  Future<void> clearSession() => _storage.delete(key: _cookieKey);

  Future<String?> readPendingEmail() => _storage.read(key: _pendingEmailKey);

  Future<void> writePendingEmail(String email) =>
      _storage.write(key: _pendingEmailKey, value: email);

  Future<void> clearPendingEmail() => _storage.delete(key: _pendingEmailKey);
}

final sessionStorageProvider = Provider<SessionStorage>((ref) {
  return SessionStorage();
});

