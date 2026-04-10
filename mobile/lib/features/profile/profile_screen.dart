import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/widgets/glass_card.dart';
import '../applications/providers/application_provider.dart';
import '../auth/providers/auth_provider.dart';
import '../favorites/providers/favorite_provider.dart';
import '../leases/providers/lease_provider.dart';
import '../maintenance/providers/maintenance_provider.dart';
import '../notifications/providers/notification_provider.dart';
import '../transactions/providers/transaction_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authProvider).user;
    final favCount = ref.watch(favoriteProvider).valueOrNull?.length ?? 0;
    final applicationCount =
        ref.watch(myApplicationsProvider).valueOrNull?.length ?? 0;
    final managedApplicationCount =
        ref.watch(managedApplicationsProvider).valueOrNull?.length ?? 0;
    final leaseCount = ref.watch(leasesProvider).valueOrNull?.length ?? 0;
    final maintenanceCount =
        ref
            .watch(maintenanceRequestsProvider)
            .valueOrNull
            ?.where((request) => !request.isCompleted)
            .length ??
        0;
    final transactionCount =
        ref.watch(transactionsProvider).valueOrNull?.length ?? 0;
    final unreadNotificationCount = ref.watch(unreadNotificationsCountProvider);
    final currentLocale = ref.watch(localeProvider);

    if (user == null) {
      return _NotLoggedInView(embedded: embedded);
    }

    final body = ListView(
      padding: EdgeInsets.zero,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primary.withValues(alpha: 0.8),
                const Color(0xFF1E293B),
              ],
            ),
          ),
          child: Column(
            children: [
              CircleAvatar(
                radius: 48,
                backgroundColor: AppTheme.primary.withValues(alpha: 0.3),
                backgroundImage: user.profileImage != null
                    ? CachedNetworkImageProvider(user.profileImage!)
                    : null,
                child: user.profileImage == null
                    ? Text(
                        user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
                        style: const TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      )
                    : null,
              ),
              const SizedBox(height: 16),
              Text(
                user.name,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                user.email,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.65),
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                decoration: BoxDecoration(
                  color: AppTheme.secondary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppTheme.secondary.withValues(alpha: 0.4),
                  ),
                ),
                child: Text(
                  user.role,
                  style: const TextStyle(
                    color: AppTheme.secondary,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: GlassCard(
                  onTap: () => context.push('/favorites'),
                  child: _StatTile(label: l10n.savedListings, value: '$favCount'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GlassCard(
                  onTap: () => context.push('/leases'),
                  child: _StatTile(label: 'Leases', value: '$leaseCount'),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              _MenuTile(
                icon: Icons.edit_outlined,
                label: 'Edit Profile',
                onTap: () => context.push('/profile/edit'),
              ),
              if (user.isAgent)
                _MenuTile(
                  icon: Icons.verified_user_outlined,
                  label: 'Agent Verification',
                  badge: user.verified
                      ? 'Verified'
                      : user.isAgentVerificationRejected
                      ? 'Rejected'
                      : user.isAgentVerificationPending
                      ? 'Pending'
                      : 'Needed',
                  onTap: () => context.push('/agent-verification'),
                ),
              _MenuTile(
                icon: Icons.favorite_outline,
                label: l10n.savedListings,
                badge: favCount > 0 ? '$favCount' : null,
                onTap: () => context.push('/favorites'),
              ),
              if (!user.isOwnerOrAgent && !user.isAdmin)
                _MenuTile(
                  icon: Icons.assignment_outlined,
                  label: 'My Applications',
                  badge: applicationCount > 0 ? '$applicationCount' : null,
                  onTap: () => context.push('/applications'),
                ),
              if (user.isOwnerOrAgent)
                _MenuTile(
                  icon: Icons.assignment_ind_outlined,
                  label: 'Listing Applications',
                  badge: managedApplicationCount > 0
                      ? '$managedApplicationCount'
                      : null,
                  onTap: () => context.push('/manage-applications'),
                ),
              _MenuTile(
                icon: Icons.chat_bubble_outline,
                label: l10n.inbox,
                onTap: () => context.go('/inbox'),
              ),
              _MenuTile(
                icon: Icons.description_outlined,
                label: 'Leases',
                badge: leaseCount > 0 ? '$leaseCount' : null,
                onTap: () => context.push('/leases'),
              ),
              _MenuTile(
                icon: Icons.build_outlined,
                label: 'Maintenance',
                badge: maintenanceCount > 0 ? '$maintenanceCount' : null,
                onTap: () => context.push('/maintenance'),
              ),
              _MenuTile(
                icon: Icons.receipt_long_outlined,
                label: 'Transactions',
                badge: transactionCount > 0 ? '$transactionCount' : null,
                onTap: () => context.push('/transactions'),
              ),
              _MenuTile(
                icon: Icons.folder_outlined,
                label: 'Documents',
                onTap: () => context.push('/documents'),
              ),
              if (user.isOwnerOrAgent)
                _MenuTile(
                  icon: Icons.account_balance_outlined,
                  label: 'Payout Setup',
                  badge:
                      user.chapaSubaccountId != null &&
                          user.chapaSubaccountId!.isNotEmpty
                      ? 'Linked'
                      : 'Needed',
                  onTap: () => context.push('/payout-setup'),
                ),
              _MenuTile(
                icon: Icons.auto_awesome_outlined,
                label: 'AI Matches',
                onTap: () => context.push('/recommendations'),
              ),
              _MenuTile(
                icon: Icons.insights_outlined,
                label: 'AI Insights',
                onTap: () => context.push('/ai-insights'),
              ),
              _MenuTile(
                icon: Icons.language,
                label: 'Language',
                badge: currentLocale.languageCode.toUpperCase(),
                onTap: () => ref.read(localeProvider.notifier).toggleLocale(),
              ),
              _MenuTile(
                icon: Icons.notifications_outlined,
                label: 'Notifications',
                badge: unreadNotificationCount > 0
                    ? '$unreadNotificationCount'
                    : null,
                onTap: () => context.push('/notifications'),
              ),
              if (user.isAdmin)
                _MenuTile(
                  icon: Icons.admin_panel_settings_outlined,
                  label: 'Admin Dashboard',
                  color: AppTheme.secondary,
                  onTap: () => context.push('/admin'),
                ),
              const SizedBox(height: 16),
              const Divider(color: Colors.white12),
              const SizedBox(height: 8),
              _MenuTile(
                icon: Icons.logout,
                label: l10n.signOut,
                color: Colors.redAccent,
                onTap: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/home');
                },
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ],
    );

    if (embedded) return body;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          l10n.profile,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: body,
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: AppTheme.secondary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: Colors.white54, fontSize: 12),
        ),
      ],
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.badge,
    this.color,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? badge;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? AppTheme.foreground;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: accent),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
            if (badge != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: AppTheme.primary.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  badge!,
                  style: const TextStyle(
                    color: AppTheme.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 10),
            ],
            Icon(
              Icons.chevron_right_rounded,
              color: Colors.white.withValues(alpha: 0.4),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotLoggedInView extends ConsumerWidget {
  const _NotLoggedInView({required this.embedded});

  final bool embedded;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;

    final content = Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: GlassCard(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  height: 72,
                  width: 72,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: const Icon(
                    Icons.person_outline_rounded,
                    size: 36,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  l10n.profile,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Sign in to manage listings, applications, leases, payments, and your account.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.6,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go('/login'),
                    child: Text(l10n.login),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => context.go('/signup'),
                    child: Text(l10n.signup),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (embedded) {
      return content;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          l10n.profile,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: content,
    );
  }
}
