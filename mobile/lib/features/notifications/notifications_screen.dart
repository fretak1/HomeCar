import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.foreground,
        surfaceTintColor: Colors.white,
        title: const Text(
          'Notifications',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
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
                style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(
                bottom: BorderSide(color: AppTheme.border),
              ),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Activity',
                  style: TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    height: 1.1,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Stay updated on your listings, messages, and maintenance requests.',
                  style: TextStyle(
                    color: AppTheme.mutedForeground,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: notificationsAsync.when(
              data: (items) {
                if (items.isEmpty) {
                  return RefreshIndicator(
                    onRefresh: () => ref.refresh(notificationsProvider.future),
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(24),
                      children: const [SizedBox(height: 56), _EmptyNotifications()],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => ref.refresh(notificationsProvider.future),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
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
                          if (!context.mounted) return;
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
              error: (error, _) => RefreshIndicator(
                onRefresh: () => ref.refresh(notificationsProvider.future),
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(24),
                  children: [
                    const SizedBox(height: 56),
                    _NotificationStatus(
                      icon: Icons.error_outline,
                      title: 'Something went wrong',
                      message: error.toString().replaceFirst('Exception: ', ''),
                      actionLabel: 'Retry',
                      onAction: () => ref.invalidate(notificationsProvider),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
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
    if (index == -1) return null;
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
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 16,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _accentColor(notification.type).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  _iconForType(notification.type),
                  color: _accentColor(notification.type),
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
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
                              color: AppTheme.foreground,
                              fontSize: 15,
                              fontWeight: isUnread ? FontWeight.w900 : FontWeight.w700,
                              letterSpacing: -0.2,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatTime(notification.createdAt),
                          style: const TextStyle(
                            color: AppTheme.mutedForeground,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      notification.message,
                      style: TextStyle(
                        color: isUnread ? AppTheme.foreground : AppTheme.mutedForeground,
                        fontSize: 14,
                        fontWeight: isUnread ? FontWeight.w600 : FontWeight.w500,
                        height: 1.45,
                      ),
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
                    color: AppTheme.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type.toUpperCase()) {
      case 'MESSAGE': return Icons.chat_bubble_outline_rounded;
      case 'APPLICATION': return Icons.assignment_outlined;
      case 'MAINTENANCE': return Icons.build_outlined;
      case 'LEASE': return Icons.description_outlined;
      default: return Icons.notifications_none_rounded;
    }
  }

  Color _accentColor(String type) {
    switch (type.toUpperCase()) {
      case 'MESSAGE': return const Color(0xFF3B82F6);
      case 'APPLICATION': return const Color(0xFFF59E0B);
      case 'MAINTENANCE': return const Color(0xFF10B981);
      case 'LEASE': return const Color(0xFF8B5CF6);
      default: return AppTheme.primary;
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
    return _NotificationStatus(
      icon: Icons.notifications_none_rounded,
      title: 'All caught up!',
      message: 'Updates about leases, maintenance, applications, and messages will show up here.',
      actionLabel: 'Go to Home',
      onAction: () => context.go('/home'),
    );
  }
}

class _NotificationStatus extends StatelessWidget {
  const _NotificationStatus({
    required this.icon,
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppTheme.primary, size: 34),
          ),
          const SizedBox(height: 18),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.foreground,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              height: 1.55,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onAction,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(actionLabel),
            ),
          ),
        ],
      ),
    );
  }
}

