import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../applications/providers/application_provider.dart';
import '../auth/models/user_model.dart';
import '../auth/providers/auth_provider.dart';
import '../dashboard/widgets/dashboard_utils.dart';
import '../dashboard/widgets/role_dashboard_scaffold.dart';
import '../leases/models/lease_model.dart';
import '../leases/providers/lease_provider.dart';
import '../listings/models/property_model.dart';
import '../listings/repositories/listing_repository.dart';
import '../transactions/models/transaction_model.dart';
import '../transactions/providers/transaction_provider.dart';
import 'providers/admin_provider.dart';

final adminAllAssetsProvider = FutureProvider<List<PropertyModel>>((ref) async {
  final user = ref.watch(authProvider).user;
  if (user == null || !user.isAdmin) {
    return const <PropertyModel>[];
  }

  return ref.watch(listingRepositoryProvider).getProperties();
});

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  String _propertyQuery = '';
  String _propertyFilter = 'all';
  String _transactionFilter = 'all';
  String _leaseFilter = 'all';
  String _verificationFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final users = ref.watch(adminUsersProvider).valueOrNull ?? const <UserModel>[];
    final allAssets =
        ref.watch(adminAllAssetsProvider).valueOrNull ?? const <PropertyModel>[];
    final transactions =
        ref.watch(transactionsProvider).valueOrNull ?? const <TransactionModel>[];
    final overview = ref.watch(adminOverviewProvider);

    final homeCount = allAssets.where((item) => item.isHome).length;
    final carCount = allAssets.where((item) => item.isCar).length;
    final now = DateTime.now();
    final monthlyRevenue = transactions
        .where(
          (item) =>
              item.isCompleted &&
              item.createdAt.month == now.month &&
              item.createdAt.year == now.year,
        )
        .fold<double>(0, (sum, item) => sum + item.amount);

    return RoleDashboardScaffold(
      title: 'Admin Dashboard',
      subtitle:
          'Monitor marketplace activity, moderation queues, transactions, leases, and verification reviews.',
      stats: [
        DashboardStatItem(
          label: 'Total Users',
          value: '${users.length}',
          icon: Icons.group_outlined,
        ),
        DashboardStatItem(
          label: 'Total Homes',
          value: '$homeCount',
          icon: Icons.home_work_outlined,
        ),
        DashboardStatItem(
          label: 'Total Cars',
          value: '$carCount',
          icon: Icons.directions_car_outlined,
          iconColor: const Color(0xFF1D4ED8),
          iconBackground: const Color(0xFFE0E7FF),
        ),
        DashboardStatItem(
          label: 'Monthly Revenue',
          value: formatDashboardMoney(monthlyRevenue),
          icon: Icons.account_balance_wallet_outlined,
          iconColor: const Color(0xFF059669),
          iconBackground: const Color(0xFFDCFCE7),
        ),
      ],
      tabs: [
        DashboardTabItem(
          label: 'Overview',
          child: _AdminOverviewTab(overview: overview),
        ),
        DashboardTabItem(
          label: 'Properties',
          child: _AdminPropertiesTab(
            query: _propertyQuery,
            filter: _propertyFilter,
            onQueryChanged: (value) => setState(() => _propertyQuery = value),
            onFilterChanged: (value) => setState(() => _propertyFilter = value),
          ),
        ),
        DashboardTabItem(
          label: 'Transactions',
          child: _AdminTransactionsTab(
            filter: _transactionFilter,
            onFilterChanged: (value) =>
                setState(() => _transactionFilter = value),
          ),
        ),
        DashboardTabItem(
          label: 'Leases',
          child: _AdminLeasesTab(
            filter: _leaseFilter,
            onFilterChanged: (value) => setState(() => _leaseFilter = value),
          ),
        ),
        DashboardTabItem(
          label: 'Verifications',
          child: _AdminVerificationsTab(
            filter: _verificationFilter,
            onFilterChanged: (value) =>
                setState(() => _verificationFilter = value),
          ),
        ),
      ],
    );
  }
}

