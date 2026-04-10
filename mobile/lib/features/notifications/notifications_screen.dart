import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../auth/providers/auth_provider.dart';
import 'models/app_notification_model.dart';
import 'providers/notification_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);
    final actionState = ref.watch(notificationActionProvider);
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if ((ref.watch(unreadNotificationsCountProvider)) > 0)
            TextButton(
              onPressed: actionState.isLoading
                  ? null
                  : () => ref
                        .read(notificationActionProvider.notifier)
                        .markAllAsRead(),
              child: const Text(
                'Mark all read',
                style: TextStyle(color: AppTheme.secondary),
              ),
            ),
        ],
      ),
      body: notificationsAsync.when(
        data: (items) {
          if (items.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              children: const [SizedBox(height: 80), _EmptyNotifications()],
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(notificationsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = items[index];
                return _NotificationCard(
                  notification: item,
                  onTap: () async {
                    if (!item.read) {
                      await ref
                          .read(notificationActionProvider.notifier)
                          .markAsRead(item.id);
                    }
                    if (!context.mounted) {
                      return;
                    }
                    _openNotificationDestination(
                      context,
                      item,
                      user?.role ?? 'CUSTOMER',
                    );
                  },
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString().replaceFirst('Exception: ', ''),
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.redAccent),
            ),
          ),
        ),
      ),
    );
  }

  void _openNotificationDestination(
    BuildContext context,
    AppNotificationModel notification,
    String role,
  ) {
    final rawLink = notification.link ?? '';
    final link = rawLink.toLowerCase();
    if (link.contains('/chat')) {
      final partnerId = _extractQueryValue(rawLink, 'partnerId');
      if (partnerId != null && partnerId.isNotEmpty) {
        context.go('/inbox/thread/$partnerId');
        return;
      }
      context.go('/inbox');
      return;
    }

    if (link.contains('maintenance') ||
        notification.type.toUpperCase() == 'MAINTENANCE') {
      context.go('/maintenance');
      return;
    }

    if (link.contains('lease') || notification.type.toUpperCase() == 'LEASE') {
      context.go('/leases');
      return;
    }

    if (link.contains('application') ||
        notification.type.toUpperCase() == 'APPLICATION') {
      final normalizedRole = role.toUpperCase();
      if (normalizedRole == 'ADMIN') {
        context.go('/admin');
        return;
      }
      context.go(
        normalizedRole == 'CUSTOMER' ? '/applications' : '/manage-applications',
      );
      return;
    }

    context.go('/home');
  }

  String? _extractQueryValue(String link, String key) {
    final marker = '$key=';
    final index = link.indexOf(marker);
    if (index == -1) {
      return null;
    }

    final value = link.substring(index + marker.length);
    final ampersandIndex = value.indexOf('&');
    return ampersandIndex == -1 ? value : value.substring(0, ampersandIndex);
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.notification, required this.onTap});

  final AppNotificationModel notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isUnread = !notification.read;
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: _accentColor(notification.type).withOpacity(0.14),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _iconForType(notification.type),
              color: _accentColor(notification.type),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notification.title,
                        style: TextStyle(
                          fontWeight: isUnread
                              ? FontWeight.bold
                              : FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatTime(notification.createdAt),
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  notification.message,
                  style: const TextStyle(color: Colors.white70, height: 1.45),
                ),
              ],
            ),
          ),
          if (isUnread) ...[
            const SizedBox(width: 12),
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: AppTheme.secondary,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ],
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type.toUpperCase()) {
      case 'MESSAGE':
        return Icons.chat_bubble_outline;
      case 'APPLICATION':
        return Icons.assignment_outlined;
      case 'MAINTENANCE':
        return Icons.build_outlined;
      case 'LEASE':
        return Icons.description_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _accentColor(String type) {
    switch (type.toUpperCase()) {
      case 'MESSAGE':
        return const Color(0xFF60A5FA);
      case 'APPLICATION':
        return const Color(0xFFFBBF24);
      case 'MAINTENANCE':
        return const Color(0xFF34D399);
      case 'LEASE':
        return const Color(0xFFA78BFA);
      default:
        return AppTheme.secondary;
    }
  }

  String _formatTime(DateTime dateTime) {
    final difference = DateTime.now().difference(dateTime);
    if (difference.inMinutes < 1) return 'now';
    if (difference.inHours < 1) return '${difference.inMinutes}m';
    if (difference.inDays < 1) return '${difference.inHours}h';
    if (difference.inDays < 7) return '${difference.inDays}d';
    return '${dateTime.day}/${dateTime.month}';
  }
}

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications();

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.notifications_none,
            color: AppTheme.secondary.withOpacity(0.95),
            size: 42,
          ),
          const SizedBox(height: 16),
          Text(
            'No notifications yet',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          const Text(
            'Updates about leases, maintenance, applications, and messages will show up here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white70, height: 1.5),
          ),
        ],
      ),
    );
  }
}
