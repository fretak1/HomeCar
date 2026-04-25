import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../models/app_notification_model.dart';
import '../repositories/notification_repository.dart';

final notificationsProvider = FutureProvider<List<AppNotificationModel>>((
  ref,
) async {
  final user = ref.watch(authProvider).user;
  if (user == null) {
    return const [];
  }

  return ref.watch(notificationRepositoryProvider).getNotifications();
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  final notifications =
      ref.watch(notificationsProvider).valueOrNull ??
      const <AppNotificationModel>[];
  return notifications.where((item) => !item.read).length;
});

class NotificationActionState {
  const NotificationActionState({this.isLoading = false, this.error});

  final bool isLoading;
  final String? error;
}

class NotificationActionNotifier
    extends StateNotifier<NotificationActionState> {
  NotificationActionNotifier(this.ref) : super(const NotificationActionState());

  final Ref ref;

  Future<void> markAsRead(String id) async {
    try {
      await ref.read(notificationRepositoryProvider).markAsRead(id);
      ref.invalidate(notificationsProvider);
    } catch (error) {
      state = NotificationActionState(
        error: error.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> markAllAsRead() async {
    state = const NotificationActionState(isLoading: true);
    try {
      await ref.read(notificationRepositoryProvider).markAllAsRead();
      state = const NotificationActionState();
      ref.invalidate(notificationsProvider);
    } catch (error) {
      state = NotificationActionState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
    }
  }
}

final notificationActionProvider =
    StateNotifierProvider<NotificationActionNotifier, NotificationActionState>((
      ref,
    ) {
      return NotificationActionNotifier(ref);
    });