class _AdminOverviewTab extends ConsumerWidget {
  const _AdminOverviewTab({required this.overview});

  final AdminOverviewData overview;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingPropertiesAsync = ref.watch(pendingPropertiesProvider);
    final pendingAgentsAsync = ref.watch(pendingAgentsProvider);
    final transactions =
        ref.watch(transactionsProvider).valueOrNull ??
        const <TransactionModel>[];
    final leases =
        ref.watch(leasesProvider).valueOrNull ?? const <LeaseModel>[];

    return DashboardRefreshList(
      onRefresh: () async {
        ref.invalidate(adminUsersProvider);
        ref.invalidate(pendingPropertiesProvider);
        ref.invalidate(pendingAgentsProvider);
        ref.invalidate(adminAllAssetsProvider);
        ref.invalidate(transactionsProvider);
        ref.invalidate(leasesProvider);
        ref.invalidate(allApplicationsProvider);
        await ref.read(adminUsersProvider.future);
      },
      children: [
        DashboardSectionCard(
          title: 'Activity snapshot',
          child: Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              DashboardMetricTile(
                icon: Icons.badge_outlined,
                label: '${overview.pendingAgents} pending agents',
              ),
              DashboardMetricTile(
                icon: Icons.approval_outlined,
                label: '${overview.pendingProperties} pending properties',
              ),
              DashboardMetricTile(
                icon: Icons.payments_outlined,
                label: '${transactions.length} transactions tracked',
              ),
              DashboardMetricTile(
                icon: Icons.description_outlined,
                label: '${leases.length} lease records',
              ),
              DashboardMetricTile(
                icon: Icons.assignment_outlined,
                label: '${overview.totalApplications} applications',
              ),
            ],
          ),
        ),
        pendingPropertiesAsync.when(
          data: (properties) => DashboardSectionCard(
            title: 'Pending property verifications',
            trailing: TextButton(
              onPressed: () => DefaultTabController.of(context)?.animateTo(4),
              child: const Text('View all'),
            ),
            child: properties.isEmpty
                ? const Text(
                    'No pending property verifications right now.',
                    style: TextStyle(color: AppTheme.mutedForeground),
                  )
                : Column(
                    children: [
                      for (final property in properties.take(4)) ...[
                        _AdminPropertyRow(property: property),
                        if (property != properties.take(4).last)
                          const SizedBox(height: 12),
                      ],
                    ],
                  ),
          ),
          loading: () =>
              const DashboardLoadingState(label: 'Loading pending properties...'),
          error: (error, _) => DashboardEmptyState(
            title: 'Pending properties unavailable',
            message: error.toString().replaceFirst('Exception: ', ''),
          ),
        ),
        pendingAgentsAsync.when(
          data: (agents) => DashboardSectionCard(
            title: 'Pending agent verifications',
            child: agents.isEmpty
                ? const Text(
                    'No pending agent reviews right now.',
                    style: TextStyle(color: AppTheme.mutedForeground),
                  )
                : Column(
                    children: [
                      for (final user in agents.take(4)) ...[
                        _AdminUserRow(user: user),
                        if (user != agents.take(4).last)
                          const SizedBox(height: 12),
                      ],
                    ],
                  ),
          ),
          loading: () =>
              const DashboardLoadingState(label: 'Loading pending agents...'),
          error: (error, _) => DashboardEmptyState(
            title: 'Pending agents unavailable',
            message: error.toString().replaceFirst('Exception: ', ''),
          ),
        ),
      ],
    );
  }
}

class _AdminPropertiesTab extends ConsumerWidget {
  const _AdminPropertiesTab({
    required this.query,
    required this.filter,
    required this.onQueryChanged,
    required this.onFilterChanged,
  });

