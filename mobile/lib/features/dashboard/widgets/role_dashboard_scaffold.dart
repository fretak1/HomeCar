import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class DashboardStatItem {
  const DashboardStatItem({
    required this.label,
    required this.value,
    required this.icon,
    this.iconColor,
    this.iconBackground,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color? iconColor;
  final Color? iconBackground;
}

class DashboardTabItem {
  const DashboardTabItem({
    required this.label,
    required this.child,
  });

  final String label;
  final Widget child;
}

class RoleDashboardScaffold extends StatelessWidget {
  const RoleDashboardScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.stats,
    required this.tabs,
    this.headerAction,
    this.topContent,
    this.usePillTabs = false,
    this.initialTabIndex = 0,
  });

  final String title;
  final String subtitle;
  final List<DashboardStatItem> stats;
  final List<DashboardTabItem> tabs;
  final Widget? headerAction;
  final Widget? topContent;
  final bool usePillTabs;
  final int initialTabIndex;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isPhone = constraints.maxWidth < 480;

        return DefaultTabController(
          length: tabs.length,
          initialIndex: initialTabIndex,
          child: Scaffold(
            backgroundColor: const Color(0xFFF8FAFC),
            body: SafeArea(
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.fromLTRB(
                      16,
                      isPhone ? 16 : 20,
                      16,
                      isPhone ? 18 : 22,
                    ),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppTheme.primary, Color(0xFF1E40AF)],
                      ),
                    ),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1200),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (headerAction != null)
                            isPhone
                                ? Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      _HeaderText(
                                        title: title,
                                        subtitle: subtitle,
                                        compact: true,
                                      ),
                                      const SizedBox(height: 14),
                                      SizedBox(
                                        width: double.infinity,
                                        child: headerAction!,
                                      ),
                                    ],
                                  )
                                : Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        child: _HeaderText(
                                          title: title,
                                          subtitle: subtitle,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      headerAction!,
                                    ],
                                  )
                          else
                            _HeaderText(
                              title: title,
                              subtitle: subtitle,
                              compact: isPhone,
                            ),
                        ],
                      ),
                    ),
                  ),
                  if (topContent != null)
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        16,
                        isPhone ? 12 : 16,
                        16,
                        0,
                      ),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 1200),
                        child: topContent!,
                      ),
                    ),
                  if (stats.isNotEmpty)
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        16,
                        isPhone ? 12 : 16,
                        16,
                        12,
                      ),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 1200),
                        child: _DashboardStatsLayout(
                          stats: stats,
                          compact: isPhone,
                        ),
                      ),
                    ),
                  Container(
                    width: double.infinity,
                    decoration: usePillTabs
                        ? null
                        : const BoxDecoration(
                            border: Border(
                              bottom: BorderSide(color: AppTheme.border),
                            ),
                          ),
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(
                        isPhone ? 8 : 16,
                        usePillTabs ? 4 : 0,
                        isPhone ? 8 : 16,
                        usePillTabs ? 12 : 0,
                      ),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: usePillTabs
                            ? DecoratedBox(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(color: AppTheme.border),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Color(0x12000000),
                                      blurRadius: 16,
                                      offset: Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(6),
                                  child: TabBar(
                                    isScrollable: true,
                                    labelColor: Colors.white,
                                    unselectedLabelColor:
                                        AppTheme.mutedForeground,
                                    indicatorSize: TabBarIndicatorSize.tab,
                                    indicator: BoxDecoration(
                                      color: AppTheme.primary,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    dividerColor: Colors.transparent,
                                    tabAlignment: TabAlignment.start,
                                    labelPadding: EdgeInsets.symmetric(
                                      horizontal: isPhone ? 10 : 16,
                                    ),
                                    labelStyle: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: isPhone ? 13 : 14,
                                    ),
                                    unselectedLabelStyle: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: isPhone ? 13 : 14,
                                    ),
                                    tabs: [
                                      for (final tab in tabs)
                                        Tab(text: tab.label),
                                    ],
                                  ),
                                ),
                              )
                            : TabBar(
                                isScrollable: true,
                                labelColor: AppTheme.foreground,
                                unselectedLabelColor:
                                    AppTheme.mutedForeground,
                                indicatorColor: AppTheme.primary,
                                indicatorWeight: 3,
                                dividerColor: Colors.transparent,
                                tabAlignment: TabAlignment.start,
                                labelPadding: EdgeInsets.symmetric(
                                  horizontal: isPhone ? 10 : 16,
                                ),
                                labelStyle: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: isPhone ? 13 : 14,
                                ),
                                unselectedLabelStyle: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: isPhone ? 13 : 14,
                                ),
                                tabs: [
                                  for (final tab in tabs) Tab(text: tab.label),
                                ],
                              ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        for (final tab in tabs)
                          Container(
                            color: const Color(0xFFF8FAFC),
                            child: tab.child,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class DashboardSectionCard extends StatelessWidget {
  const DashboardSectionCard({
    super.key,
    this.title,
    this.trailing,
    required this.child,
    this.padding = const EdgeInsets.all(18),
  });

  final String? title;
  final Widget? trailing;
  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final stackHeader =
            constraints.maxWidth < 440 && title != null && trailing != null;

        return Container(
          width: double.infinity,
          padding: padding,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x12000000),
                blurRadius: 24,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (title != null || trailing != null) ...[
                if (stackHeader)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (title != null)
                        Text(
                          title!,
                          style: const TextStyle(
                            color: AppTheme.foreground,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      if (trailing != null) ...[
                        const SizedBox(height: 12),
                        SizedBox(width: double.infinity, child: trailing!),
                      ],
                    ],
                  )
                else
                  Row(
                    children: [
                      if (title != null)
                        Expanded(
                          child: Text(
                            title!,
                            style: const TextStyle(
                              color: AppTheme.foreground,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      if (trailing != null) trailing!,
                    ],
                  ),
                const SizedBox(height: 16),
              ],
              child,
            ],
          ),
        );
      },
    );
  }
}

