import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../applications/models/application_model.dart';
import '../applications/providers/application_provider.dart';
import '../auth/models/user_model.dart';
import '../auth/providers/auth_provider.dart';
import '../dashboard/screens/my_listings_screen.dart';
import '../leases/models/lease_model.dart';
import '../leases/providers/lease_provider.dart';
import '../listings/models/property_model.dart';
import '../listings/repositories/listing_repository.dart';
import '../maintenance/models/maintenance_request_model.dart';
import '../maintenance/providers/maintenance_provider.dart';
import '../payments/providers/payment_provider.dart';
import '../transactions/models/transaction_model.dart';
import '../transactions/providers/transaction_provider.dart';
import 'widgets/dashboard_utils.dart';
import 'widgets/role_dashboard_scaffold.dart';

class OwnerDashboardScreen extends ConsumerStatefulWidget {
  const OwnerDashboardScreen({super.key, this.initialTab});

  final String? initialTab;

  @override
  ConsumerState<OwnerDashboardScreen> createState() =>
      _OwnerDashboardScreenState();
}

class _OwnerDashboardScreenState extends ConsumerState<OwnerDashboardScreen> {
  final Set<String> _expandedSchedules = <String>{};
  String _transactionDateFilter = 'all';
  String _transactionStatusFilter = 'all';