  final String query;
  final String filter;
  final ValueChanged<String> onQueryChanged;
  final ValueChanged<String> onFilterChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetsAsync = ref.watch(adminAllAssetsProvider);

    return assetsAsync.when(
      data: (assets) {
        final normalizedQuery = query.trim().toLowerCase();
        final filtered = assets.where((asset) {
          final matchesQuery = normalizedQuery.isEmpty ||
              asset.title.toLowerCase().contains(normalizedQuery) ||
              asset.locationLabel.toLowerCase().contains(normalizedQuery);
          final matchesFilter = switch (filter) {
            'pending' => !asset.isVerified,
            'homes' => asset.isHome,
            'cars' => asset.isCar,
            _ => true,
          };
          return matchesQuery && matchesFilter;
        }).toList(growable: false);

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(adminAllAssetsProvider);
            await ref.read(adminAllAssetsProvider.future);
          },
          children: [
            DashboardSectionCard(
              title: 'Marketplace moderation',
              child: Column(
                children: [
                  TextField(
                    onChanged: onQueryChanged,
                    decoration: InputDecoration(
                      hintText: 'Search by title or location',
                      prefixIcon: const Icon(Icons.search_rounded),
                      filled: true,
                      fillColor: AppTheme.inputBackground,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: AppTheme.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: AppTheme.border),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      _AdminFilterChip(
                        label: 'All',
                        selected: filter == 'all',
                        onTap: () => onFilterChanged('all'),
                      ),
                      _AdminFilterChip(
                        label: 'Pending',
                        selected: filter == 'pending',
                        onTap: () => onFilterChanged('pending'),
                      ),
                      _AdminFilterChip(
                        label: 'Homes',
                        selected: filter == 'homes',
                        onTap: () => onFilterChanged('homes'),
                      ),
                      _AdminFilterChip(
                        label: 'Cars',
                        selected: filter == 'cars',
                        onTap: () => onFilterChanged('cars'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (filtered.isEmpty)
              const DashboardEmptyState(
                title: 'No listings match the current filter',
                message: 'Try a different search or moderation filter.',
              )
            else
              for (final property in filtered)
                _AdminPropertyRow(property: property),
          ],
        );
      },
      loading: () => DashboardRefreshList(
        onRefresh: _noopRefresh,
        children: const [
          DashboardLoadingState(label: 'Loading properties...'),
        ],
      ),
      error: (error, _) => DashboardRefreshList(
        onRefresh: () async {
          ref.invalidate(adminAllAssetsProvider);
          await ref.read(adminAllAssetsProvider.future);
        },
        children: [
          DashboardEmptyState(
            title: 'Property moderation unavailable',
            message: error.toString().replaceFirst('Exception: ', ''),
          ),
        ],
      ),
    );
  }
}

class _AdminTransactionsTab extends ConsumerWidget {
  const _AdminTransactionsTab({
    required this.filter,
    required this.onFilterChanged,
  });

  final String filter;
  final ValueChanged<String> onFilterChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsAsync = ref.watch(transactionsProvider);

    return transactionsAsync.when(
      data: (transactions) {
        final filtered = transactions.where((item) {
          return switch (filter) {
            'completed' => item.isCompleted,
            'pending' => !item.isCompleted,
            _ => true,
          };
        }).toList(growable: false);

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(transactionsProvider);
            await ref.read(transactionsProvider.future);
          },
          children: [
            DashboardSectionCard(
              title: 'Transaction ledger',
              child: Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _AdminFilterChip(
                    label: 'All',
                    selected: filter == 'all',
                    onTap: () => onFilterChanged('all'),
                  ),
                  _AdminFilterChip(
                    label: 'Completed',
                    selected: filter == 'completed',
                    onTap: () => onFilterChanged('completed'),
                  ),
                  _AdminFilterChip(
                    label: 'Pending',
                    selected: filter == 'pending',
                    onTap: () => onFilterChanged('pending'),
                  ),
                ],
              ),
            ),
            if (filtered.isEmpty)
              const DashboardEmptyState(
                title: 'No transactions for this filter',
                message: 'Switch the filter to inspect more payment activity.',
              )
            else
              for (final transaction in filtered)
                _AdminTransactionRow(transaction: transaction),
          ],
        );
      },
      loading: () => DashboardRefreshList(
        onRefresh: _noopRefresh,
        children: const [
          DashboardLoadingState(label: 'Loading transactions...'),
        ],
      ),
      error: (error, _) => DashboardRefreshList(
        onRefresh: () async {
          ref.invalidate(transactionsProvider);
          await ref.read(transactionsProvider.future);
        },
        children: [
          DashboardEmptyState(
            title: 'Transactions unavailable',
            message: error.toString().replaceFirst('Exception: ', ''),
          ),
        ],
      ),
    );
  }
}