class DashboardEmptyState extends StatelessWidget {
  const DashboardEmptyState({
    super.key,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final isPhone = MediaQuery.sizeOf(context).width < 480;

    return DashboardSectionCard(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.inbox_outlined,
                color: AppTheme.mutedForeground,
                size: 30,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.foreground,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            if (message != null) ...[
              const SizedBox(height: 8),
              Text(
                message!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppTheme.mutedForeground,
                  height: 1.5,
                ),
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 18),
              SizedBox(
                width: isPhone ? double.infinity : null,
                child: FilledButton(
                  onPressed: onAction,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(actionLabel!),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class DashboardRefreshList extends StatelessWidget {
  const DashboardRefreshList({
    super.key,
    required this.onRefresh,
    required this.children,
    this.padding = const EdgeInsets.fromLTRB(16, 16, 16, 120),
  });

  final Future<void> Function() onRefresh;
  final List<Widget> children;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final isPhone = MediaQuery.sizeOf(context).width < 480;

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: isPhone
            ? const EdgeInsets.fromLTRB(12, 12, 12, 100)
            : padding,
        children: children,
      ),
    );
  }
}

class DashboardStatusPill extends StatelessWidget {
  const DashboardStatusPill({
    super.key,
    required this.label,
    required this.color,
  });

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class DashboardMetricTile extends StatelessWidget {
  const DashboardMetricTile({
    super.key,
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 17, color: AppTheme.primary),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppTheme.foreground,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DashboardEntityCard extends StatelessWidget {
  const DashboardEntityCard({
    super.key,
    required this.title,
    this.subtitle,
    this.imageUrl,
    this.imageIcon = Icons.image_outlined,
    this.status,
    this.body,
    this.metrics = const [],
    this.actions = const [],
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final String? imageUrl;
  final IconData imageIcon;
  final Widget? status;
  final Widget? body;
  final List<Widget> metrics;
  final List<Widget> actions;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final trimmedImage = imageUrl?.trim();

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 420;

        return Container(
          padding: EdgeInsets.all(compact ? 14 : 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppTheme.border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0F000000),
                blurRadius: 18,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (compact) ...[
                _DashboardEntityImage(
                  imageUrl: trimmedImage,
                  icon: imageIcon,
                  width: double.infinity,
                  height: 170,
                ),
                const SizedBox(height: 14),
                _DashboardEntityHeader(
                  title: title,
                  subtitle: subtitle,
                  status: status,
                  trailing: trailing,
                ),
              ] else
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _DashboardEntityImage(
                      imageUrl: trimmedImage,
                      icon: imageIcon,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: _DashboardEntityHeader(
                        title: title,
                        subtitle: subtitle,
                        status: status,
                        trailing: trailing,
                      ),
                    ),
                  ],
                ),
              if (body != null) ...[
                const SizedBox(height: 14),
                body!,
              ],
              if (metrics.isNotEmpty) ...[
                const SizedBox(height: 14),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: metrics,
                ),
              ],
              if (actions.isNotEmpty) ...[
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: actions,
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class DashboardLoadingState extends StatelessWidget {
  const DashboardLoadingState({
    super.key,
    this.label = 'Loading dashboard section...',
  });

  final String label;

  @override
  Widget build(BuildContext context) {
    final isPhone = MediaQuery.sizeOf(context).width < 480;

    return DashboardSectionCard(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: isPhone ? 20 : 28),
        child: Column(
          children: [
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 2.6),
            ),
            const SizedBox(height: 14),
            Text(
              label,
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeaderText extends StatelessWidget {
  const _HeaderText({
    required this.title,
    required this.subtitle,
    this.compact = false,
  });

  final String title;
  final String subtitle;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: Colors.white,
            fontSize: compact ? 28 : 34,
            fontWeight: FontWeight.w900,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          style: TextStyle(
            color: Color(0xE6FFFFFF),
            fontSize: compact ? 14 : 16,
            fontWeight: FontWeight.w500,
            height: 1.45,
          ),
        ),
      ],
    );
  }
}

class _DashboardEntityImage extends StatelessWidget {
  const _DashboardEntityImage({
    required this.imageUrl,
    required this.icon,
    this.width = 86,
    this.height = 86,
  });

  final String? imageUrl;
  final IconData icon;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: width,
        height: height,
        color: const Color(0xFFF3F4F6),
        child: imageUrl != null && imageUrl!.isNotEmpty
            ? Image.network(
                imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _DashboardEntityImageFallback(icon: icon);
                },
              )
            : _DashboardEntityImageFallback(icon: icon),
      ),
    );
  }
}

class _DashboardEntityImageFallback extends StatelessWidget {
  const _DashboardEntityImageFallback({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFE8F3EF), Color(0xFFE0E7FF)],
        ),
      ),
      child: Icon(icon, color: AppTheme.primary, size: 34),
    );
  }
}