  void _toggleSchedule(String leaseId) {
    setState(() {
      if (_expandedSchedules.contains(leaseId)) {
        _expandedSchedules.remove(leaseId);
      } else {
        _expandedSchedules.add(leaseId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final properties =
        ref.watch(myListingsProvider).valueOrNull ?? const <PropertyModel>[];
    final applications =
        ref.watch(managedApplicationsProvider).valueOrNull ??
        const <PropertyApplication>[];
    final maintenance =
        ref.watch(maintenanceRequestsProvider).valueOrNull ??
        const <MaintenanceRequestModel>[];
    final ownerPropertyIds = properties
        .map((property) => property.id.trim())
        .where((id) => id.isNotEmpty)
        .toSet();
    final ownerMaintenance = maintenance.where((request) {
      final requestPropertyId = request.propertyId.trim();
      final nestedPropertyId = request.property?.id.trim() ?? '';
      return ownerPropertyIds.contains(requestPropertyId) ||
          ownerPropertyIds.contains(nestedPropertyId);
    }).toList(growable: false);
    final allTransactions =
        ref.watch(transactionsProvider).valueOrNull ?? const <TransactionModel>[];

    final ownerTransactions = allTransactions.where((transaction) {
      final payeeId = transaction.payee?.id.trim();
      if (user == null) {
        return false;
      }
      if (payeeId == null || payeeId.isEmpty) {
        return true;
      }
      return payeeId == user.id;
    }).toList(growable: false);

    final completedRevenue = ownerTransactions
        .where((transaction) => transaction.isCompleted)
        .fold<double>(0, (sum, transaction) => sum + transaction.amount);

    final stats = [
      DashboardStatItem(
        label: 'My Properties',
        value: '${properties.length}',
        icon: Icons.home_work_outlined,
      ),
      DashboardStatItem(
        label: 'Total Revenue',
        value: formatDashboardMoney(completedRevenue),
        icon: Icons.account_balance_wallet_outlined,
        iconColor: const Color(0xFF1D4ED8),
        iconBackground: const Color(0xFFE0E7FF),
      ),
      DashboardStatItem(
        label: 'Applications',
        value: '${applications.length}',
        icon: Icons.description_outlined,
      ),
      DashboardStatItem(
        label: 'Maintenance',
        value: '${ownerMaintenance.length}',
        icon: Icons.handyman_outlined,
        iconColor: const Color(0xFFD97706),
        iconBackground: const Color(0xFFFFEDD5),
      ),
    ];

    final tabs = [
      const DashboardTabItem(
        label: 'My Properties',
        child: _OwnerPropertiesTab(),
      ),
      const DashboardTabItem(
        label: 'Applications',
        child: _OwnerApplicationsTab(),
      ),
      DashboardTabItem(
        label: 'Leases',
        child: _OwnerLeasesTab(
          expandedSchedules: _expandedSchedules,
          onToggleSchedule: _toggleSchedule,
          ownerTransactions: ownerTransactions,
        ),
      ),
      DashboardTabItem(
        label: 'Maintenance',
        child: _OwnerMaintenanceTab(propertyIds: ownerPropertyIds),
      ),
      DashboardTabItem(
        label: 'Transactions',
        child: _OwnerTransactionsTab(
          ownerTransactions: ownerTransactions,
          totalRevenue: completedRevenue,
          dateFilter: _transactionDateFilter,
          statusFilter: _transactionStatusFilter,
          onDateFilterChanged: (value) {
            setState(() => _transactionDateFilter = value);
          },
          onStatusFilterChanged: (value) {
            setState(() => _transactionStatusFilter = value);
          },
        ),
      ),
      DashboardTabItem(
        label: 'Payout',
        child: _OwnerPayoutTab(userName: user?.name ?? ''),
      ),
    ];

    int initialTabIndex = 0;
    if (widget.initialTab != null) {
      final tabIdx = tabs.indexWhere(
        (t) => t.label.toLowerCase() == widget.initialTab!.toLowerCase(),
      );
      if (tabIdx != -1) {
        initialTabIndex = tabIdx;
      }
    }

    return RoleDashboardScaffold(
      title: 'Owner Dashboard',
      subtitle: 'Manage your real estate portfolio and tenants',
      usePillTabs: true,
      headerAction: FilledButton.icon(
        onPressed: () => context.push('/add-listing'),
        style: FilledButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: AppTheme.primary,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        icon: const Icon(Icons.add_rounded, size: 18),
        label: const Text(
          'Add Property',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      stats: stats,
      tabs: tabs,
      initialTabIndex: initialTabIndex,
    );
  }
}

class _OwnerPropertiesTab extends ConsumerWidget {
  const _OwnerPropertiesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertiesAsync = ref.watch(myListingsProvider);

    return propertiesAsync.when(
      data: (properties) {
        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(myListingsProvider);
            await ref.read(myListingsProvider.future);
          },
          children: [
            const _OwnerSectionHeader(
              title: 'My Properties',
              subtitle:
                  'Review, update, and manage every listing in your portfolio.',
            ),
            if (properties.isEmpty)
              DashboardSectionCard(
                child: _OwnerDashedEmptyState(
                  icon: Icons.home_work_outlined,
                  title: 'No properties found',
                  message: 'Start by adding your first property listing.',
                  actionLabel: 'Add New Property',
                  onAction: () => context.push('/add-listing'),
                ),
              )
            else
              LayoutBuilder(
                builder: (context, constraints) {
                  final crossAxisCount = constraints.maxWidth >= 1100
                      ? 3
                      : constraints.maxWidth >= 760
                      ? 2
                      : 1;

                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: properties.length,
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: crossAxisCount == 1 ? 0.78 : 0.76,
                    ),
                    itemBuilder: (context, index) {
                      return _OwnerPropertyCard(property: properties[index]);
                    },
                  );
                },
              ),
          ],
        );
      },
      loading: () => DashboardRefreshList(
        onRefresh: _noopRefresh,
        children: const [
          DashboardLoadingState(label: 'Loading owner properties...'),
        ],
      ),
      error: (error, _) => DashboardRefreshList(
        onRefresh: () async {
          ref.invalidate(myListingsProvider);
          await ref.read(myListingsProvider.future);
        },
        children: [
          DashboardSectionCard(
            child: _OwnerErrorState(
              title: 'Error loading properties',
              message: error.toString().replaceFirst('Exception: ', ''),
              onRetry: () async {
                ref.invalidate(myListingsProvider);
                await ref.read(myListingsProvider.future);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerApplicationsTab extends ConsumerWidget {
  const _OwnerApplicationsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final applicationsAsync = ref.watch(managedApplicationsProvider);
    final actionState = ref.watch(applicationStatusUpdateProvider);

    return applicationsAsync.when(
      data: (applications) {
        final pending = applications.where((item) => item.isPending).length;
        final accepted = applications.where((item) => item.isAccepted).length;

        print('[OWNER_DASHBOARD] Applications tab build: ${applications.length} items (${pending} pending, ${accepted} accepted)');

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(managedApplicationsProvider);
            await ref.read(managedApplicationsProvider.future);
          },
          children: [
            _OwnerSectionHeader(
              title: 'Property Applications',
              subtitle: 'Review and manage incoming property applications',
              trailing: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _OwnerCountBadge(
                    icon: Icons.schedule_outlined,
                    label: '$pending Pending',
                    iconColor: const Color(0xFF2563EB),
                  ),
                  _OwnerCountBadge(
                    icon: Icons.check_circle_outline_rounded,
                    label: '$accepted Accepted',
                    iconColor: const Color(0xFF16A34A),
                  ),
                ],
              ),
            ),
            if (applications.isEmpty)
              DashboardSectionCard(
                child: _OwnerDashedEmptyState(
                  icon: Icons.assignment_outlined,
                  title: 'No applications found',
                  message:
                      'When potential customers apply for your properties, they will appear here.',
                ),
              )
            else
              ...applications.map(
                (application) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _OwnerApplicationCard(
                    application: application,
                    isBusy: actionState.isLoading,
                  ),
                ),
              ),
          ],
        );
      },
      loading: () => DashboardRefreshList(
        onRefresh: _noopRefresh,
        children: const [
          DashboardLoadingState(label: 'Loading applications...'),
        ],
      ),
      error: (error, _) => DashboardRefreshList(
        onRefresh: () async {
          ref.invalidate(managedApplicationsProvider);
          await ref.read(managedApplicationsProvider.future);
        },
        children: [
          DashboardSectionCard(
            child: DashboardEmptyState(
              title: 'Applications unavailable',
              message: error.toString().replaceFirst('Exception: ', ''),
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerLeasesTab extends ConsumerWidget {
  const _OwnerLeasesTab({
    required this.expandedSchedules,
    required this.onToggleSchedule,
    required this.ownerTransactions,
  });

  final Set<String> expandedSchedules;
  final ValueChanged<String> onToggleSchedule;
  final List<TransactionModel> ownerTransactions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leasesAsync = ref.watch(leasesProvider);
    final applications =
        ref.watch(managedApplicationsProvider).valueOrNull ??
        const <PropertyApplication>[];
    final actionState = ref.watch(leaseActionProvider);

    return leasesAsync.when(
      data: (leases) {
        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(leasesProvider);
            await ref.read(leasesProvider.future);
          },
          children: [
            DashboardSectionCard(
              padding: EdgeInsets.zero,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(22, 22, 22, 0),
                    child: _OwnerSectionHeader(
                      title: 'Active Agreements',
                      subtitle:
                          'Manage and track your formal lease documentation',
                      removeTopSpacing: true,
                      trailing: FilledButton.icon(
                        onPressed: () => _startLeaseCreation(
                          context,
                          applications.where((item) => item.isAccepted).toList(),
                        ),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                        ),
                        icon: const Icon(Icons.add_rounded, size: 18),
                        label: const Text(
                          'Create New Lease',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(22),
                    child: leases.isEmpty
                        ? const _OwnerDashedEmptyState(
                            icon: Icons.description_outlined,
                            title: 'No active leases',
                            message:
                                "You don't have any formal lease agreements at the moment.",
                          )
                        : Column(
                            children: leases
                                .map(
                                  (lease) => Padding(
                                    padding: const EdgeInsets.only(bottom: 16),
                                    child: _OwnerLeaseCard(
                                      lease: lease,
                                      isBusy: actionState.isLoading,
                                      isExpanded: expandedSchedules.contains(
                                        lease.id,
                                      ),
                                      ownerTransactions: ownerTransactions,
                                      onToggleSchedule: () =>
                                          onToggleSchedule(lease.id),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                  ),
                ],
              ),
            ),
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
          DashboardSectionCard(
            child: DashboardEmptyState(
              title: 'Leases unavailable',
              message: error.toString().replaceFirst('Exception: ', ''),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _startLeaseCreation(
    BuildContext context,
    List<PropertyApplication> acceptedApplications,
  ) async {
    final PropertyApplication? initialApplication = acceptedApplications.length ==
            1
        ? acceptedApplications.first
        : null;

    context.push(
      '/dashboard/owner/lease/create',
      extra: initialApplication == null
          ? null
          : {'application': initialApplication},
    );
  }
}

class _OwnerMaintenanceTab extends ConsumerWidget {
  const _OwnerMaintenanceTab({required this.propertyIds});

  final Set<String> propertyIds;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(maintenanceRequestsProvider);
    final actionState = ref.watch(maintenanceActionProvider);

    return requestsAsync.when(
      data: (requests) {
        final ownerRequests = requests.where((request) {
          final requestPropertyId = request.propertyId.trim();
          final nestedPropertyId = request.property?.id.trim() ?? '';
          return propertyIds.contains(requestPropertyId) ||
              propertyIds.contains(nestedPropertyId);
        }).toList(growable: false);

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(maintenanceRequestsProvider);
            await ref.read(maintenanceRequestsProvider.future);
          },
          children: [
            const _OwnerSectionHeader(
              title: 'Maintenance Management',
              subtitle:
                  'Monitor and resolve property maintenance requests',
            ),
            if (ownerRequests.isEmpty)
              DashboardSectionCard(
                child: const _OwnerDashedEmptyState(
                  icon: Icons.handyman_outlined,
                  title: 'No maintenance requests',
                  message:
                      'All clear! No pending issues at the moment.',
                ),
              )
            else
              ...ownerRequests.map(
                (request) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _OwnerMaintenanceCard(
                    request: request,
                    isBusy: actionState.isLoading,
                  ),
                ),
              ),
          ],
        );
      },
      loading: () => DashboardRefreshList(
        onRefresh: _noopRefresh,
        children: const [
          DashboardLoadingState(label: 'Loading maintenance requests...'),
        ],
      ),
      error: (error, _) => DashboardRefreshList(
        onRefresh: () async {
          ref.invalidate(maintenanceRequestsProvider);
          await ref.read(maintenanceRequestsProvider.future);
        },
        children: [
          DashboardSectionCard(
            child: DashboardEmptyState(
              title: 'Maintenance unavailable',
              message: error.toString().replaceFirst('Exception: ', ''),
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerTransactionsTab extends ConsumerWidget {
  const _OwnerTransactionsTab({
    required this.ownerTransactions,
    required this.totalRevenue,
    required this.dateFilter,
    required this.statusFilter,
    required this.onDateFilterChanged,
    required this.onStatusFilterChanged,
  });

  final List<TransactionModel> ownerTransactions;
  final double totalRevenue;
  final String dateFilter;
  final String statusFilter;
  final ValueChanged<String> onDateFilterChanged;
  final ValueChanged<String> onStatusFilterChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsAsync = ref.watch(transactionsProvider);

    return transactionsAsync.when(
      data: (_) {
        final filteredTransactions = ownerTransactions.where((transaction) {
          final matchesDate = _matchesOwnerTransactionDateFilter(
            transaction.createdAt,
            dateFilter,
          );
          final matchesStatus =
              statusFilter == 'all' ||
              transaction.status.toUpperCase() == statusFilter.toUpperCase();
          return matchesDate && matchesStatus;
        }).toList(growable: false);

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(transactionsProvider);
            await ref.read(transactionsProvider.future);
          },
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 720;

                return compact
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const _OwnerSectionHeader(
                            title: 'My Transactions',
                            subtitle:
                                'Track payment activity across your properties',
                          ),
                          const SizedBox(height: 12),
                          _OwnerRevenueSummaryCard(totalRevenue: totalRevenue),
                        ],
                      )
                    : Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Expanded(
                            child: _OwnerSectionHeader(
                              title: 'My Transactions',
                              subtitle:
                                  'Track payment activity across your properties',
                              removeTopSpacing: true,
                            ),
                          ),
                          const SizedBox(width: 16),
                          _OwnerRevenueSummaryCard(totalRevenue: totalRevenue),
                        ],
                      );
              },
            ),
            DashboardSectionCard(
              padding: EdgeInsets.zero,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF8FAFC),
                      border: Border(
                        bottom: BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                    ),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final compact = constraints.maxWidth < 620;

                        return compact
                            ? Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(
                                        Icons.description_outlined,
                                        color: AppTheme.primary,
                                        size: 20,
                                      ),
                                      SizedBox(width: 8),
                                      Text(
                                        'Transaction History',
                                        style: TextStyle(
                                          color: AppTheme.foreground,
                                          fontSize: 18,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  Wrap(
                                    spacing: 10,
                                    runSpacing: 10,
                                    children: [
                                      _OwnerFilterSelect(
                                        value: dateFilter,
                                        width: 132,
                                        items: const [
                                          ('all', 'All Time'),
                                          ('today', 'Today'),
                                          ('yesterday', 'Yesterday'),
                                          ('this-month', 'This Month'),
                                          ('this-year', 'This Year'),
                                        ],
                                        onChanged: onDateFilterChanged,
                                      ),
                                      _OwnerFilterSelect(
                                        value: statusFilter,
                                        width: 132,
                                        items: const [
                                          ('all', 'All Status'),
                                          ('completed', 'Completed'),
                                          ('pending', 'Pending'),
                                          ('failed', 'Failed'),
                                        ],
                                        onChanged: onStatusFilterChanged,
                                      ),
                                    ],
                                  ),
                                ],
                              )
                            : Row(
                                children: [
                                  const Expanded(
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.description_outlined,
                                          color: AppTheme.primary,
                                          size: 20,
                                        ),
                                        SizedBox(width: 8),
                                        Text(
                                          'Transaction History',
                                          style: TextStyle(
                                            color: AppTheme.foreground,
                                            fontSize: 18,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  _OwnerFilterSelect(
                                    value: dateFilter,
                                    width: 130,
                                    items: const [
                                      ('all', 'All Time'),
                                      ('today', 'Today'),
                                      ('yesterday', 'Yesterday'),
                                      ('this-month', 'This Month'),
                                      ('this-year', 'This Year'),
                                    ],
                                    onChanged: onDateFilterChanged,
                                  ),
                                  const SizedBox(width: 10),
                                  _OwnerFilterSelect(
                                    value: statusFilter,
                                    width: 130,
                                    items: const [
                                      ('all', 'All Status'),
                                      ('completed', 'Completed'),
                                      ('pending', 'Pending'),
                                      ('failed', 'Failed'),
                                    ],
                                    onChanged: onStatusFilterChanged,
                                  ),
                                ],
                              );
                      },
                    ),
                  ),
                  if (filteredTransactions.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(22),
                      child: _OwnerDashedEmptyState(
                        icon: Icons.search_off_rounded,
                        title: 'No transactions found matching your criteria',
                        message:
                            'Try another date range or status filter to see more records.',
                      ),
                    )
                  else
                    LayoutBuilder(
                      builder: (context, constraints) {
                        if (constraints.maxWidth < 840) {
                          return Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: filteredTransactions
                                  .map(
                                    (transaction) => Padding(
                                      padding: const EdgeInsets.only(bottom: 12),
                                      child: _OwnerTransactionMobileCard(
                                        transaction: transaction,
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                          );
                        }

                        return _OwnerTransactionTable(
                          transactions: filteredTransactions,
                        );
                      },
                    ),
                ],
              ),
            ),
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
          DashboardSectionCard(
            child: DashboardEmptyState(
              title: 'Transactions unavailable',
              message: error.toString().replaceFirst('Exception: ', ''),
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerPayoutTab extends ConsumerStatefulWidget {
  const _OwnerPayoutTab({required this.userName});

  final String userName;

  @override
  ConsumerState<_OwnerPayoutTab> createState() => _OwnerPayoutTabState();
}

class _OwnerPayoutTabState extends ConsumerState<_OwnerPayoutTab> {
  late final TextEditingController _accountNameController;
  late final TextEditingController _accountNumberController;
  late final TextEditingController _businessNameController;
  String? _bankCode;
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _accountNameController = TextEditingController(
      text: user?.payoutAccountName ?? user?.name ?? '',
    );
    _accountNumberController = TextEditingController(
      text: user?.payoutAccountNumber ?? '',
    );
    _businessNameController = TextEditingController(
      text: user?.name ?? widget.userName,
    );
    _bankCode = user?.payoutBankCode;
    Future.microtask(() => ref.read(paymentProvider.notifier).fetchBanks());
  }

  @override
  void dispose() {
    _accountNameController.dispose();
    _accountNumberController.dispose();
    _businessNameController.dispose();
    super.dispose();
  }

  void _syncFromUser(UserModel? user) {
    if (_isEditing) {
      return;
    }

    final nextAccountName = user?.payoutAccountName ?? user?.name ?? '';
    final nextAccountNumber = user?.payoutAccountNumber ?? '';
    final nextBusinessName = user?.name ?? widget.userName;
    final nextBankCode = user?.payoutBankCode;

    if (_accountNameController.text != nextAccountName) {
      _accountNameController.text = nextAccountName;
    }
    if (_accountNumberController.text != nextAccountNumber) {
      _accountNumberController.text = nextAccountNumber;
    }
    if (_businessNameController.text != nextBusinessName) {
      _businessNameController.text = nextBusinessName;
    }
    if ((_bankCode ?? '') != (nextBankCode ?? '')) {
      _bankCode = nextBankCode;
    }
  }

  void _resetFromUser(UserModel? user) {
    _accountNameController.text = user?.payoutAccountName ?? user?.name ?? '';
    _accountNumberController.text = user?.payoutAccountNumber ?? '';
    _businessNameController.text = user?.name ?? widget.userName;
    _bankCode = user?.payoutBankCode;
  }

  Future<void> _save() async {
    final user = ref.read(authProvider).user;
    if (user == null) {
      return;
    }

    if ((_bankCode ?? '').trim().isEmpty ||
        _accountNumberController.text.trim().isEmpty ||
        _accountNameController.text.trim().isEmpty) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all bank details.'),
        ),
      );
      return;
    }

    try {
      await ref.read(paymentProvider.notifier).createSubaccount(
            userId: user.id,
            bankCode: _bankCode!.trim(),
            accountNumber: _accountNumberController.text.trim(),
            accountName: _accountNameController.text.trim(),
            businessName: _businessNameController.text.trim(),
          );
      await ref.read(authProvider.notifier).refreshCurrentUser();
      if (!mounted) {
        return;
      }
      setState(() {
        _isEditing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payout details saved and verified with Chapa.'),
        ),
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      final message =
          ref.read(paymentProvider).error?.replaceFirst('Exception: ', '') ??
              'Failed to save payout details. Please check your bank information.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }

  String? _resolveSelectedBankCode(List<dynamic> banks) {
    if (_bankCode == null || _bankCode!.trim().isEmpty) {
      return null;
    }
    for (final bank in banks) {
      if (bank is! Map) {
        continue;
      }
      final bankId = bank['id']?.toString().trim();
      final bankCodeValue = bank['code']?.toString().trim();
      if (bankId == _bankCode || bankCodeValue == _bankCode) {
        return bankId?.isNotEmpty == true ? bankId : bankCodeValue;
      }
    }
    return null;
  }

  InputDecoration _fieldDecoration(String label, {String? hintText}) {
    return InputDecoration(
      labelText: label,
      hintText: hintText,
      labelStyle: const TextStyle(
        color: AppTheme.mutedForeground,
        fontWeight: FontWeight.w700,
      ),
      hintStyle: const TextStyle(
        color: AppTheme.mutedForeground,
      ),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppTheme.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppTheme.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final paymentState = ref.watch(paymentProvider);
    final banks = paymentState.banks;
    _syncFromUser(user);

    final isLinked = user?.chapaSubaccountId?.trim().isNotEmpty ?? false;
    final showSummary = isLinked && !_isEditing;
    final isBanksLoading = paymentState.isLoading && banks.isEmpty;
    final currentBank = _findOwnerBankByCode(banks, user?.payoutBankCode);
    final bankName = currentBank != null
        ? _ownerBankLabel(currentBank)
        : (user?.payoutBankCode?.trim().isNotEmpty ?? false)
            ? user!.payoutBankCode!
            : 'Bank not selected';

    return DashboardRefreshList(
      onRefresh: () async {
        await ref.read(paymentProvider.notifier).fetchBanks();
        await ref.read(authProvider.notifier).refreshCurrentUser();
      },
      children: [
        DashboardSectionCard(
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: Color(0xFFF8FAFC),
                  border: Border(
                    bottom: BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final compact = constraints.maxWidth < 560;
                    final header = Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.credit_card_rounded,
                            color: AppTheme.primary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Payout Settings',
                                style: TextStyle(
                                  color: AppTheme.foreground,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Configure where you want to receive your earnings',
                                style: TextStyle(
                                  color: AppTheme.mutedForeground,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );

                    Widget? action;
                    if (showSummary) {
                      action = OutlinedButton(
                        onPressed: () {
                          setState(() {
                            _isEditing = true;
                          });
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.foreground,
                          side: const BorderSide(color: AppTheme.border),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                        child: const Text(
                          'Update Account',
                          style: TextStyle(fontWeight: FontWeight.w900),
                        ),
                      );
                    } else if (_isEditing) {
                      action = TextButton(
                        onPressed: () {
                          setState(() {
                            _isEditing = false;
                            _resetFromUser(user);
                          });
                        },
                        child: const Text(
                          'Cancel',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      );
                    }

                    if (compact || action == null) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          header,
                          if (action != null) ...[
                            const SizedBox(height: 14),
                            action,
                          ],
                        ],
                      );
                    }

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: header),
                        const SizedBox(width: 12),
                        action,
                      ],
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  child: showSummary
                      ? Column(
                          key: const ValueKey('owner-payout-summary'),
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(18),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0FDF4),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: const Color(0xFFBBF7D0),
                                ),
                              ),
                              child: const Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _OwnerPayoutBannerIcon(
                                    backgroundColor: Color(0xFFDCFCE7),
                                    foregroundColor: Color(0xFF16A34A),
                                    icon: Icons.check_circle_outline_rounded,
                                  ),
                                  SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Account Linked & Verified',
                                          style: TextStyle(
                                            color: Color(0xFF14532D),
                                            fontSize: 18,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                        SizedBox(height: 4),
                                        Text(
                                          'Your funds will be automatically settled to this account.',
                                          style: TextStyle(
                                            color: Color(0xFF166534),
                                            height: 1.45,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                            LayoutBuilder(
                              builder: (context, constraints) {
                                final crossAxisCount =
                                    constraints.maxWidth >= 760 ? 2 : 1;
                                final infoCards = [
                                  _OwnerPayoutInfoCard(
                                    label: 'Receiving Bank',
                                    value: isBanksLoading
                                        ? 'Loading bank info...'
                                        : bankName,
                                    icon: Icons.account_balance_outlined,
                                  ),
                                  _OwnerPayoutInfoCard(
                                    label: 'Account Holder',
                                    value:
                                        user?.payoutAccountName?.trim().isNotEmpty ??
                                                false
                                            ? user!.payoutAccountName!
                                            : 'Account name missing',
                                    icon: Icons.badge_outlined,
                                  ),
                                  _OwnerPayoutInfoCard(
                                    label: 'Account Number',
                                    value:
                                        user?.payoutAccountNumber?.trim().isNotEmpty ??
                                                false
                                            ? user!.payoutAccountNumber!
                                            : 'Account number missing',
                                    icon: Icons.numbers_outlined,
                                    monospace:
                                        user?.payoutAccountNumber
                                                ?.trim()
                                                .isNotEmpty ??
                                            false,
                                  ),
                                  const _OwnerPayoutInfoCard(
                                    label: 'Settlement Type',
                                    value: 'Direct Deposit',
                                    icon: Icons.payments_outlined,
                                    isAccent: true,
                                  ),
                                ];

                                return GridView.builder(
                                  shrinkWrap: true,
                                  physics:
                                      const NeverScrollableScrollPhysics(),
                                  itemCount: infoCards.length,
                                  gridDelegate:
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: crossAxisCount,
                                    crossAxisSpacing: 14,
                                    mainAxisSpacing: 14,
                                    childAspectRatio:
                                        crossAxisCount == 1 ? 3.4 : 2.8,
                                  ),
                                  itemBuilder: (context, index) =>
                                      infoCards[index],
                                );
                              },
                            ),
                          ],
                        )
                      : Column(
                          key: const ValueKey('owner-payout-form'),
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (!isLinked) ...[
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(18),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: const Color(0xFFFDE68A),
                                  ),
                                ),
                                child: const Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _OwnerPayoutBannerIcon(
                                      backgroundColor: Color(0xFFFEF3C7),
                                      foregroundColor: Color(0xFFD97706),
                                      icon: Icons.error_outline_rounded,
                                    ),
                                    SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Setup Payout Method',
                                            style: TextStyle(
                                              color: Color(0xFF92400E),
                                              fontSize: 18,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                          SizedBox(height: 4),
                                          Text(
                                            'Link your bank account to start receiving direct payments from HomeCar.',
                                            style: TextStyle(
                                              color: Color(0xFF92400E),
                                              height: 1.45,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),
                            ],
                            LayoutBuilder(
                              builder: (context, constraints) {
                                final compact = constraints.maxWidth < 720;
                                final bankField =
                                    DropdownButtonFormField<String>(
                                  value: _resolveSelectedBankCode(banks),
                                  decoration: _fieldDecoration(
                                    'Select Bank',
                                    hintText: 'Choose a bank...',
                                  ),
                                  dropdownColor: Colors.white,
                                  items: banks
                                      .whereType<Map>()
                                      .map(
                                        (bank) => DropdownMenuItem<String>(
                                          value:
                                              (bank['id'] ?? bank['code'] ?? '')
                                                  .toString(),
                                          child: Text(
                                            _ownerBankLabel(bank),
                                            style: const TextStyle(
                                              color: AppTheme.foreground,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                      )
                                      .toList(),
                                  onChanged: paymentState.isLoading
                                      ? null
                                      : (value) {
                                          setState(() {
                                            _bankCode = value;
                                          });
                                        },
                                );
                                final nameField = TextField(
                                  controller: _accountNameController,
                                  style: const TextStyle(
                                    color: AppTheme.foreground,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  decoration: _fieldDecoration(
                                    'Account Holder Name',
                                    hintText:
                                        'Full name as it appears on bank',
                                  ),
                                );
                                final numberField = TextField(
                                  controller: _accountNumberController,
                                  keyboardType: TextInputType.number,
                                  style: const TextStyle(
                                    color: AppTheme.foreground,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.2,
                                  ),
                                  decoration: _fieldDecoration(
                                    'Account Number',
                                    hintText: 'Enter your account number',
                                  ),
                                );
                                final businessField = TextField(
                                  controller: _businessNameController,
                                  style: const TextStyle(
                                    color: AppTheme.foreground,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  decoration: _fieldDecoration(
                                    'Business Reference (Optional)',
                                    hintText:
                                        'Business or personality name',
                                  ),
                                );

                                if (compact) {
                                  return Column(
                                    children: [
                                      bankField,
                                      const SizedBox(height: 16),
                                      nameField,
                                      const SizedBox(height: 16),
                                      numberField,
                                      const SizedBox(height: 16),
                                      businessField,
                                    ],
                                  );
                                }

                                return Wrap(
                                  spacing: 16,
                                  runSpacing: 16,
                                  children: [
                                    SizedBox(
                                      width: (constraints.maxWidth - 16) / 2,
                                      child: bankField,
                                    ),
                                    SizedBox(
                                      width: (constraints.maxWidth - 16) / 2,
                                      child: nameField,
                                    ),
                                    SizedBox(
                                      width: (constraints.maxWidth - 16) / 2,
                                      child: numberField,
                                    ),
                                    SizedBox(
                                      width: (constraints.maxWidth - 16) / 2,
                                      child: businessField,
                                    ),
                                  ],
                                );
                              },
                            ),
                            if (paymentState.error != null &&
                                paymentState.error!.isNotEmpty) ...[
                              const SizedBox(height: 16),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: const Color(0xFFFECACA),
                                  ),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(
                                      Icons.error_outline_rounded,
                                      color: Color(0xFFDC2626),
                                      size: 18,
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        paymentState.error!.replaceFirst(
                                          'Exception: ',
                                          '',
                                        ),
                                        style: const TextStyle(
                                          color: Color(0xFFDC2626),
                                          fontWeight: FontWeight.w600,
                                          height: 1.4,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 20),
                            LayoutBuilder(
                              builder: (context, constraints) {
                                final button = FilledButton.icon(
                                  onPressed: paymentState.isLoading ? null : _save,
                                  style: FilledButton.styleFrom(
                                    backgroundColor: AppTheme.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 24,
                                      vertical: 16,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  icon: paymentState.isLoading
                                      ? const SizedBox(
                                          width: 16,
                                          height: 16,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Icon(Icons.save_outlined),
                                  label: Text(
                                    paymentState.isLoading
                                        ? 'Verifying with Chapa...'
                                        : isLinked
                                            ? 'Update Payout Details'
                                            : 'Verify & Setup Account',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                );

                                if (constraints.maxWidth < 520) {
                                  return SizedBox(
                                    width: double.infinity,
                                    child: button,
                                  );
                                }

                                return button;
                              },
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _OwnerPayoutBannerIcon extends StatelessWidget {
  const _OwnerPayoutBannerIcon({
    required this.backgroundColor,
    required this.foregroundColor,
    required this.icon,
  });

  final Color backgroundColor;
  final Color foregroundColor;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: backgroundColor,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: foregroundColor),
    );
  }
}

class _OwnerPropertyCard extends ConsumerWidget {
  const _OwnerPropertyCard({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = (property.status ?? 'AVAILABLE').toUpperCase();
    final listingBadges = property.listingTypes
        .where((type) {
          final normalized = type.toUpperCase();
          return normalized != status && normalized != 'AVAILABLE';
        })
        .toList(growable: false);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => context.push('/property-detail', extra: property),
        child: Ink(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x12000000),
                blurRadius: 22,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(24),
                ),
                child: SizedBox(
                  height: 228,
                  width: double.infinity,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      property.mainImage.isNotEmpty
                          ? Image.network(
                              property.mainImage,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return _OwnerImageFallback(
                                  icon: property.isCar
                                      ? Icons.directions_car_outlined
                                      : Icons.home_work_outlined,
                                );
                              },
                            )
                          : _OwnerImageFallback(
                              icon: property.isCar
                                  ? Icons.directions_car_outlined
                                  : Icons.home_work_outlined,
                            ),
                      Positioned(
                        left: 14,
                        top: 14,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: listingBadges
                              .map(
                                (type) => Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: _OwnerImageBadge(
                                    label: prettyDashboardLabel(type),
                                    backgroundColor: Colors.white,
                                    foregroundColor: AppTheme.primary,
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ),
                      Positioned(
                        right: 14,
                        top: 14,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            _OwnerImageBadge(
                              label: prettyDashboardLabel(status),
                              backgroundColor: _propertyStatusColor(status),
                              foregroundColor: Colors.white,
                            ),
                            if (!property.isVerified) ...[
                              const SizedBox(height: 6),
                              const _OwnerImageBadge(
                                label: 'Pending Verification',
                                backgroundColor: Color(0xFFFEF3C7),
                                foregroundColor: Color(0xFFB45309),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            property.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppTheme.foreground,
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        if (property.reviewCount > 0 || property.rating > 0) ...[
                          const SizedBox(width: 12),
                          Row(
                            children: [
                              const Icon(
                                Icons.star_rounded,
                                color: Color(0xFFFACC15),
                                size: 18,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                property.rating.toStringAsFixed(1),
                                style: const TextStyle(
                                  color: AppTheme.foreground,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 16,
                          color: AppTheme.mutedForeground,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            property.locationLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 14,
                      runSpacing: 10,
                      children: property.isHome
                          ? [
                              _OwnerCompactMetric(
                                icon: Icons.king_bed_outlined,
                                label: '${property.bedrooms ?? 0}',
                              ),
                              _OwnerCompactMetric(
                                icon: Icons.bathtub_outlined,
                                label: '${property.bathrooms ?? 0}',
                              ),
                              _OwnerCompactMetric(
                                icon: Icons.square_foot_outlined,
                                label: '${property.area?.toStringAsFixed(0) ?? '0'} sq ft',
                              ),
                            ]
                          : [
                              _OwnerCompactMetric(
                                icon: Icons.branding_watermark_outlined,
                                label: property.brand ?? 'Vehicle',
                              ),
                              _OwnerCompactMetric(
                                icon: Icons.settings_outlined,
                                label: prettyDashboardLabel(
                                  property.transmission ?? 'Unknown',
                                ),
                              ),
                              _OwnerCompactMetric(
                                icon: Icons.speed_outlined,
                                label:
                                    '${(property.mileage ?? 0).toStringAsFixed(0)} km',
                              ),
                            ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: RichText(
                            text: TextSpan(
                              style: const TextStyle(color: AppTheme.primary),
                              children: [
                                const TextSpan(
                                  text: 'ETB ',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                TextSpan(
                                  text: property.price.toStringAsFixed(0),
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        OutlinedButton.icon(
                          onPressed: () async {
                            await context.push('/edit-listing', extra: property);
                            if (context.mounted) {
                              ref.invalidate(myListingsProvider);
                            }
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primary,
                            side: BorderSide(
                              color: AppTheme.primary.withValues(alpha: 0.20),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          icon: const Icon(Icons.edit_outlined, size: 16),
                          label: const Text('Edit'),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton.icon(
                          onPressed: () => _confirmDelete(context, ref),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFE11D48),
                            side: const BorderSide(color: Color(0xFFFECDD3)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          icon: const Icon(Icons.delete_outline, size: 16),
                          label: const Text('Delete'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: const Text(
            'Delete listing?',
            style: TextStyle(fontWeight: FontWeight.w900),
          ),
          content: Text(
            'This will permanently remove "${property.title}" from your marketplace listings.',
            style: const TextStyle(color: AppTheme.mutedForeground),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
              ),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    await ref.read(listingRepositoryProvider).deleteListing(property.id);
    ref.invalidate(myListingsProvider);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Listing deleted successfully.')),
      );
    }
  }
}

class _OwnerApplicationCard extends ConsumerWidget {
  const _OwnerApplicationCard({
    required this.application,
    required this.isBusy,
  });

  final PropertyApplication application;
  final bool isBusy;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 22,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            child: Container(
              width: 4,
              decoration: const BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.horizontal(left: Radius.circular(24)),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 18, 18, 18),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 680;
                final image = _OwnerApplicationImage(application: application);
                final content = _OwnerApplicationContent(application: application);
                final actions = _OwnerApplicationActions(
                  application: application,
                  isBusy: isBusy,
                );

                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      image,
                      const SizedBox(height: 16),
                      content,
                      const SizedBox(height: 16),
                      actions,
                    ],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    image,
                    const SizedBox(width: 18),
                    Expanded(child: content),
                    const SizedBox(width: 16),
                    actions,
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerApplicationImage extends StatelessWidget {
  const _OwnerApplicationImage({required this.application});

  final PropertyApplication application;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: SizedBox(
        width: 140,
        height: 140,
        child: Stack(
          fit: StackFit.expand,
          children: [
            application.propertyImage?.trim().isNotEmpty ?? false
                ? Image.network(
                    application.propertyImage!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return const _OwnerImageFallback(
                        icon: Icons.home_work_outlined,
                      );
                    },
                  )
                : const _OwnerImageFallback(icon: Icons.home_work_outlined),
            Positioned(
              left: 10,
              top: 10,
              child: _OwnerImageBadge(
                label: prettyDashboardLabel(application.listingType),
                backgroundColor: Colors.white.withValues(alpha: 0.92),
                foregroundColor: AppTheme.foreground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OwnerApplicationContent extends StatelessWidget {
  const _OwnerApplicationContent({required this.application});

  final PropertyApplication application;

  @override
  Widget build(BuildContext context) {
    final statusColor = application.isAccepted
        ? const Color(0xFF15803D)
        : application.isRejected
        ? const Color(0xFFE11D48)
        : const Color(0xFF2563EB);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    application.propertyTitle,
                    style: const TextStyle(
                      color: AppTheme.foreground,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.person_outline_rounded,
                        size: 14,
                        color: AppTheme.mutedForeground,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          application.customerName ?? 'Unknown Applicant',
                          style: const TextStyle(
                            color: AppTheme.mutedForeground,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (application.dateLabel?.trim().isNotEmpty ?? false) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(
                          Icons.schedule_outlined,
                          size: 14,
                          color: AppTheme.mutedForeground,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          application.dateLabel!,
                          style: const TextStyle(
                            color: AppTheme.mutedForeground,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 10),
            _OwnerInlineStatusBadge(
              label: prettyDashboardLabel(application.status),
              color: statusColor,
            ),
          ],
        ),
        const SizedBox(height: 14),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _OwnerInfoChip(
              label: application.listingType.toLowerCase() == 'rent'
                  ? 'Rent'
                  : 'Price',
              value: formatDashboardMoney(application.price),
            ),
            _OwnerInfoChip(
              label: 'Type',
              value: application.listingLabel,
            ),
          ],
        ),
        if (application.message?.trim().isNotEmpty ?? false) ...[
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.border),
            ),
            child: Text(
              '"${application.message!}"',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                fontSize: 13,
                fontStyle: FontStyle.italic,
                height: 1.45,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _OwnerApplicationActions extends ConsumerWidget {
  const _OwnerApplicationActions({
    required this.application,
    required this.isBusy,
  });

  final PropertyApplication application;
  final bool isBusy;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> updateStatus(String status, String successMessage) async {
      try {
        await ref
            .read(applicationStatusUpdateProvider.notifier)
            .updateStatus(applicationId: application.id, status: status);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(successMessage)),
          );
        }
      } catch (error) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                error.toString().replaceFirst('Exception: ', ''),
              ),
            ),
          );
        }
      }
    }

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      alignment: WrapAlignment.end,
      children: [
        OutlinedButton.icon(
          onPressed: application.customerId.trim().isEmpty
              ? null
              : () => context.push('/profile/${application.customerId}'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.primary,
            side: BorderSide(color: AppTheme.primary.withValues(alpha: 0.20)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          icon: const Icon(Icons.person_outline_rounded, size: 16),
          label: const Text('See Profile'),
        ),
        if (application.isPending)
          FilledButton.icon(
            onPressed: isBusy
                ? null
                : () => updateStatus('accepted', 'Application accepted.'),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.check_rounded, size: 16),
            label: const Text('Accept'),
          ),
        if (application.isPending)
          OutlinedButton.icon(
            onPressed: isBusy
                ? null
                : () => updateStatus('rejected', 'Application rejected.'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFE11D48),
              side: const BorderSide(color: Color(0xFFFECDD3)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.close_rounded, size: 16),
            label: const Text('Reject'),
          ),
        if (!application.isPending)
          TextButton(
            onPressed: isBusy
                ? null
                : () => updateStatus('pending', 'Application reset to pending.'),
            child: const Text(
              'Reset',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
      ],
    );
  }
}

class _OwnerLeaseCard extends ConsumerWidget {
  const _OwnerLeaseCard({
    required this.lease,
    required this.isBusy,
    required this.isExpanded,
    required this.ownerTransactions,
    required this.onToggleSchedule,
  });

  final LeaseModel lease;
  final bool isBusy;
  final bool isExpanded;
  final List<TransactionModel> ownerTransactions;
  final VoidCallback onToggleSchedule;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final property = lease.property;
    final monthlyOrTotal = lease.recurringAmount ?? lease.totalPrice;
    final periods = _buildOwnerLeasePeriods(lease, ownerTransactions);
    final progressValue = _ownerLeaseProgress(lease);

    Future<void> acceptLease() async {
      try {
        await ref
            .read(leaseActionProvider.notifier)
            .acceptLease(leaseId: lease.id, role: 'owner');
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Lease accepted successfully.')),
          );
        }
      } catch (error) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                error.toString().replaceFirst('Exception: ', ''),
              ),
            ),
          );
        }
      }
    }

    Future<void> requestCancellation() async {
      try {
        await ref
            .read(leaseActionProvider.notifier)
            .requestCancellation(leaseId: lease.id, role: 'owner');
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Lease cancellation updated.')),
          );
        }
      } catch (error) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                error.toString().replaceFirst('Exception: ', ''),
              ),
            ),
          );
        }
      }
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 760;
                final leading = Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: SizedBox(
                        width: 96,
                        height: 96,
                        child: property?.mainImage.isNotEmpty ?? false
                            ? Image.network(
                                property!.mainImage,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return const _OwnerImageFallback(
                                    icon: Icons.home_work_outlined,
                                  );
                                },
                              )
                            : const _OwnerImageFallback(
                                icon: Icons.home_work_outlined,
                              ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            property?.title ?? 'Lease agreement',
                            style: const TextStyle(
                              color: AppTheme.foreground,
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            property?.locationLabel ??
                                'Property information unavailable',
                            style: const TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(
                                Icons.person_outline_rounded,
                                size: 14,
                                color: AppTheme.primary,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Tenant: ${lease.customer?.name ?? 'Unknown Tenant'}',
                                  style: const TextStyle(
                                    color: AppTheme.primary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 10,
                            runSpacing: 8,
                            children: [
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.calendar_today_outlined,
                                    size: 14,
                                    color: AppTheme.mutedForeground,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Started: ${formatDashboardDate(lease.startDate)}',
                                    style: const TextStyle(
                                      color: AppTheme.mutedForeground,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              _OwnerInlineStatusBadge(
                                label: lease.isCancellationPending
                                    ? 'Cancellation Pending'
                                    : prettyDashboardLabel(lease.status),
                                color: lease.isActive
                                    ? const Color(0xFF15803D)
                                    : lease.isPending
                                    ? const Color(0xFFD97706)
                                    : lease.isCancellationPending
                                    ? const Color(0xFFEA580C)
                                    : const Color(0xFF64748B),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                );

                final aside = Container(
                  padding: compact
                      ? const EdgeInsets.all(14)
                      : const EdgeInsets.symmetric(vertical: 4),
                  decoration: BoxDecoration(
                    color: compact ? const Color(0xFFF8FAFC) : Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                    border: compact
                        ? Border.all(color: AppTheme.border.withValues(alpha: 0.50))
                        : null,
                  ),
                  child: Column(
                    crossAxisAlignment: compact
                        ? CrossAxisAlignment.start
                        : CrossAxisAlignment.end,
                    children: [
                      Text(
                        lease.recurringAmount != null
                            ? 'Monthly Payment'
                            : 'Total Payment',
                        style: const TextStyle(
                          color: AppTheme.mutedForeground,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        formatDashboardMoney(monthlyOrTotal),
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        alignment: compact
                            ? WrapAlignment.start
                            : WrapAlignment.end,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () => context.go('/leases/${lease.id}'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.foreground,
                              side: const BorderSide(color: AppTheme.border),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            icon: const Icon(
                              Icons.description_outlined,
                              size: 16,
                            ),
                            label: const Text('View Detail'),
                          ),
                          if (lease.isActive ||
                              (lease.isCancellationPending &&
                                  !lease.ownerCancelled))
                            OutlinedButton.icon(
                              onPressed: isBusy ? null : requestCancellation,
                              style: OutlinedButton.styleFrom(
                                foregroundColor: lease.isCancellationPending
                                    ? const Color(0xFFEA580C)
                                    : const Color(0xFFE11D48),
                                side: BorderSide(
                                  color: lease.isCancellationPending
                                      ? const Color(0xFFFED7AA)
                                      : const Color(0xFFFECDD3),
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(Icons.close_rounded, size: 16),
                              label: Text(
                                lease.isCancellationPending
                                    ? 'Confirm Cancellation'
                                    : 'Cancel Lease',
                              ),
                            ),
                          if (lease.isCancellationPending && lease.ownerCancelled)
                            OutlinedButton.icon(
                              onPressed: null,
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFFD97706),
                                side: const BorderSide(color: Color(0xFFFDE68A)),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(
                                Icons.schedule_outlined,
                                size: 16,
                              ),
                              label: const Text('Requested'),
                            ),
                          if (lease.isPending && !lease.ownerAccepted)
                            FilledButton.icon(
                              onPressed: isBusy ? null : acceptLease,
                              style: FilledButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(
                                Icons.check_circle_outline_rounded,
                                size: 16,
                              ),
                              label: const Text('Accept Lease'),
                            ),
                        ],
                      ),
                    ],
                  ),
                );

                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      leading,
                      const SizedBox(height: 16),
                      aside,
                    ],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: leading),
                    const SizedBox(width: 20),
                    SizedBox(width: 280, child: aside),
                  ],
                );
              },
            ),
            const SizedBox(height: 18),
            const Divider(height: 1, color: AppTheme.border),
            const SizedBox(height: 14),
            InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: onToggleSchedule,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                child: Row(
                  children: [
                    const Icon(
                      Icons.payments_outlined,
                      size: 18,
                      color: AppTheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        lease.recurringAmount != null
                            ? 'Payment Collection Schedule'
                            : 'Lease Payment Settlement',
                        style: const TextStyle(
                          color: AppTheme.foreground,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    _OwnerPillTag(
                      label: lease.recurringAmount != null ? 'MONTHLY' : 'ONE-TIME',
                    ),
                    const SizedBox(width: 10),
                    Icon(
                      isExpanded
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      color: AppTheme.mutedForeground,
                    ),
                  ],
                ),
              ),
            ),
            if (isExpanded) ...[
              const SizedBox(height: 12),
              Column(
                children: periods
                    .map(
                      (period) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _OwnerLeaseScheduleCard(period: period),
                      ),
                    )
                    .toList(),
              ),
            ],
            const SizedBox(height: 12),
            const Divider(height: 1, color: AppTheme.border),
            const SizedBox(height: 14),
            Row(
              children: [
                const Text(
                  'Lease Completion (Fixed 30 Days)',
                  style: TextStyle(
                    color: AppTheme.mutedForeground,
                    fontSize: 13,
                  ),
                ),
                const Spacer(),
                Text(
                  _ownerLeaseProgressLabel(lease),
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: progressValue,
                minHeight: 8,
                backgroundColor: const Color(0xFFE5E7EB),
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OwnerLeaseScheduleCard extends StatelessWidget {
  const _OwnerLeaseScheduleCard({required this.period});

  final _OwnerLeasePeriod period;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: period.backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: period.borderColor),
        boxShadow: period.isCurrent
            ? const [
                BoxShadow(
                  color: Color(0x14005A41),
                  blurRadius: 18,
                  offset: Offset(0, 10),
                ),
              ]
            : null,
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 620;
          final leading = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(
                    '${_ownerShortDate(period.start)} - ${_ownerShortDate(period.end)}',
                    style: TextStyle(
                      color: period.isCurrent
                          ? AppTheme.primary
                          : AppTheme.foreground,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (period.isCurrent)
                    const _OwnerImageBadge(
                      label: 'PROCESSING',
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                formatDashboardMoney(period.amount),
                style: const TextStyle(
                  color: AppTheme.foreground,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          );

          final progress = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    period.progressLabel,
                    style: const TextStyle(
                      color: AppTheme.mutedForeground,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    period.progressValueLabel,
                    style: TextStyle(
                      color: period.isPast
                          ? const Color(0xFF16A34A)
                          : period.isCurrent
                          ? AppTheme.primary
                          : AppTheme.mutedForeground,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 12,
                child: Row(
                  children: List.generate(period.totalSegments, (index) {
                    final filled = index < period.filledSegments;
                    return Expanded(
                      child: Container(
                        margin: EdgeInsets.only(
                          right: index == period.totalSegments - 1 ? 0 : 2,
                        ),
                        decoration: BoxDecoration(
                          color: filled
                              ? (period.isPast
                                    ? const Color(0xFF22C55E)
                                    : AppTheme.primary)
                              : const Color(0xFFD1D5DB),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],
          );

          final status = Container(
            width: compact ? double.infinity : 170,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: period.statusBackgroundColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: period.statusBorderColor),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(period.statusIcon, size: 16, color: period.statusColor),
                const SizedBox(width: 8),
                Text(
                  period.statusLabel,
                  style: TextStyle(
                    color: period.statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          );

          if (compact) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                leading,
                const SizedBox(height: 14),
                progress,
                const SizedBox(height: 14),
                status,
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(width: 150, child: leading),
              const SizedBox(width: 18),
              Expanded(child: progress),
              const SizedBox(width: 18),
              status,
            ],
          );
        },
      ),
    );
  }
}

class _OwnerMaintenanceCard extends ConsumerWidget {
  const _OwnerMaintenanceCard({
    required this.request,
    required this.isBusy,
  });

  final MaintenanceRequestModel request;
  final bool isBusy;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    String? nextStatus;
    String? nextLabel;
    if (request.isPending) {
      nextStatus = 'inProgress';
      nextLabel = 'Start Progress';
    } else if (request.isInProgress) {
      nextStatus = 'completed';
      nextLabel = 'Mark Completed';
    }

    Future<void> updateStatus() async {
      if (nextStatus == null) {
        return;
      }

      try {
        await ref
            .read(maintenanceActionProvider.notifier)
            .updateStatus(requestId: request.id, status: nextStatus!);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Status updated to ${nextStatus == 'inProgress' ? 'In Progress' : 'Completed'}.',
              ),
            ),
          );
        }
      } catch (error) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                error.toString().replaceFirst('Exception: ', ''),
              ),
            ),
          );
        }
      }
    }

    final previewImage = _ownerMaintenancePreviewImage(request);
    final detailImages = request.images
        .where(_looksLikeOwnerNetworkImage)
        .toList(growable: false);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 22,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            child: Container(
              width: 6,
              decoration: BoxDecoration(
                color: request.isCompleted
                    ? const Color(0xFF22C55E)
                    : request.isInProgress
                    ? const Color(0xFF3B82F6)
                    : const Color(0xFFF59E0B),
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(24),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 18, 18, 18),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 720;
                final mainInfo = Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _OwnerInlineStatusBadge(
                          label: prettyDashboardLabel(request.status),
                          color: request.isCompleted
                              ? const Color(0xFF16A34A)
                              : request.isInProgress
                              ? const Color(0xFF2563EB)
                              : const Color(0xFFD97706),
                        ),
                        if (request.dateLabel?.trim().isNotEmpty ?? false)
                          _OwnerMicroLabel(
                            icon: Icons.calendar_today_outlined,
                            text: request.dateLabel!,
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      prettyDashboardLabel(request.category),
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(
                          Icons.home_work_outlined,
                          size: 14,
                          color: AppTheme.mutedForeground,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            request.propertyTitle,
                            style: const TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: AppTheme.border.withValues(alpha: 0.60),
                        ),
                      ),
                      child: Text(
                        '"${request.description}"',
                        style: const TextStyle(
                          color: Color(0xFF475569),
                          fontSize: 13,
                          fontStyle: FontStyle.italic,
                          height: 1.45,
                        ),
                      ),
                    ),
                  ],
                );

                final actions = Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  alignment: WrapAlignment.end,
                  children: [
                    if (nextStatus != null && nextLabel != null)
                      FilledButton.icon(
                        onPressed: isBusy ? null : updateStatus,
                        style: FilledButton.styleFrom(
                          backgroundColor: request.isPending
                              ? const Color(0xFF2563EB)
                              : AppTheme.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        icon: const Icon(Icons.sync_alt_rounded, size: 16),
                        label: Text(nextLabel),
                      ),
                    OutlinedButton.icon(
                      onPressed: () => _showDetails(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.foreground,
                        side: const BorderSide(color: AppTheme.border),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      icon: const Icon(Icons.visibility_outlined, size: 16),
                      label: const Text('See Detail'),
                    ),
                  ],
                );

                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (previewImage != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: SizedBox(
                              width: double.infinity,
                              height: 170,
                              child: Image.network(
                                previewImage,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return const _OwnerImageFallback(
                                    icon: Icons.handyman_outlined,
                                  );
                                },
                              ),
                            ),
                          ),
                        ),
                      mainInfo,
                      const SizedBox(height: 16),
                      actions,
                    ],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (previewImage != null) ...[
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: SizedBox(
                          width: 180,
                          height: 132,
                          child: Image.network(
                            previewImage,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return const _OwnerImageFallback(
                                icon: Icons.handyman_outlined,
                              );
                            },
                          ),
                        ),
                      ),
                      const SizedBox(width: 18),
                    ],
                    Expanded(child: mainInfo),
                    const SizedBox(width: 18),
                    SizedBox(width: 180, child: actions),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showDetails(BuildContext context) async {
    final detailImages = request.images
        .where(_looksLikeOwnerNetworkImage)
        .toList(growable: false);
    final propertyImage = request.property?.mainImage.trim();
    if (detailImages.isEmpty &&
        propertyImage != null &&
        _looksLikeOwnerNetworkImage(propertyImage)) {
      detailImages.add(propertyImage);
    }

    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: Row(
            children: [
              const Icon(Icons.handyman_outlined, color: AppTheme.primary),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Request Details',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
              ),
            ],
          ),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (detailImages.isNotEmpty)
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: detailImages
                          .map(
                            (image) => ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: SizedBox(
                                width: 150,
                                height: 120,
                                child: Image.network(
                                  image,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return const _OwnerImageFallback(
                                      icon: Icons.image_outlined,
                                    );
                                  },
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  if (detailImages.isNotEmpty) const SizedBox(height: 16),
                  _OwnerDialogInfoRow(
                    label: 'Status',
                    value: prettyDashboardLabel(request.status),
                  ),
                  _OwnerDialogInfoRow(
                    label: 'Date Reported',
                    value: request.dateLabel ?? 'Unknown date',
                  ),
                  _OwnerDialogInfoRow(
                    label: 'Property',
                    value: request.propertyTitle,
                  ),
                  _OwnerDialogInfoRow(
                    label: 'Category',
                    value: prettyDashboardLabel(request.category),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Description',
                    style: TextStyle(
                      color: AppTheme.mutedForeground,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Text(
                      request.description,
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }
}

class _OwnerTransactionTable extends StatelessWidget {
  const _OwnerTransactionTable({required this.transactions});

  final List<TransactionModel> transactions;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowColor: MaterialStateProperty.all(const Color(0xFFF8FAFC)),
        dividerThickness: 0.8,
        dataRowMinHeight: 78,
        dataRowMaxHeight: 92,
        columns: const [
          DataColumn(
            label: Text(
              'Transaction ID',
              style: _OwnerTableHeadingStyle(),
            ),
          ),
          DataColumn(
            label: Text('Details', style: _OwnerTableHeadingStyle()),
          ),
          DataColumn(
            label: Text('Date', style: _OwnerTableHeadingStyle()),
          ),
          DataColumn(
            label: Text('Amount', style: _OwnerTableHeadingStyle()),
          ),
          DataColumn(
            label: Text('Status', style: _OwnerTableHeadingStyle()),
          ),
        ],
        rows: transactions.map((transaction) {
          return DataRow(
            cells: [
              DataCell(
                Text(
                  'TX-${transaction.id.substring(0, transaction.id.length < 8 ? transaction.id.length : 8).toUpperCase()}',
                  style: const TextStyle(
                    color: AppTheme.mutedForeground,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              DataCell(_OwnerTransactionDetails(transaction: transaction)),
              DataCell(
                Text(
                  formatDashboardDate(transaction.createdAt),
                  style: const TextStyle(
                    color: AppTheme.mutedForeground,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              DataCell(
                Text(
                  formatDashboardMoney(transaction.amount),
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              DataCell(
                _OwnerInlineStatusBadge(
                  label: prettyDashboardLabel(transaction.status),
                  color: dashboardStatusColor(transaction.status),
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _OwnerTransactionMobileCard extends StatelessWidget {
  const _OwnerTransactionMobileCard({required this.transaction});

  final TransactionModel transaction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'TX-${transaction.id.substring(0, transaction.id.length < 8 ? transaction.id.length : 8).toUpperCase()}',
                  style: const TextStyle(
                    color: AppTheme.mutedForeground,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              _OwnerInlineStatusBadge(
                label: prettyDashboardLabel(transaction.status),
                color: dashboardStatusColor(transaction.status),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: transaction.isCompleted
                      ? const Color(0xFFDCFCE7)
                      : transaction.status.toUpperCase() == 'PENDING'
                      ? const Color(0xFFFEF3C7)
                      : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  transaction.type.toUpperCase() == 'RENT'
                      ? Icons.schedule_outlined
                      : Icons.home_work_outlined,
                  color: transaction.isCompleted
                      ? const Color(0xFF16A34A)
                      : transaction.status.toUpperCase() == 'PENDING'
                      ? const Color(0xFFD97706)
                      : const Color(0xFFE11D48),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(child: _OwnerTransactionDetails(transaction: transaction)),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _OwnerInfoChip(
                  label: 'Date',
                  value: formatDashboardDate(transaction.createdAt),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _OwnerInfoChip(
                  label: 'Amount',
                  value: formatDashboardMoney(transaction.amount),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _OwnerTransactionDetails extends StatelessWidget {
  const _OwnerTransactionDetails({required this.transaction});

  final TransactionModel transaction;

  @override
  Widget build(BuildContext context) {
    final iconColor = transaction.status.toUpperCase() == 'COMPLETED'
        ? const Color(0xFF16A34A)
        : transaction.status.toUpperCase() == 'PENDING'
        ? const Color(0xFFD97706)
        : const Color(0xFFE11D48);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(
            transaction.type.toUpperCase() == 'RENT'
                ? Icons.schedule_outlined
                : Icons.home_work_outlined,
            color: iconColor,
            size: 18,
          ),
        ),
        const SizedBox(width: 12),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _ownerTransactionTypeLabel(transaction),
                style: const TextStyle(
                  color: AppTheme.foreground,
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                transaction.property?.title ?? 'Rent Payment',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppTheme.mutedForeground,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _OwnerSectionHeader extends StatelessWidget {
  const _OwnerSectionHeader({
    required this.title,
    required this.subtitle,
    this.trailing,
    this.removeTopSpacing = false,
  });

  final String title;
  final String subtitle;
  final Widget? trailing;
  final bool removeTopSpacing;

  @override
  Widget build(BuildContext context) {
    final top = removeTopSpacing ? 0.0 : 4.0;

    return Padding(
      padding: EdgeInsets.only(top: top, bottom: 18),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 640;

          final heading = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppTheme.foreground,
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.8,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  color: AppTheme.mutedForeground,
                  fontSize: 14,
                  height: 1.45,
                ),
              ),
            ],
          );

          if (trailing == null) {
            return heading;
          }

          if (compact) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                heading,
                const SizedBox(height: 14),
                trailing!,
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: heading),
              const SizedBox(width: 12),
              trailing!,
            ],
          );
        },
      ),
    );
  }
}

class _OwnerRevenueSummaryCard extends StatelessWidget {
  const _OwnerRevenueSummaryCard({required this.totalRevenue});

  final double totalRevenue;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.primary.withValues(alpha: 0.18),
          style: BorderStyle.solid,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.account_balance_wallet_outlined,
              color: AppTheme.primary,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'TOTAL REVENUE',
                style: TextStyle(
                  color: AppTheme.primary,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                formatDashboardMoney(totalRevenue),
                style: const TextStyle(
                  color: AppTheme.foreground,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _OwnerFilterSelect extends StatelessWidget {
  const _OwnerFilterSelect({
    required this.value,
    required this.items,
    required this.onChanged,
    required this.width,
  });

  final String value;
  final List<(String, String)> items;
  final ValueChanged<String> onChanged;
  final double width;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: DropdownButtonFormField<String>(
        value: value,
        dropdownColor: Colors.white,
        iconEnabledColor: AppTheme.foreground,
        style: const TextStyle(
          color: AppTheme.foreground,
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 10,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppTheme.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppTheme.border),
          ),
        ),
        items: items
            .map(
              (item) => DropdownMenuItem<String>(
                value: item.$1,
                child: Text(item.$2),
              ),
            )
            .toList(),
        onChanged: (next) {
          if (next != null) {
            onChanged(next);
          }
        },
      ),
    );
  }
}

class _OwnerPayoutInfoCard extends StatelessWidget {
  const _OwnerPayoutInfoCard({
    required this.label,
    required this.value,
    required this.icon,
    this.monospace = false,
    this.isAccent = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final bool monospace;
  final bool isAccent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(
                icon,
                size: 16,
                color: isAccent ? AppTheme.primary : AppTheme.foreground,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  value,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: isAccent ? AppTheme.primary : AppTheme.foreground,
                    fontSize: monospace ? 17 : 14,
                    fontWeight: FontWeight.w800,
                    fontFamily: monospace ? 'monospace' : null,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _OwnerImageFallback extends StatelessWidget {
  const _OwnerImageFallback({required this.icon});

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
      child: Icon(icon, color: AppTheme.primary, size: 36),
    );
  }
}

class _OwnerImageBadge extends StatelessWidget {
  const _OwnerImageBadge({
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final String label;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foregroundColor,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _OwnerInlineStatusBadge extends StatelessWidget {
  const _OwnerInlineStatusBadge({
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
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _OwnerCompactMetric extends StatelessWidget {
  const _OwnerCompactMetric({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppTheme.mutedForeground),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.mutedForeground,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _OwnerInfoChip extends StatelessWidget {
  const _OwnerInfoChip({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: AppTheme.foreground,
              fontSize: 13,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerMicroLabel extends StatelessWidget {
  const _OwnerMicroLabel({
    required this.icon,
    required this.text,
  });

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppTheme.mutedForeground),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(
            color: AppTheme.mutedForeground,
            fontSize: 11,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

class _OwnerPillTag extends StatelessWidget {
  const _OwnerPillTag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppTheme.border),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppTheme.foreground,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _OwnerCountBadge extends StatelessWidget {
  const _OwnerCountBadge({
    required this.icon,
    required this.label,
    required this.iconColor,
  });

  final IconData icon;
  final String label;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: iconColor),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.foreground,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerDashedEmptyState extends StatelessWidget {
  const _OwnerDashedEmptyState({
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Icon(icon, size: 40, color: AppTheme.mutedForeground.withValues(alpha: 0.35)),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              height: 1.5,
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 18),
            FilledButton(
              onPressed: onAction,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
              ),
              child: Text(actionLabel!),
            ),
          ],
        ],
      ),
    );
  }
}

class _OwnerErrorState extends StatelessWidget {
  const _OwnerErrorState({
    required this.title,
    required this.message,
    required this.onRetry,
  });

  final String title;
  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE4E6)),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.error_outline_rounded,
            size: 34,
            color: Color(0xFFE11D48),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFFBE123C),
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFFE11D48),
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: onRetry,
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFBE123C),
              side: const BorderSide(color: Color(0xFFFDA4AF)),
            ),
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }
}

class _OwnerDialogInfoRow extends StatelessWidget {
  const _OwnerDialogInfoRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppTheme.foreground,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerTableHeadingStyle extends TextStyle {
  const _OwnerTableHeadingStyle()
    : super(
        color: AppTheme.mutedForeground,
        fontSize: 10,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.0,
      );
}

class _OwnerLeasePeriod {
  const _OwnerLeasePeriod({
    required this.start,
    required this.end,
    required this.amount,
    required this.isCurrent,
    required this.isPast,
    required this.progressLabel,
    required this.progressValueLabel,
    required this.totalSegments,
    required this.filledSegments,
    required this.statusLabel,
    required this.statusColor,
    required this.statusBackgroundColor,
    required this.statusBorderColor,
    required this.statusIcon,
    required this.backgroundColor,
    required this.borderColor,
  });

  final DateTime start;
  final DateTime end;
  final double amount;
  final bool isCurrent;
  final bool isPast;
  final String progressLabel;
  final String progressValueLabel;
  final int totalSegments;
  final int filledSegments;
  final String statusLabel;
  final Color statusColor;
  final Color statusBackgroundColor;
  final Color statusBorderColor;
  final IconData statusIcon;
  final Color backgroundColor;
  final Color borderColor;
}

List<_OwnerLeasePeriod> _buildOwnerLeasePeriods(
  LeaseModel lease,
  List<TransactionModel> transactions,
) {
  final periods = <_OwnerLeasePeriod>[];
  final now = DateTime.now();
  final dayDifference = lease.endDate.difference(lease.startDate).inDays;
  final totalPeriods = lease.recurringAmount != null
      ? ((dayDifference / 30).floor() <= 0 ? 1 : (dayDifference / 30).floor())
      : 1;

  for (var index = 0; index < totalPeriods; index++) {
    final start = lease.recurringAmount != null
        ? lease.startDate.add(Duration(days: 30 * index))
        : lease.startDate;
    final end = lease.recurringAmount != null
        ? start.add(const Duration(days: 30))
        : lease.endDate;
    final monthToken = _ownerMonthToken(start);

    TransactionModel? matchingTransaction;
    for (final transaction in transactions) {
      final matchesLease = transaction.leaseId == lease.id;
      final matchesMonth =
          lease.recurringAmount == null ||
          transaction.metadata?['month']?.toString() == monthToken;
      final activeStatus =
          transaction.status.toUpperCase() == 'COMPLETED' ||
          transaction.status.toUpperCase() == 'PENDING';
      if (matchesLease && matchesMonth && activeStatus) {
        matchingTransaction = transaction;
        break;
      }
    }

    final isPast = end.isBefore(now);
    final isCurrent =
        !now.isBefore(start) && (now.isBefore(end) || _sameDate(now, end));
    final segmentCount = lease.recurringAmount != null ? 30 : 50;
    final totalDays = lease.recurringAmount != null
        ? 30
        : lease.endDate.difference(lease.startDate).inDays <= 0
        ? 1
        : lease.endDate.difference(lease.startDate).inDays;
    final elapsedDays = isPast
        ? totalDays
        : isCurrent
        ? _clampInt(now.difference(start).inDays, 0, totalDays)
        : 0;
    final filledSegments = lease.recurringAmount != null
        ? _clampInt(elapsedDays, 0, segmentCount)
        : _clampInt(((elapsedDays / totalDays) * segmentCount).round(), 0, segmentCount);

    late final String statusLabel;
    late final Color statusColor;
    late final Color statusBackgroundColor;
    late final Color statusBorderColor;
    late final IconData statusIcon;

    if (matchingTransaction?.status.toUpperCase() == 'COMPLETED') {
      statusLabel = 'Received';
      statusColor = const Color(0xFF16A34A);
      statusBackgroundColor = const Color(0xFFF0FDF4);
      statusBorderColor = const Color(0xFFBBF7D0);
      statusIcon = Icons.check_circle_outline_rounded;
    } else if (matchingTransaction?.status.toUpperCase() == 'PENDING') {
      statusLabel = 'Pending';
      statusColor = const Color(0xFFD97706);
      statusBackgroundColor = const Color(0xFFFFFBEB);
      statusBorderColor = const Color(0xFFFDE68A);
      statusIcon = Icons.schedule_outlined;
    } else if (isCurrent) {
      statusLabel = 'Expected soon';
      statusColor = AppTheme.primary;
      statusBackgroundColor = AppTheme.primary.withValues(alpha: 0.06);
      statusBorderColor = AppTheme.primary.withValues(alpha: 0.20);
      statusIcon = Icons.schedule_outlined;
    } else {
      statusLabel = 'Upcoming';
      statusColor = AppTheme.mutedForeground;
      statusBackgroundColor = const Color(0xFFF3F4F6);
      statusBorderColor = const Color(0xFFE5E7EB);
      statusIcon = Icons.schedule_outlined;
    }

    periods.add(
      _OwnerLeasePeriod(
        start: start,
        end: end,
        amount: lease.recurringAmount ?? lease.totalPrice,
        isCurrent: isCurrent,
        isPast: isPast,
        progressLabel: lease.recurringAmount != null
            ? 'PAYMENT PROGRESS (FIXED 30 DAYS)'
            : 'LEASE TERM PROGRESS',
        progressValueLabel: lease.recurringAmount != null
            ? '$elapsedDays/30 Days'
            : '${((filledSegments / segmentCount) * 100).round()}%',
        totalSegments: segmentCount,
        filledSegments: filledSegments,
        statusLabel: statusLabel,
        statusColor: statusColor,
        statusBackgroundColor: statusBackgroundColor,
        statusBorderColor: statusBorderColor,
        statusIcon: statusIcon,
        backgroundColor: isPast
            ? const Color(0xFFF0FDF4)
            : isCurrent
            ? Colors.white
            : const Color(0xFFF8FAFC),
        borderColor: isPast
            ? const Color(0xFFDCFCE7)
            : isCurrent
            ? AppTheme.primary.withValues(alpha: 0.25)
            : AppTheme.border,
      ),
    );
  }

  return periods;
}

double _ownerLeaseProgress(LeaseModel lease) {
  final totalDays = lease.endDate.difference(lease.startDate).inDays;
  if (totalDays <= 0) {
    return 0;
  }
  final elapsed = DateTime.now().difference(lease.startDate).inDays;
  final value = elapsed / totalDays;
  if (value.isNaN) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

String _ownerLeaseProgressLabel(LeaseModel lease) {
  final totalDays = lease.endDate.difference(lease.startDate).inDays;
  final totalMonths = ((totalDays / 30).floor() <= 0 ? 1 : (totalDays / 30).floor());
  final elapsed = DateTime.now().difference(lease.startDate).inDays;
  final currentMonth = _clampInt((elapsed / 30).floor() + 1, 0, totalMonths);
  return '$currentMonth of $totalMonths months';
}

Color _propertyStatusColor(String status) {
  switch (status.toUpperCase()) {
    case 'AVAILABLE':
      return const Color(0xFF10B981);
    case 'RENTED':
    case 'BOOKED':
      return const Color(0xFFF59E0B);
    default:
      return const Color(0xFFE11D48);
  }
}

String _ownerMonthToken(DateTime date) {
  return '${_ownerMonthAbbreviation(date.month)}-${date.year}';
}

String _ownerShortDate(DateTime date) {
  return '${_ownerMonthAbbreviation(date.month)} ${date.day}';
}

String _ownerTransactionTypeLabel(TransactionModel transaction) {
  switch (transaction.type.toUpperCase()) {
    case 'RENT':
      return 'Rent Income';
    case 'FULL_PURCHASE':
      return 'Property Sale';
    default:
      return prettyDashboardLabel(transaction.type);
  }
}

dynamic _findOwnerBankByCode(List<dynamic> banks, String? bankCode) {
  final normalizedCode = bankCode?.trim();
  if (normalizedCode == null || normalizedCode.isEmpty) {
    return null;
  }

  for (final bank in banks) {
    if (bank is! Map) {
      continue;
    }
    final bankId = bank['id']?.toString().trim();
    final bankCodeValue = bank['code']?.toString().trim();
    if (bankId == normalizedCode || bankCodeValue == normalizedCode) {
      return bank;
    }
  }

  return null;
}

String _ownerBankLabel(dynamic bank) {
  if (bank is Map) {
    return (bank['name'] ?? bank['bank_name'] ?? bank['id'] ?? 'Bank')
        .toString();
  }
  return 'Bank';
}

String? _ownerMaintenancePreviewImage(MaintenanceRequestModel request) {
  for (final image in request.images) {
    if (_looksLikeOwnerNetworkImage(image)) {
      return image.trim();
    }
  }

  final propertyImage = request.property?.mainImage.trim();
  if (propertyImage != null && _looksLikeOwnerNetworkImage(propertyImage)) {
    return propertyImage;
  }

  return null;
}

bool _looksLikeOwnerNetworkImage(String image) {
  final normalized = image.trim().toLowerCase();
  return normalized.startsWith('http://') || normalized.startsWith('https://');
}

bool _matchesOwnerTransactionDateFilter(DateTime date, String filter) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final candidate = DateTime(date.year, date.month, date.day);

  switch (filter) {
    case 'today':
      return _sameDate(candidate, today);
    case 'yesterday':
      return _sameDate(
        candidate,
        today.subtract(const Duration(days: 1)),
      );
    case 'this-month':
      return candidate.year == today.year && candidate.month == today.month;
    case 'this-year':
      return candidate.year == today.year;
    default:
      return true;
  }
}

bool _sameDate(DateTime left, DateTime right) {
  return left.year == right.year &&
      left.month == right.month &&
      left.day == right.day;
}

int _clampInt(int value, int min, int max) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

String _ownerMonthAbbreviation(int month) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return months[month - 1];
}

Future<void> _noopRefresh() async {}
