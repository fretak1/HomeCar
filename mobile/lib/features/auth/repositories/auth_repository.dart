import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/api/session_storage.dart';
import '../models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(dioClientProvider).dio,
    ref.watch(sessionStorageProvider),
  );
});

class AuthRepository {
  AuthRepository(this._dio, this._sessionStorage);

  final Dio _dio;
  final SessionStorage _sessionStorage;

  Future<UserModel> login(String email, String password) async {
    try {
      final response = await _dio.post(
        '${ApiPaths.auth}/sign-in/email',
        data: {'email': email, 'password': password, 'rememberMe': true},
      );

      await _sessionStorage.clearPendingEmail();
      return UserModel.fromJson(response.data['user'] as Map<String, dynamic>);
    } on DioException catch (error) {
      if (_messageFrom(error).toLowerCase().contains('verify')) {
        await _sessionStorage.writePendingEmail(email);
      }
      throw Exception(_messageFrom(error));
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String role,
  }) async {
    try {
      final existsResponse = await _dio.get(
        '${ApiPaths.users}/check-email',
        queryParameters: {'email': email},
      );

      if (existsResponse.data['exists'] == true) {
        throw Exception(
          'This email is already registered. Please sign in instead.',
        );
      }

      await _dio.post(
        '${ApiPaths.auth}/sign-up/email',
        data: {
          'name': name,
          'email': email,
          'password': password,
          'rememberMe': true,
          'role': role,
        },
      );

      await _sessionStorage.writePendingEmail(email);
    } on DioException catch (error) {
      throw Exception(_messageFrom(error));
    }
  }

  Future<UserModel?> getCurrentUser() async {
    try {
      final response = await _dio.get('${ApiPaths.auth}/get-session');
      final data = response.data;
      if (data == null || data['user'] == null) {
        return null;
      }
      return UserModel.fromJson(data['user'] as Map<String, dynamic>);
    } on DioException {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('${ApiPaths.auth}/sign-out');
    } finally {
      await _sessionStorage.clearSession();
      await _sessionStorage.clearPendingEmail();
    }
  }

  Future<void> sendVerificationOtp(String email) async {
    try {
      await _dio.post(
        '${ApiPaths.auth}/email-otp/send-verification-otp',
        data: {'email': email, 'type': 'email-verification'},
      );
      await _sessionStorage.writePendingEmail(email);
    } on DioException catch (error) {
      throw Exception(_messageFrom(error));
    }
  }

  Future<UserModel> verifyEmail({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await _dio.post(
        '${ApiPaths.auth}/email-otp/verify-email',
        data: {'email': email, 'otp': otp},
      );
      await _sessionStorage.clearPendingEmail();
      return UserModel.fromJson(response.data['user'] as Map<String, dynamic>);
    } on DioException catch (error) {
      throw Exception(_messageFrom(error));
    }
  }

  Future<void> requestPasswordReset(String email) async {
    try {
      await _dio.post(
        '${ApiPaths.auth}/email-otp/request-password-reset',
        data: {'email': email},
      );
      await _sessionStorage.writePendingEmail(email);
    } on DioException catch (error) {
      throw Exception(_messageFrom(error));
    }
  }

  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    try {
      await _dio.post(
        '${ApiPaths.auth}/email-otp/reset-password',
        data: {'email': email, 'otp': otp, 'password': newPassword},
      );
    } on DioException catch (error) {
      throw Exception(_messageFrom(error));
    }
  }

  Future<UserModel> updateProfile({
    String? name,
    String? email,
    String? phoneNumber,
    String? marriageStatus,
    int? kids,
    String? gender,
    String? employmentStatus,
    String? currentPassword,
    String? newPassword,
    String? profileImagePath,
  }) async {
    try {
      final formData = FormData();
      if (name != null) {
        formData.fields.add(MapEntry('name', name));
      }
      if (email != null) {
        formData.fields.add(MapEntry('email', email));
      }
      if (phoneNumber != null) {
        formData.fields.add(MapEntry('phoneNumber', phoneNumber));
      }
      if (marriageStatus != null) {
        formData.fields.add(MapEntry('marriageStatus', marriageStatus));
      }
      if (kids != null) {
        formData.fields.add(MapEntry('kids', kids.toString()));
      }
      if (gender != null) {
        formData.fields.add(MapEntry('gender', gender));
      }
      if (employmentStatus != null) {
        formData.fields.add(MapEntry('employmentStatus', employmentStatus));
      }
      if (currentPassword != null && currentPassword.isNotEmpty) {
        formData.fields.add(MapEntry('currentPassword', currentPassword));
      }
      if (newPassword != null && newPassword.isNotEmpty) {
        formData.fields.add(MapEntry('newPassword', newPassword));
      }
      if (profileImagePath != null && profileImagePath.isNotEmpty) {
        formData.files.add(
          MapEntry(
            'profileImage',
            await MultipartFile.fromFile(profileImagePath),
          ),
        );
      }

      final response = await _dio.patch(
        '${ApiPaths.users}/me',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      return UserModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (error) {
      throw Exception(_messageFrom(error));
    }
  }

  Future<UserModel> submitAgentVerification({
    required String licensePath,
    required String selfiePath,
  }) async {
    try {
      final formData = FormData();
      formData.files.add(
        MapEntry('license', await MultipartFile.fromFile(licensePath)),
      );
      formData.files.add(
        MapEntry('selfie', await MultipartFile.fromFile(selfiePath)),
      );

      final response = await _dio.patch(
        '${ApiPaths.users}/verify',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      final data = response.data as Map<String, dynamic>;
      final user = data['user'];
      if (user is Map<String, dynamic>) {
        return UserModel.fromJson(user);
      }
      if (user is Map) {
        return UserModel.fromJson(Map<String, dynamic>.from(user));
      }
      final refreshed = await getCurrentUser();
      if (refreshed == null) {
        throw Exception('Verification submitted, but user refresh failed.');
      }
      return refreshed;
    } on DioException catch (error) {
      throw Exception(_messageFrom(error));
    }
  }

  Future<String?> getPendingEmail() => _sessionStorage.readPendingEmail();

  Future<void> clearPendingEmail() => _sessionStorage.clearPendingEmail();

  String _messageFrom(DioException error) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'] ?? data['error'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
    }
    return error.message ?? 'Authentication request failed.';
  }
}