class _AdminLeasesTab extends ConsumerWidget {
  const _AdminLeasesTab({
    required this.filter,
    required this.onFilterChanged,
  });

  final String filter;
  final ValueChanged<String> onFilterChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leasesAsync = ref.watch(leasesProvider);

    return leasesAsync.when(
      data: (leases) {
        final filtered = leases.where((item) {
          return switch (filter) {
            'active' => item.isActive,
            'pending' => item.isPending,
            'cancellation' => item.isCancellationPending,
            _ => true,
          };
        }).toList(growable: false);

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(leasesProvider);
            await ref.read(leasesProvider.future);
          },
          children: [
            DashboardSectionCard(
              title: 'Lease monitoring',
              child: Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _AdminFilterChip(
                    label: 'All',
                    selected: filter == 'all',
                    onTap: () => onFilterChanged('all'),
                  ),
                  _AdminFilterChip(
                    label: 'Active',
                    selected: filter == 'active',
                    onTap: () => onFilterChanged('active'),
                  ),
                  _AdminFilterChip(
                    label: 'Pending',
                    selected: filter == 'pending',
                    onTap: () => onFilterChanged('pending'),
                  ),
                  _AdminFilterChip(
                    label: 'Cancellation',
                    selected: filter == 'cancellation',
                    onTap: () => onFilterChanged('cancellation'),
                  ),
                ],
              ),
            ),
            if (filtered.isEmpty)
              const DashboardEmptyState(
                title: 'No leases for this filter',
                message: 'Adjust the lease status filter to inspect more agreements.',
              )
            else
              for (final lease in filtered)
                _AdminLeaseRow(lease: lease),
          ],
        );
      },
      loading: () => DashboardRefreshList(
        onRefresh: _noopRefresh,
        children: const [
          DashboardLoadingState(label: 'Loading leases...'),
        ],
      ),
      error: (error, _) => DashboardRefreshList(
        onRefresh: () async {
          ref.invalidate(leasesProvider);
          await ref.read(leasesProvider.future);
        },
        children: [
          DashboardEmptyState(
            title: 'Leases unavailable',
            message: error.toString().replaceFirst('Exception: ', ''),
          ),
        ],
      ),
    );
  }
}

class _AdminVerificationsTab extends ConsumerWidget {
  const _AdminVerificationsTab({
    required this.filter,
    required this.onFilterChanged,
  });

  final String filter;
  final ValueChanged<String> onFilterChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingPropertiesAsync = ref.watch(pendingPropertiesProvider);
    final pendingAgentsAsync = ref.watch(pendingAgentsProvider);