class _DashboardStatCard extends StatelessWidget {
  const _DashboardStatCard({
    required this.item,
    this.compact = false,
  });

  final DashboardStatItem item;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(compact ? 16 : 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 22,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: compact ? 42 : 46,
            height: compact ? 42 : 46,
            decoration: BoxDecoration(
              color: item.iconBackground ?? const Color(0xFFE8F3EF),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              item.icon,
              color: item.iconColor ?? AppTheme.primary,
              size: compact ? 20 : 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  item.label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppTheme.mutedForeground,
                    fontSize: compact ? 12 : 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    item.value,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AppTheme.foreground,
                      fontSize: compact ? 20 : 22,
                      fontWeight: FontWeight.w900,
                      height: 1.05,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardStatsLayout extends StatelessWidget {
  const _DashboardStatsLayout({
    required this.stats,
    required this.compact,
  });

  final List<DashboardStatItem> stats;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return SizedBox(
        height: 104,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: stats.length,
          separatorBuilder: (context, index) => const SizedBox(width: 12),
          itemBuilder: (context, index) {
            return SizedBox(
              width: 244,
              child: _DashboardStatCard(
                item: stats[index],
                compact: true,
              ),
            );
          },
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth >= 960
            ? 4
            : constraints.maxWidth >= 680
                ? 2
                : 1;

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: stats.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: crossAxisCount == 1 ? 2.8 : 2.2,
          ),
          itemBuilder: (context, index) {
            return _DashboardStatCard(item: stats[index]);
          },
        );
      },
    );
  }
}

class _DashboardEntityHeader extends StatelessWidget {
  const _DashboardEntityHeader({
    required this.title,
    required this.subtitle,
    required this.status,
    required this.trailing,
  });

  final String title;
  final String? subtitle;
  final Widget? status;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final stackTrailing = constraints.maxWidth < 280 && trailing != null;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (stackTrailing)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.foreground,
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 10),
                  trailing!,
                ],
              )
            else
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        height: 1.2,
                      ),
                    ),
                  ),
                  if (trailing != null) ...[
                    const SizedBox(width: 12),
                    trailing!,
                  ],
                ],
              ),
            if (subtitle != null && subtitle!.trim().isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                subtitle!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppTheme.mutedForeground,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  height: 1.35,
                ),
              ),
            ],
            if (status != null) ...[
              const SizedBox(height: 10),
              status!,
            ],
          ],
        );
      },
    );
  }
}
