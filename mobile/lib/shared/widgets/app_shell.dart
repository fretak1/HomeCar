import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/listings/providers/search_provider.dart';
import '../../features/notifications/providers/notification_provider.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  void _goBranch(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final unreadCount = ref.watch(unreadNotificationsCountProvider);
    final showPublicNav = user == null || user.isCustomer;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.foreground,
        surfaceTintColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        toolbarHeight: 64,
        leading: Builder(
          builder: (context) {
            return IconButton(
              tooltip: 'Menu',
              onPressed: () => Scaffold.of(context).openDrawer(),
              icon: const Icon(Icons.menu_rounded),
            );
          },
        ),
        titleSpacing: 0,
        title: InkWell(
          onTap: () => _goBranch(0),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Image.asset(
              'assets/brand/e.png',
              height: 34,
              fit: BoxFit.contain,
            ),
          ),
        ),
        actions: [
          if (showPublicNav)
            IconButton(
              tooltip: 'Properties',
              onPressed: () {
                ref.read(exploreViewModeProvider.notifier).state =
                    ExploreViewMode.list;
                _goBranch(1);
              },
              icon: const Icon(Icons.search_rounded),
            ),
          if (user != null && !user.isAdmin)
            IconButton(
              tooltip: 'Messages',
              onPressed: () => _goBranch(3),
              icon: const Icon(Icons.message_outlined),
            ),
          if (user != null)
            IconButton(
              tooltip: 'Notifications',
              onPressed: () => context.push('/notifications'),
              icon: Badge(
                isLabelVisible: unreadCount > 0,
                backgroundColor: Colors.red,
                label: Text(unreadCount > 9 ? '9+' : '$unreadCount'),
                child: const Icon(Icons.notifications_none_rounded),
              ),
            ),
          if (user == null) ...[
            TextButton(
              onPressed: () => context.push('/login'),
              child: const Text(
                'Sign In',
                style: TextStyle(
                  color: AppTheme.foreground,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: FilledButton(
                onPressed: () => context.push('/signup'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text('Sign Up'),
              ),
            ),
          ] else
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: InkWell(
                onTap: () => _goBranch(4),
                borderRadius: BorderRadius.circular(999),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 8,
                  ),
                  child: _UserAvatar(userName: user.name, imageUrl: user.profileImage),
                ),
              ),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppTheme.border),
        ),
      ),
      drawer: Drawer(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        child: SafeArea(
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: AppTheme.border)),
                ),
                child: Row(
                  children: [
                    Image.asset('assets/brand/e.png', height: 34),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
                  children: [
                    if (showPublicNav) ...[
                      _DrawerSectionTitle(label: 'Browse'),
                      _DrawerLink(
                        icon: Icons.home_outlined,
                        label: 'Home',
                        selected: navigationShell.currentIndex == 0,
                        onTap: () {
                          Navigator.of(context).pop();
                          _goBranch(0);
                        },
                      ),
                      _DrawerLink(
                        icon: Icons.map_outlined,
                        label: 'Search On Map',
                        selected: navigationShell.currentIndex == 1,
                        onTap: () {
                          Navigator.of(context).pop();
                          ref.read(exploreViewModeProvider.notifier).state =
                              ExploreViewMode.map;
                          _goBranch(1);
                        },
                      ),
                      _DrawerLink(
                        icon: Icons.apartment_outlined,
                        label: 'Properties',
                        selected: navigationShell.currentIndex == 1,
                        onTap: () {
                          Navigator.of(context).pop();
                          ref.read(exploreViewModeProvider.notifier).state =
                              ExploreViewMode.list;
                          _goBranch(1);
                        },
                      ),
                      _DrawerLink(
                        icon: Icons.dashboard_outlined,
                        label: 'Dashboard',
                        selected: navigationShell.currentIndex == 4,
                        onTap: () {
                          Navigator.of(context).pop();
                          if (user == null) {
                            context.push('/login');
                          } else if (user.isAdmin) {
                            context.push('/admin');
                          } else {
                            _goBranch(4);
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                    ],
                    _DrawerSectionTitle(label: 'Tools'),
                    _DrawerLink(
                      icon: Icons.auto_awesome_outlined,
                      label: 'AI Price Predictor',
                      selected: navigationShell.currentIndex == 2,
                      onTap: () {
                        Navigator.of(context).pop();
                        _goBranch(2);
                      },
                    ),
                    _DrawerLink(
                      icon: Icons.smart_toy_outlined,
                      label: 'AI Assistant',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/ai-assistant');
                      },
                    ),
                    _DrawerLink(
                      icon: Icons.insights_outlined,
                      label: 'AI Insights',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/ai-insights');
                      },
                    ),
                    _DrawerLink(
                      icon: Icons.recommend_outlined,
                      label: 'Recommendations',
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/recommendations');
                      },
                    ),
                    if (user != null) ...[
                      const SizedBox(height: 12),
                      _DrawerSectionTitle(label: 'Account'),
                      _DrawerLink(
                        icon: Icons.person_outline,
                        label: 'My Profile',
                        selected: navigationShell.currentIndex == 4,
                        onTap: () {
                          Navigator.of(context).pop();
                          _goBranch(4);
                        },
                      ),
                      if (!user.isAdmin)
                        _DrawerLink(
                          icon: Icons.chat_bubble_outline,
                          label: 'Messages',
                          selected: navigationShell.currentIndex == 3,
                          onTap: () {
                            Navigator.of(context).pop();
                            _goBranch(3);
                          },
                        ),
                      _DrawerLink(
                        icon: Icons.notifications_outlined,
                        label: 'Notifications',
                        trailing: unreadCount > 0 ? '$unreadCount' : null,
                        onTap: () {
                          Navigator.of(context).pop();
                          context.push('/notifications');
                        },
                      ),
                      _DrawerLink(
                        icon: Icons.favorite_border,
                        label: 'Favorites',
                        onTap: () {
                          Navigator.of(context).pop();
                          context.push('/favorites');
                        },
                      ),
                      _DrawerLink(
                        icon: Icons.description_outlined,
                        label: 'Documents',
                        onTap: () {
                          Navigator.of(context).pop();
                          context.push('/documents');
                        },
                      ),
                      _DrawerLink(
                        icon: Icons.receipt_long_outlined,
                        label: 'Transactions',
                        onTap: () {
                          Navigator.of(context).pop();
                          context.push('/transactions');
                        },
                      ),
                      _DrawerLink(
                        icon: Icons.home_work_outlined,
                        label: 'Leases',
                        onTap: () {
                          Navigator.of(context).pop();
                          context.push('/leases');
                        },
                      ),
                      _DrawerLink(
                        icon: Icons.build_outlined,
                        label: 'Maintenance',
                        onTap: () {
                          Navigator.of(context).pop();
                          context.push('/maintenance');
                        },
                      ),
                      if (user.isOwnerOrAgent)
                        _DrawerLink(
                          icon: Icons.add_home_outlined,
                          label: 'My Listings',
                          onTap: () {
                            Navigator.of(context).pop();
                            context.push('/my-listings');
                          },
                        ),
                      if (user.isOwnerOrAgent)
                        _DrawerLink(
                          icon: Icons.account_balance_outlined,
                          label: 'Payout Setup',
                          onTap: () {
                            Navigator.of(context).pop();
                            context.push('/payout-setup');
                          },
                        ),
                      if (user.isAgent)
                        _DrawerLink(
                          icon: Icons.verified_user_outlined,
                          label: 'Agent Verification',
                          onTap: () {
                            Navigator.of(context).pop();
                            context.push('/agent-verification');
                          },
                        ),
                      if (user.isAdmin)
                        _DrawerLink(
                          icon: Icons.admin_panel_settings_outlined,
                          label: 'Admin Dashboard',
                          onTap: () {
                            Navigator.of(context).pop();
                            context.push('/admin');
                          },
                        ),
                      const SizedBox(height: 12),
                      _DrawerSectionTitle(label: 'Session'),
                      _DrawerLink(
                        icon: Icons.logout_rounded,
                        label: 'Log out',
                        destructive: true,
                        onTap: () async {
                          Navigator.of(context).pop();
                          await ref.read(authProvider.notifier).logout();
                          if (context.mounted) {
                            context.go('/home');
                          }
                        },
                      ),
                    ] else ...[
                      const SizedBox(height: 12),
                      _DrawerSectionTitle(label: 'Session'),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Column(
                          children: [
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: () {
                                  Navigator.of(context).pop();
                                  context.push('/login');
                                },
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppTheme.foreground,
                                  side: const BorderSide(color: AppTheme.border),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text('Sign In'),
                              ),
                            ),
                            const SizedBox(height: 10),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                onPressed: () {
                                  Navigator.of(context).pop();
                                  context.push('/signup');
                                },
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppTheme.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text('Sign Up'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      body: navigationShell,
    );
  }
}

class _DrawerSectionTitle extends StatelessWidget {
  const _DrawerSectionTitle({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 8),
      child: Text(
        label,
        style: const TextStyle(
          color: AppTheme.mutedForeground,
          fontSize: 12,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.9,
        ),
      ),
    );
  }
}

class _DrawerLink extends StatelessWidget {
  const _DrawerLink({
    required this.icon,
    required this.label,
    required this.onTap,
    this.selected = false,
    this.destructive = false,
    this.trailing,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool selected;
  final bool destructive;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    final foreground = destructive
        ? Colors.redAccent
        : (selected ? AppTheme.primary : AppTheme.foreground);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: ListTile(
        selected: selected,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        tileColor: selected
            ? AppTheme.primary.withValues(alpha: 0.08)
            : Colors.transparent,
        iconColor: foreground,
        textColor: foreground,
        leading: Icon(icon),
        trailing: trailing == null
            ? null
            : Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  trailing!,
                  style: const TextStyle(
                    color: AppTheme.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
        title: Text(
          label,
          style: TextStyle(
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}

class _UserAvatar extends StatelessWidget {
  const _UserAvatar({required this.userName, this.imageUrl});

  final String userName;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final trimmed = imageUrl?.trim();
    return CircleAvatar(
      radius: 18,
      backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
      backgroundImage: trimmed != null && trimmed.isNotEmpty
          ? CachedNetworkImageProvider(trimmed)
          : null,
      child: trimmed == null || trimmed.isEmpty
          ? Text(
              userName.isEmpty ? 'U' : userName[0].toUpperCase(),
              style: const TextStyle(
                color: AppTheme.primary,
                fontWeight: FontWeight.w800,
              ),
            )
          : null,
    );
  }
}