    return DashboardRefreshList(
      onRefresh: () async {
        ref.invalidate(pendingPropertiesProvider);
        ref.invalidate(pendingAgentsProvider);
        await ref.read(pendingPropertiesProvider.future);
      },
      children: [
        DashboardSectionCard(
          title: 'Verification queues',
          child: Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _AdminFilterChip(
                label: 'All',
                selected: filter == 'all',
                onTap: () => onFilterChanged('all'),
              ),
              _AdminFilterChip(
                label: 'Properties',
                selected: filter == 'properties',
                onTap: () => onFilterChanged('properties'),
              ),
              _AdminFilterChip(
                label: 'Agents',
                selected: filter == 'agents',
                onTap: () => onFilterChanged('agents'),
              ),
            ],
          ),
        ),
        if (filter != 'agents')
          pendingPropertiesAsync.when(
            data: (properties) => DashboardSectionCard(
              title: 'Property verifications',
              child: properties.isEmpty
                  ? const Text(
                      'No pending property documents.',
                      style: TextStyle(color: AppTheme.mutedForeground),
                    )
                  : Column(
                      children: [
                        for (final property in properties)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _AdminPropertyRow(property: property),
                          ),
                      ],
                    ),
            ),
            loading: () => const DashboardLoadingState(
              label: 'Loading property verifications...',
            ),
            error: (error, _) => DashboardEmptyState(
              title: 'Property verifications unavailable',
              message: error.toString().replaceFirst('Exception: ', ''),
            ),
          ),
        if (filter != 'properties')
          pendingAgentsAsync.when(
            data: (agents) => DashboardSectionCard(
              title: 'Agent verifications',
              child: agents.isEmpty
                  ? const Text(
                      'No pending agent documents.',
                      style: TextStyle(color: AppTheme.mutedForeground),
                    )
                  : Column(
                      children: [
                        for (final user in agents)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _AdminUserRow(user: user),
                          ),
                      ],
                    ),
            ),
            loading: () => const DashboardLoadingState(
              label: 'Loading agent verifications...',
            ),
            error: (error, _) => DashboardEmptyState(
              title: 'Agent verifications unavailable',
              message: error.toString().replaceFirst('Exception: ', ''),
            ),
          ),
      ],
    );
  }
}

class _AdminPropertyRow extends StatelessWidget {
  const _AdminPropertyRow({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context) {
    return DashboardEntityCard(
      title: property.title,
      subtitle: property.locationLabel,
      imageUrl: property.mainImage,
      imageIcon:
          property.isCar ? Icons.directions_car_outlined : Icons.home_work_outlined,
      status: DashboardStatusPill(
        label: property.isVerified ? 'Verified' : 'Pending review',
        color: property.isVerified
            ? const Color(0xFF059669)
            : const Color(0xFFD97706),
      ),
      metrics: [
        DashboardMetricTile(
          icon: Icons.sell_outlined,
          label: formatDashboardMoney(property.price),
        ),
        DashboardMetricTile(
          icon: Icons.category_outlined,
          label: property.isCar
              ? prettyDashboardLabel(property.brand ?? 'Car')
              : prettyDashboardLabel(property.propertyType ?? 'Property'),
        ),
      ],
      actions: [
        FilledButton.icon(
          onPressed: () => context.push('/admin/properties/${property.id}'),
          icon: const Icon(Icons.fact_check_outlined, size: 18),
          label: const Text('Review'),
        ),
        OutlinedButton.icon(
          onPressed: () => context.push('/property-detail', extra: property),
          icon: const Icon(Icons.visibility_outlined, size: 18),
          label: const Text('View'),
        ),
      ],
    );
  }
}

class _AdminUserRow extends StatelessWidget {
  const _AdminUserRow({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    return DashboardEntityCard(
      title: user.name,
      subtitle: user.email,
      imageUrl: user.profileImage,
      imageIcon: Icons.person_outline_rounded,
      status: DashboardStatusPill(
        label: user.verified ? 'Verified' : 'Pending review',
        color: user.verified
            ? const Color(0xFF059669)
            : const Color(0xFFD97706),
      ),
      metrics: [
        DashboardMetricTile(
          icon: Icons.badge_outlined,
          label: prettyDashboardLabel(user.role),
        ),
        DashboardMetricTile(
          icon: Icons.calendar_today_outlined,
          label: formatDashboardDate(user.createdAt),
        ),
      ],
      actions: [
        FilledButton.icon(
          onPressed: () => context.push('/admin/agents/${user.id}'),
          icon: const Icon(Icons.verified_user_outlined, size: 18),
          label: const Text('Review'),
        ),
      ],
    );
  }
}

class _AdminTransactionRow extends StatelessWidget {
  const _AdminTransactionRow({required this.transaction});

