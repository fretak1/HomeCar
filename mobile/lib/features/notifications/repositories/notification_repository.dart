import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../models/app_notification_model.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(dioClientProvider).dio);
});

class NotificationRepository {
  NotificationRepository(this._dio);

  final Dio _dio;

  Future<List<AppNotificationModel>> getNotifications() async {
    try {
      final response = await _dio.get(ApiPaths.notifications);
      final data = response.data;
      if (data is! List) {
        return const [];
      }

      return data
          .whereType<Map>()
          .map(
            (item) =>
                AppNotificationModel.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList();
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Failed to load notifications.'));
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _dio.put('${ApiPaths.notifications}/$id/read');
    } on DioException catch (error) {
      throw Exception(
        _extractError(error, 'Failed to mark notification as read.'),
      );
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _dio.put('${ApiPaths.notifications}/mark-all-read');
    } on DioException catch (error) {
      throw Exception(
        _extractError(error, 'Failed to mark all notifications as read.'),
      );
    }
  }

  String _extractError(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map && data['error'] != null) {
      return data['error'].toString();
    }
    return fallback;
  }
}