  final TransactionModel transaction;

  @override
  Widget build(BuildContext context) {
    return DashboardEntityCard(
      title:
          transaction.property?.title ?? prettyDashboardLabel(transaction.type),
      subtitle:
          transaction.property?.locationLabel ?? formatDashboardDate(transaction.createdAt),
      imageIcon: Icons.payments_outlined,
      status: DashboardStatusPill(
        label: prettyDashboardLabel(transaction.status),
        color: dashboardStatusColor(transaction.status),
      ),
      body: Text(
        'Payer: ${transaction.payer?.name ?? 'Unknown'}  •  Payee: ${transaction.payee?.name ?? 'Unknown'}',
        style: const TextStyle(
          color: AppTheme.foreground,
          fontWeight: FontWeight.w700,
        ),
      ),
      metrics: [
        DashboardMetricTile(
          icon: Icons.account_balance_wallet_outlined,
          label: formatDashboardMoney(transaction.amount),
        ),
        DashboardMetricTile(
          icon: Icons.receipt_long_outlined,
          label: prettyDashboardLabel(transaction.type),
        ),
      ],
      actions: [
        if (transaction.isCompleted)
          FilledButton.icon(
            onPressed: () => context.push(
              '/transactions/receipt/${transaction.id}',
              extra: transaction,
            ),
            icon: const Icon(Icons.receipt_long_outlined, size: 18),
            label: const Text('Receipt'),
          ),
      ],
    );
  }
}

class _AdminLeaseRow extends StatelessWidget {
  const _AdminLeaseRow({required this.lease});

  final LeaseModel lease;

  @override
  Widget build(BuildContext context) {
    return DashboardEntityCard(
      title: lease.property?.title ?? 'Lease agreement',
      subtitle: lease.property?.locationLabel ?? 'Property information unavailable',
      imageUrl: lease.property?.mainImage,
      imageIcon: Icons.description_outlined,
      status: DashboardStatusPill(
        label: prettyDashboardLabel(lease.status),
        color: dashboardStatusColor(lease.status),
      ),
      body: Text(
        'Customer: ${lease.customer?.name ?? 'Unknown'}  •  Owner: ${lease.owner?.name ?? 'Unknown'}',
        style: const TextStyle(
          color: AppTheme.foreground,
          fontWeight: FontWeight.w700,
        ),
      ),
      metrics: [
        DashboardMetricTile(
          icon: Icons.payments_outlined,
          label: formatDashboardMoney(lease.recurringAmount ?? lease.totalPrice),
        ),
        DashboardMetricTile(
          icon: Icons.calendar_today_outlined,
          label:
              '${formatDashboardDate(lease.startDate)} - ${formatDashboardDate(lease.endDate)}',
        ),
      ],
      actions: [
        FilledButton.icon(
          onPressed: () => context.push('/leases/${lease.id}'),
          icon: const Icon(Icons.visibility_outlined, size: 18),
          label: const Text('View detail'),
        ),
      ],
    );
  }
}

class _AdminFilterChip extends StatelessWidget {
  const _AdminFilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      selected: selected,
      label: Text(label),
      onSelected: (_) => onTap(),
      labelStyle: TextStyle(
        color: selected ? Colors.white : AppTheme.foreground,
        fontWeight: FontWeight.w700,
      ),
      selectedColor: AppTheme.primary,
      backgroundColor: const Color(0xFFF8FAFC),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(
          color: selected ? AppTheme.primary : AppTheme.border,
        ),
      ),
    );
  }
}

Future<void> _noopRefresh() async {}
