import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../applications/models/application_model.dart';
import '../applications/providers/application_provider.dart';
import '../auth/providers/auth_provider.dart';
import '../chat/providers/chat_provider.dart';
import '../chat/repositories/chat_repository.dart';
import '../favorites/providers/favorite_provider.dart';
import '../leases/models/lease_model.dart';
import '../leases/providers/lease_provider.dart';
import '../listings/models/property_model.dart';
import '../maintenance/models/maintenance_request_model.dart';
import '../maintenance/providers/maintenance_provider.dart';
import '../transactions/models/transaction_model.dart';
import '../transactions/providers/transaction_provider.dart';
import 'widgets/dashboard_utils.dart';
import 'widgets/role_dashboard_scaffold.dart';

class CustomerDashboardScreen extends ConsumerStatefulWidget {
  const CustomerDashboardScreen({super.key});

  @override
  ConsumerState<CustomerDashboardScreen> createState() =>
      _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState
    extends ConsumerState<CustomerDashboardScreen> {
  String _activeTab = 'applications';
  String _transactionDateFilter = 'all';
  String _transactionStatusFilter = 'all';
  String _favoriteFilter = 'all';
  final Set<String> _expandedLeaseSchedules = <String>{};

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(authProvider).user;
    final applicationsAsync = ref.watch(myApplicationsProvider);
    final leasesAsync = ref.watch(leasesProvider);
    final maintenanceAsync = ref.watch(maintenanceRequestsProvider);
    final transactionsAsync = ref.watch(transactionsProvider);
    final favoritesAsync = ref.watch(favoriteProvider);
    final leaseActionState = ref.watch(leaseActionProvider);
    final maintenanceActionState = ref.watch(maintenanceActionProvider);

    final applications =
        applicationsAsync.valueOrNull ?? const <PropertyApplication>[];
    final leases = leasesAsync.valueOrNull ?? const <LeaseModel>[];
    final maintenance =
        maintenanceAsync.valueOrNull ?? const <MaintenanceRequestModel>[];
    final transactions =
        transactionsAsync.valueOrNull ?? const <TransactionModel>[];
    final favorites = favoritesAsync.valueOrNull ?? const <PropertyModel>[];

    final activeLeases = leases.where((lease) => lease.isActive).length;
    final completedApplications =
        applications.where((app) => app.isAccepted).length;
    final pendingMaintenance =
        maintenance.where((request) => request.isPending).length;
    final totalSpent = transactions
        .where((transaction) => transaction.isCompleted)
        .fold<double>(0, (sum, transaction) => sum + transaction.amount);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refreshAll,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 32),
            children: [
              _DashboardHero(
                title: 'Customer Dashboard',
                subtitle:
                    'Manage your leases, applications, and transactions',
              ),
              _PageWidth(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _StatsGrid(
                        items: [
                          _StatItem(
                            label: 'Active Leases',
                            value: '$activeLeases',
                            helper: null,
                            icon: Icons.description_outlined,
                            iconColor: AppTheme.primary,
                            iconBackground: AppTheme.primary.withValues(
                              alpha: 0.10,
                            ),
                          ),
                          _StatItem(
                            label: 'Applications',
                            value: '${applications.length}',
                            helper: '$completedApplications accepted',
                            icon: Icons.assignment_outlined,
                            iconColor: const Color(0xFF9333EA),
                            iconBackground: const Color(0xFFF3E8FF),
                          ),
                          _StatItem(
                            label: 'Favorites',
                            value: '${favorites.length}',
                            helper: 'Properties & Cars saved',
                            icon: Icons.favorite_outline_rounded,
                            iconColor: AppTheme.secondary,
                            iconBackground: AppTheme.secondary.withValues(
                              alpha: 0.10,
                            ),
                          ),
                          _StatItem(
                            label: 'Total Spent',
                            value: formatDashboardMoney(totalSpent),
                            helper: 'Lifetime transaction value',
                            icon: Icons.payments_outlined,
                            iconColor: const Color(0xFF0F766E),
                            iconBackground: const Color(0xFFDCFCE7),
                          ),
                          _StatItem(
                            label: 'Maintenance',
                            value: '${maintenance.length}',
                            helper: '$pendingMaintenance pending',
                            icon: Icons.handyman_outlined,
                            iconColor: const Color(0xFFD97706),
                            iconBackground: const Color(0xFFFEF3C7),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      _DashboardTabBar(
                        activeTab: _activeTab,
                        tabs: const [
                          ('applications', 'Applications'),
                          ('maintenance', 'Maintenance'),
                          ('leases', 'Leases'),
                          ('transactions', 'Transactions'),
                          ('favorites', 'Favorites'),
                        ],
                        onChanged: (value) {
                          setState(() => _activeTab = value);
                        },
                      ),
                      const SizedBox(height: 24),
                      if (currentUser == null)
                        const DashboardEmptyState(
                          title: 'Sign in required',
                          message:
                              'Sign in to view your customer dashboard activity.',
                        )
                      else
                        _buildActiveTab(
                          context: context,
                          applicationsAsync: applicationsAsync,
                          applications: applications,
                          leasesAsync: leasesAsync,
                          leases: leases,
                          maintenanceAsync: maintenanceAsync,
                          maintenance: maintenance,
                          transactionsAsync: transactionsAsync,
                          transactions: transactions,
                          favoritesAsync: favoritesAsync,
                          favorites: favorites,
                          leaseActionState: leaseActionState,
                          maintenanceActionState: maintenanceActionState,
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _refreshAll() async {
    ref.invalidate(myApplicationsProvider);
    ref.invalidate(leasesProvider);
    ref.invalidate(maintenanceRequestsProvider);
    ref.invalidate(transactionsProvider);
    ref.invalidate(favoriteProvider);
    await Future.wait([
      ref.read(myApplicationsProvider.future),
      ref.read(leasesProvider.future),
      ref.read(maintenanceRequestsProvider.future),
      ref.read(transactionsProvider.future),
      ref.read(favoriteProvider.future),
    ]);
  }

  Widget _buildActiveTab({
    required BuildContext context,
    required AsyncValue<List<PropertyApplication>> applicationsAsync,
    required List<PropertyApplication> applications,
    required AsyncValue<List<LeaseModel>> leasesAsync,
    required List<LeaseModel> leases,
    required AsyncValue<List<MaintenanceRequestModel>> maintenanceAsync,
    required List<MaintenanceRequestModel> maintenance,
    required AsyncValue<List<TransactionModel>> transactionsAsync,
    required List<TransactionModel> transactions,
    required AsyncValue<List<PropertyModel>> favoritesAsync,
    required List<PropertyModel> favorites,
    required LeaseActionState leaseActionState,
    required MaintenanceActionState maintenanceActionState,
  }) {
    switch (_activeTab) {
      case 'maintenance':
        return _buildMaintenanceTab(
          context: context,
          maintenanceAsync: maintenanceAsync,
          maintenance: maintenance,
          leases: leases,
          maintenanceActionState: maintenanceActionState,
        );
      case 'leases':
        return _buildLeasesTab(
          context: context,
          leasesAsync: leasesAsync,
          leases: leases,
          transactions: transactions,
          leaseActionState: leaseActionState,
        );
      case 'transactions':
        return _buildTransactionsTab(
          context: context,
          transactionsAsync: transactionsAsync,
          transactions: transactions,
        );
      case 'favorites':
        return _buildFavoritesTab(
          context: context,
          favoritesAsync: favoritesAsync,
          favorites: favorites,
        );
      case 'applications':
      default:
        return _buildApplicationsTab(
          context: context,
          applicationsAsync: applicationsAsync,
          applications: applications,
        );
    }
  }

  Widget _buildApplicationsTab({
    required BuildContext context,
    required AsyncValue<List<PropertyApplication>> applicationsAsync,
    required List<PropertyApplication> applications,
  }) {
    if (applicationsAsync.isLoading && applications.isEmpty) {
      return const DashboardLoadingState(label: 'Loading applications...');
    }

    if (applicationsAsync.hasError && applications.isEmpty) {
      return DashboardEmptyState(
        title: 'Applications unavailable',
        message:
            applicationsAsync.error.toString().replaceFirst('Exception: ', ''),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _TabHeader(
          title: 'My Applications',
          subtitle:
              'Monitor and manage your property applications in real-time',
          trailing: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _CountBadge(
                icon: Icons.schedule_rounded,
                label:
                    '${applications.where((item) => item.isPending).length} Active',
                iconColor: const Color(0xFF3B82F6),
              ),
              _CountBadge(
                icon: Icons.check_circle_rounded,
                label:
                    '${applications.where((item) => item.isAccepted).length} Accepted',
                iconColor: const Color(0xFF22C55E),
              ),
            ],
          ),
        ),
        if (applications.isEmpty)
          const DashboardEmptyState(
            title: 'No applications found',
            message: 'You haven\'t submitted any applications yet.',
          )
        else
          Column(
            children: applications
                .map(
                  (application) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _ApplicationCard(
                      application: application,
                      onProfileTap: application.managerId.isEmpty
                          ? null
                          : () => context.push(
                              '/profile/view/${application.managerId}',
                            ),
                      onChatTap: application.isAccepted &&
                              application.managerId.isNotEmpty
                          ? () => _startChat(application)
                          : null,
                    ),
                  ),
                )
                .toList(),
          ),
      ],
    );
  }

  Widget _buildMaintenanceTab({
    required BuildContext context,
    required AsyncValue<List<MaintenanceRequestModel>> maintenanceAsync,
    required List<MaintenanceRequestModel> maintenance,
    required List<LeaseModel> leases,
    required MaintenanceActionState maintenanceActionState,
  }) {
    if (maintenanceAsync.isLoading && maintenance.isEmpty) {
      return const DashboardLoadingState(
        label: 'Loading maintenance requests...',
      );
    }

    if (maintenanceAsync.hasError && maintenance.isEmpty) {
      return DashboardEmptyState(
        title: 'Maintenance unavailable',
        message:
            maintenanceAsync.error.toString().replaceFirst('Exception: ', ''),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _TabHeader(
          title: 'Maintenance Requests',
          subtitle: 'Track and manage your property maintenance needs',
          trailing: FilledButton.icon(
            onPressed: maintenanceActionState.isLoading
                ? null
                : () => _showNewRequestDialog(leases),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('New Request'),
          ),
        ),
        if (maintenance.isEmpty)
          const DashboardEmptyState(
            title: 'No maintenance requests found',
            message:
                'Everything looks good. If you have an issue, create a new request.',
          )
        else
          Column(
            children: maintenance
                .map(
                  (request) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _MaintenanceCard(
                      request: request,
                      isSubmitting: maintenanceActionState.isLoading,
                      onMarkFixed: request.isInProgress
                          ? () => _markMaintenanceFixed(request.id)
                          : null,
                      onSeeDetail: () => _showRequestDetailDialog(request),
                    ),
                  ),
                )
                .toList(),
          ),
      ],
    );
  }

  Widget _buildLeasesTab({
    required BuildContext context,
    required AsyncValue<List<LeaseModel>> leasesAsync,
    required List<LeaseModel> leases,
    required List<TransactionModel> transactions,
    required LeaseActionState leaseActionState,
  }) {
    if (leasesAsync.isLoading && leases.isEmpty) {
      return const DashboardLoadingState(label: 'Loading leases...');
    }

    if (leasesAsync.hasError && leases.isEmpty) {
      return DashboardEmptyState(
        title: 'Leases unavailable',
        message: leasesAsync.error.toString().replaceFirst('Exception: ', ''),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _TabHeader(
          title: 'Active Leases',
          subtitle:
              'Monitor agreement progress, monthly payment schedules, and lease actions.',
          trailing: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _CountBadge(
                icon: Icons.schedule_rounded,
                label:
                    '${leases.where((item) => item.isActive).length} Active',
                iconColor: AppTheme.primary,
              ),
              _CountBadge(
                icon: Icons.description_outlined,
                label:
                    '${leases.where((item) => item.isPending).length} Pending',
                iconColor: const Color(0xFFD97706),
              ),
            ],
          ),
        ),
        _WhitePanel(
          padding: const EdgeInsets.all(0),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.receipt_long_rounded,
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Lease Agreements',
                            style: TextStyle(
                              color: AppTheme.foreground,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Track status, payment periods, and agreement actions.',
                            style: TextStyle(
                              color: AppTheme.mutedForeground,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Divider(height: 1, color: AppTheme.border),
              Padding(
                padding: const EdgeInsets.all(16),
                child: leases.isEmpty
                    ? const DashboardEmptyState(
                        title: 'No active leases',
                        message:
                            'You don\'t have any active lease agreements at the moment.',
                      )
                    : Column(
                        children: leases
                            .map(
                              (lease) => Padding(
                                padding: const EdgeInsets.only(bottom: 18),
                                child: _LeaseCard(
                                  lease: lease,
                                  transactions: transactions,
                                  isSubmitting: leaseActionState.isLoading,
                                  isExpanded:
                                      _expandedLeaseSchedules.contains(lease.id),
                                  onToggleSchedule: () {
                                    setState(() {
                                      if (_expandedLeaseSchedules.contains(
                                        lease.id,
                                      )) {
                                        _expandedLeaseSchedules.remove(lease.id);
                                      } else {
                                        _expandedLeaseSchedules.add(lease.id);
                                      }
                                    });
                                  },
                                  onViewDetails: () =>
                                      context.push('/leases/${lease.id}'),
                                  onAccept:
                                      lease.isPending && !lease.customerAccepted
                                      ? () => _acceptLease(lease.id)
                                      : null,
                                  onCancel:
                                      lease.isActive ||
                                          lease.isCancellationPending
                                      ? () => _cancelLease(lease.id)
                                      : null,
                                  onPayRent:
                                      lease.owner?.chapaSubaccountId != null &&
                                          lease.owner!
                                              .chapaSubaccountId!
                                              .isNotEmpty
                                      ? (monthDate) =>
                                            _payRent(context, lease, monthDate)
                                      : null,
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
  }

  Widget _buildTransactionsTab({
    required BuildContext context,
    required AsyncValue<List<TransactionModel>> transactionsAsync,
    required List<TransactionModel> transactions,
  }) {
    if (transactionsAsync.isLoading && transactions.isEmpty) {
      return const DashboardLoadingState(label: 'Loading transactions...');
    }

    if (transactionsAsync.hasError && transactions.isEmpty) {
      return DashboardEmptyState(
        title: 'Transactions unavailable',
        message:
            transactionsAsync.error.toString().replaceFirst('Exception: ', ''),
      );
    }

    final filteredTransactions = transactions.where((transaction) {
      final statusMatches = _transactionStatusFilter == 'all' ||
          transaction.status.toUpperCase() ==
              _transactionStatusFilter.toUpperCase();
      return statusMatches &&
          _matchesTransactionDate(transaction.createdAt, _transactionDateFilter);
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _TabHeader(
          title: 'My Transactions',
          subtitle: 'A record of your payments and purchases',
        ),
        _WhitePanel(
          padding: const EdgeInsets.all(0),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Expanded(
                      child: Row(
                        children: [
                          Icon(
                            Icons.receipt_long_rounded,
                            color: AppTheme.primary,
                          ),
                          SizedBox(width: 10),
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
                    const SizedBox(width: 12),
                    Flexible(
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        alignment: WrapAlignment.end,
                        children: [
                          _FilterSelect(
                            width: 136,
                            value: _transactionDateFilter,
                            items: const [
                              ('all', 'All Time'),
                              ('today', 'Today'),
                              ('yesterday', 'Yesterday'),
                              ('this-month', 'This Month'),
                              ('this-year', 'This Year'),
                            ],
                            onChanged: (value) {
                              setState(() => _transactionDateFilter = value);
                            },
                          ),
                          _FilterSelect(
                            width: 136,
                            value: _transactionStatusFilter,
                            items: const [
                              ('all', 'All Status'),
                              ('completed', 'Completed'),
                              ('pending', 'Pending'),
                              ('failed', 'Failed'),
                            ],
                            onChanged: (value) {
                              setState(() => _transactionStatusFilter = value);
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: AppTheme.border),
              if (filteredTransactions.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(28),
                  child: DashboardEmptyState(
                    title: 'No transactions found',
                    message:
                        'No transactions matched your current filters.',
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: _TransactionHistoryTable(
                    transactions: filteredTransactions,
                    onReceipt: (transaction) {
                      if (!transaction.isCompleted) return;
                      context.push(
                        '/transactions/receipt/${transaction.id}',
                        extra: transaction,
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFavoritesTab({
    required BuildContext context,
    required AsyncValue<List<PropertyModel>> favoritesAsync,
    required List<PropertyModel> favorites,
  }) {
    if (favoritesAsync.isLoading && favorites.isEmpty) {
      return const DashboardLoadingState(label: 'Loading favorites...');
    }

    if (favoritesAsync.hasError && favorites.isEmpty) {
      return DashboardEmptyState(
        title: 'Favorites unavailable',
        message: favoritesAsync.error.toString().replaceFirst('Exception: ', ''),
      );
    }

    final filteredFavorites = favorites.where((property) {
      return _favoriteFilter == 'all' || property.assetType == _favoriteFilter;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _TabHeader(
          title: 'My Favorites',
          subtitle: 'Properties and cars you\'ve saved for later',
          trailing: _SegmentToggle(
            value: _favoriteFilter,
            items: const [
              ('all', 'All'),
              ('HOME', 'Houses'),
              ('CAR', 'Cars'),
            ],
            onChanged: (value) {
              setState(() => _favoriteFilter = value);
            },
          ),
        ),
        if (filteredFavorites.isEmpty)
          DashboardEmptyState(
            title: 'No favorites found',
            message: _favoriteFilter == 'all'
                ? 'You haven\'t saved any items yet. Start exploring.'
                : 'You don\'t have any ${_favoriteFilter == 'HOME' ? 'houses' : 'cars'} in your favorites.',
          )
        else
          LayoutBuilder(
            builder: (context, constraints) {
              final crossAxisCount = constraints.maxWidth >= 1040
                  ? 3
                  : constraints.maxWidth >= 700
                  ? 2
                  : 1;

              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: filteredFavorites.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: crossAxisCount == 1 ? 0.93 : 0.8,
                ),
                itemBuilder: (context, index) {
                  final property = filteredFavorites[index];
                  return _FavoriteCard(
                    property: property,
                    onTap: () => context.push('/property-detail', extra: property),
                  );
                },
              );
            },
          ),
      ],
    );
  }

  bool _matchesTransactionDate(DateTime value, String filter) {
    final now = DateTime.now();
    switch (filter) {
      case 'today':
        return value.year == now.year &&
            value.month == now.month &&
            value.day == now.day;
      case 'yesterday':
        final yesterday = now.subtract(const Duration(days: 1));
        return value.year == yesterday.year &&
            value.month == yesterday.month &&
            value.day == yesterday.day;
      case 'this-month':
        return value.year == now.year && value.month == now.month;
      case 'this-year':
        return value.year == now.year;
      case 'all':
      default:
        return true;
    }
  }

  Future<void> _startChat(PropertyApplication application) async {
    try {
      await ref.read(chatRepositoryProvider).initiateChat(
            receiverId: application.managerId,
          );
      ref.invalidate(chatConversationsProvider);
      if (!mounted) return;
      context.push(
        '/inbox/thread/${application.managerId}',
        extra: {
          'name': application.managerName ?? 'Conversation',
          'image': application.managerProfileImage,
        },
      );
    } catch (error) {
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _acceptLease(String leaseId) async {
    try {
      await ref
          .read(leaseActionProvider.notifier)
          .acceptLease(leaseId: leaseId, role: 'customer');
      _showMessage('Lease updated successfully.');
    } catch (error) {
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _cancelLease(String leaseId) async {
    try {
      await ref
          .read(leaseActionProvider.notifier)
          .requestCancellation(leaseId: leaseId, role: 'customer');
      _showMessage('Lease cancellation updated.');
    } catch (error) {
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _markMaintenanceFixed(String requestId) async {
    try {
      await ref
          .read(maintenanceActionProvider.notifier)
          .updateStatus(requestId: requestId, status: 'completed');
      _showMessage('Maintenance marked as fixed.');
    } catch (error) {
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _payRent(BuildContext context, LeaseModel lease, DateTime monthDate) {
    final subaccountId = lease.owner?.chapaSubaccountId;
    if (subaccountId == null || subaccountId.isEmpty) {
      _showMessage('Payment setup incomplete. Please contact the owner.');
      return;
    }

    context.push(
      '/checkout',
      extra: {
        'amount': lease.recurringAmount ?? lease.totalPrice,
        'title': lease.property?.title ?? 'Lease payment',
        'category': 'Lease Payment',
        'leaseId': lease.id,
        'propertyId': lease.propertyId,
        'payeeId': lease.ownerId,
        'subaccountId': subaccountId,
        'meta': {
          'leaseId': lease.id,
          'month': _monthYearLabel(monthDate),
        },
      },
    );
  }

  Future<void> _showNewRequestDialog(List<LeaseModel> leases) async {
    final activeLeases = leases.where((lease) => lease.isActive).toList();
    if (activeLeases.isEmpty) {
      _showMessage(
        'You need an active lease before creating maintenance requests.',
      );
      return;
    }

    String selectedPropertyId = activeLeases.first.propertyId;
    String selectedCategory = 'PLUMBING';
    final descriptionController = TextEditingController();

    final submitted = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: Colors.white,
              title: const Text(
                'New Maintenance Request',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      value: selectedPropertyId,
                      decoration: _dialogDecoration('Property'),
                      items: activeLeases
                          .map(
                            (lease) => DropdownMenuItem(
                              value: lease.propertyId,
                              child: Text(
                                lease.property?.title ?? 'Property',
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() => selectedPropertyId = value);
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: selectedCategory,
                      decoration: _dialogDecoration('Category'),
                      items: const [
                        'PLUMBING',
                        'ELECTRICAL',
                        'INTERNET',
                        'DAMAGE',
                        'CLEANING',
                        'ENGINE',
                        'BATTERY',
                        'TIRE',
                        'OTHER',
                      ]
                          .map(
                            (category) => DropdownMenuItem(
                              value: category,
                              child: Text(category.replaceAll('_', ' ')),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() => selectedCategory = value);
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descriptionController,
                      minLines: 4,
                      maxLines: 6,
                      decoration: _dialogDecoration('Detailed Description')
                          .copyWith(
                            hintText: 'Describe the issue in more detail...',
                          ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Submit Request'),
                ),
              ],
            );
          },
        );
      },
    );

    if (submitted == true) {
      if (descriptionController.text.trim().isEmpty) {
        _showMessage('Please describe the issue before submitting.');
        descriptionController.dispose();
        return;
      }
      try {
        await ref
            .read(maintenanceActionProvider.notifier)
            .createRequest(
              propertyId: selectedPropertyId,
              category: selectedCategory,
              description: descriptionController.text.trim(),
            );
        _showMessage('Maintenance request submitted successfully.');
      } catch (error) {
        _showMessage(error.toString().replaceFirst('Exception: ', ''));
      }
    }

    descriptionController.dispose();
  }

  Future<void> _showRequestDetailDialog(MaintenanceRequestModel request) async {
    await showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          title: const Text(
            'Request Details',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
          content: SizedBox(
            width: 460,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _DialogInfo(label: 'Status', value: prettyDashboardLabel(request.status)),
                _DialogInfo(label: 'Property', value: request.propertyTitle),
                _DialogInfo(
                  label: 'Category',
                  value: prettyDashboardLabel(request.category),
                ),
                _DialogInfo(
                  label: 'Date Reported',
                  value: request.dateLabel ?? 'Unknown',
                ),
                const SizedBox(height: 8),
                const Text(
                  'Description',
                  style: TextStyle(
                    color: AppTheme.mutedForeground,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
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
                      height: 1.45,
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  InputDecoration _dialogDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: AppTheme.mutedForeground),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppTheme.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppTheme.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppTheme.primary),
      ),
    );
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

class _DashboardHero extends StatelessWidget {
  const _DashboardHero({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.primary, AppTheme.primary, AppTheme.secondary],
        ),
      ),
      child: _PageWidth(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 28, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.w900,
                  height: 1.08,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                style: const TextStyle(
                  color: Color(0xE6FFFFFF),
                  fontSize: 17,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PageWidth extends StatelessWidget {
  const _PageWidth({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1280),
        child: child,
      ),
    );
  }
}

class _StatItem {
  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
    this.helper,
    this.iconColor,
    this.iconBackground,
  });

  final String label;
  final String value;
  final String? helper;
  final IconData icon;
  final Color? iconColor;
  final Color? iconBackground;
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.items});

  final List<_StatItem> items;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 760) {
          return SizedBox(
            height: 168,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 14),
              itemBuilder: (context, index) => SizedBox(
                width: 280,
                child: _CustomerStatCard(item: items[index]),
              ),
            ),
          );
        }

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: constraints.maxWidth >= 1180 ? 5 : 3,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.45,
          ),
          itemBuilder: (context, index) => _CustomerStatCard(item: items[index]),
        );
      },
    );
  }
}

class _CustomerStatCard extends StatelessWidget {
  const _CustomerStatCard({required this.item});

  final _StatItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
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
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.label,
                      style: const TextStyle(
                        color: AppTheme.mutedForeground,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item.value,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        height: 1.0,
                      ),
                    ),
                  ],
                ),
              ),
              if (item.iconBackground != null)
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: item.iconBackground,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    item.icon,
                    color: item.iconColor ?? AppTheme.primary,
                  ),
                ),
            ],
          ),
          if (item.helper?.trim().isNotEmpty ?? false) ...[
            const Spacer(),
            Text(
              item.helper!,
              style: TextStyle(
                color: item.helper!.contains('accepted')
                    ? const Color(0xFF22C55E)
                    : item.helper!.contains('pending')
                    ? const Color(0xFFD97706)
                    : AppTheme.mutedForeground,
                fontSize: 13,
                fontWeight:
                    item.helper!.contains('accepted') || item.helper!.contains('pending')
                    ? FontWeight.w700
                    : FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DashboardTabBar extends StatelessWidget {
  const _DashboardTabBar({
    required this.activeTab,
    required this.tabs,
    required this.onChanged,
  });

  final String activeTab;
  final List<(String, String)> tabs;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: tabs.map((tab) {
            final selected = activeTab == tab.$1;
            return Padding(
              padding: const EdgeInsets.only(right: 6),
              child: InkWell(
                onTap: () => onChanged(tab.$1),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: selected ? AppTheme.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: selected
                        ? const [
                            BoxShadow(
                              color: Color(0x22000000),
                              blurRadius: 10,
                              offset: Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    tab.$2,
                    style: TextStyle(
                      color: selected ? Colors.white : AppTheme.mutedForeground,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _TabHeader extends StatelessWidget {
  const _TabHeader({
    required this.title,
    required this.subtitle,
    this.trailing,
  });

  final String title;
  final String subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth < 760) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: AppTheme.mutedForeground,
                    height: 1.45,
                  ),
                ),
                if (trailing != null) ...[
                  const SizedBox(height: 14),
                  trailing!,
                ],
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppTheme.mutedForeground,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: 12),
                trailing!,
              ],
            ],
          );
        },
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  const _CountBadge({
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

class _WhitePanel extends StatelessWidget {
  const _WhitePanel({
    required this.child,
    this.padding = const EdgeInsets.all(20),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _FilterSelect extends StatelessWidget {
  const _FilterSelect({
    required this.value,
    required this.items,
    required this.onChanged,
    this.width = 140,
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
        isDense: true,
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 10,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppTheme.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppTheme.border),
          ),
        ),
        items: items
            .map(
              (item) => DropdownMenuItem(
                value: item.$1,
                child: Text(
                  item.$2,
                  style: const TextStyle(fontSize: 13),
                ),
              ),
            )
            .toList(),
        onChanged: (next) {
          if (next != null) onChanged(next);
        },
      ),
    );
  }
}

class _SegmentToggle extends StatelessWidget {
  const _SegmentToggle({
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String value;
  final List<(String, String)> items;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: items.map((item) {
          final selected = value == item.$1;
          return InkWell(
            onTap: () => onChanged(item.$1),
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: selected ? Colors.white : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
                boxShadow: selected
                    ? const [
                        BoxShadow(
                          color: Color(0x12000000),
                          blurRadius: 10,
                          offset: Offset(0, 3),
                        ),
                      ]
                    : null,
              ),
              child: Text(
                item.$2,
                style: TextStyle(
                  color: selected
                      ? AppTheme.foreground
                      : AppTheme.mutedForeground,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  const _ApplicationCard({
    required this.application,
    this.onProfileTap,
    this.onChatTap,
  });

  final PropertyApplication application;
  final VoidCallback? onProfileTap;
  final VoidCallback? onChatTap;

  @override
  Widget build(BuildContext context) {
    final statusColor = application.isAccepted
        ? const Color(0xFF15803D)
        : application.isRejected
        ? const Color(0xFFB91C1C)
        : const Color(0xFF1D4ED8);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Container(
        decoration: const BoxDecoration(
          border: Border(
            left: BorderSide(color: AppTheme.primary, width: 4),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 760;
              final image = _ListingImage(
                imageUrl: application.propertyImage,
                height: compact ? 180 : 124,
                width: compact ? double.infinity : 132,
                badgeLabel: application.listingLabel,
              );
              final content = _ApplicationCardContent(
                application: application,
                statusColor: statusColor,
                onProfileTap: onProfileTap,
                onChatTap: onChatTap,
              );

              if (compact) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    image,
                    const SizedBox(height: 16),
                    content,
                  ],
                );
              }

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  image,
                  const SizedBox(width: 18),
                  Expanded(child: content),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _ApplicationCardContent extends StatelessWidget {
  const _ApplicationCardContent({
    required this.application,
    required this.statusColor,
    this.onProfileTap,
    this.onChatTap,
  });

  final PropertyApplication application;
  final Color statusColor;
  final VoidCallback? onProfileTap;
  final VoidCallback? onChatTap;

  @override
  Widget build(BuildContext context) {
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
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 14,
                        color: AppTheme.mutedForeground,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          application.propertyLocation,
                          style: const TextStyle(
                            color: AppTheme.mutedForeground,
                            fontSize: 13,
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
                        const SizedBox(width: 4),
                        Text(
                          application.dateLabel!,
                          style: const TextStyle(
                            color: AppTheme.mutedForeground,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                prettyDashboardLabel(application.status),
                style: TextStyle(
                  color: statusColor,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _MiniInfoCard(
              title: application.listingType.toLowerCase() == 'rent'
                  ? 'Rent'
                  : 'Price',
              value:
                  '${formatDashboardMoney(application.price)}${application.listingType.toLowerCase() == 'rent' ? '/mo' : ''}',
            ),
            _MiniInfoCard(
              title: 'Asset',
              value: prettyDashboardLabel(application.assetType),
            ),
          ],
        ),
        if (application.message?.trim().isNotEmpty ?? false) ...[
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.border),
            ),
            child: Text(
              '"${application.message!}"',
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
        const SizedBox(height: 16),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          alignment: WrapAlignment.end,
          children: [
            OutlinedButton.icon(
              onPressed: onProfileTap,
              icon: const Icon(Icons.person_outline_rounded, size: 16),
              label: const Text('See Profile'),
            ),
            if (application.isAccepted)
              FilledButton.icon(
                onPressed: onChatTap,
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                ),
                icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                label: const Text('Start Chat'),
              ),
          ],
        ),
      ],
    );
  }
}

class _MaintenanceCard extends StatelessWidget {
  const _MaintenanceCard({
    required this.request,
    this.isSubmitting = false,
    this.onMarkFixed,
    this.onSeeDetail,
  });

  final MaintenanceRequestModel request;
  final bool isSubmitting;
  final VoidCallback? onMarkFixed;
  final VoidCallback? onSeeDetail;

  @override
  Widget build(BuildContext context) {
    final stripColor = request.isCompleted
        ? const Color(0xFF22C55E)
        : request.isInProgress
        ? const Color(0xFF3B82F6)
        : const Color(0xFFEAB308);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 220,
            decoration: BoxDecoration(
              color: stripColor,
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(24),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final compact = constraints.maxWidth < 760;
                  final image = request.images.isNotEmpty
                      ? _ListingImage(
                          imageUrl: request.images.first,
                          height: compact ? 180 : 122,
                          width: compact ? double.infinity : 180,
                        )
                      : null;

                  final info = Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _PlainBadge(
                            label: prettyDashboardLabel(request.status),
                            background: stripColor.withValues(alpha: 0.12),
                            foreground: stripColor,
                          ),
                          _PlainBadge(
                            label: request.dateLabel ?? 'Unknown date',
                            background: const Color(0xFFF3F4F6),
                            foreground: AppTheme.mutedForeground,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        prettyDashboardLabel(request.category),
                        style: const TextStyle(
                          color: AppTheme.foreground,
                          fontSize: 19,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        request.propertyTitle,
                        style: const TextStyle(
                          color: AppTheme.mutedForeground,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        request.description,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.foreground,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          if (request.isInProgress)
                            FilledButton.icon(
                              onPressed: isSubmitting ? null : onMarkFixed,
                              style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFF16A34A),
                                foregroundColor: Colors.white,
                              ),
                              icon: const Icon(Icons.check_circle, size: 16),
                              label: const Text('Mark as Fixed'),
                            ),
                          OutlinedButton.icon(
                            onPressed: onSeeDetail,
                            icon: const Icon(
                              Icons.visibility_outlined,
                              size: 16,
                            ),
                            label: const Text('See Detail'),
                          ),
                        ],
                      ),
                    ],
                  );

                  if (image == null) return info;

                  if (compact) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        image,
                        const SizedBox(height: 16),
                        info,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      image,
                      const SizedBox(width: 18),
                      Expanded(child: info),
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LeaseCard extends StatelessWidget {
  const _LeaseCard({
    required this.lease,
    required this.transactions,
    required this.isExpanded,
    required this.onToggleSchedule,
    this.isSubmitting = false,
    this.onViewDetails,
    this.onAccept,
    this.onCancel,
    this.onPayRent,
  });

  final LeaseModel lease;
  final List<TransactionModel> transactions;
  final bool isExpanded;
  final VoidCallback onToggleSchedule;
  final bool isSubmitting;
  final VoidCallback? onViewDetails;
  final VoidCallback? onAccept;
  final VoidCallback? onCancel;
  final ValueChanged<DateTime>? onPayRent;

  @override
  Widget build(BuildContext context) {
    final amount = lease.recurringAmount ?? lease.totalPrice;
    final statusColor = dashboardStatusColor(lease.status);
    final leaseDays = lease.endDate.difference(lease.startDate).inDays.abs();
    final elapsedDays = DateTime.now()
        .difference(lease.startDate)
        .inDays
        .clamp(0, leaseDays == 0 ? 1 : leaseDays)
        .toDouble();
    final progress = leaseDays == 0 ? 0.0 : (elapsedDays / leaseDays) * 100;
    final billingPeriods = _buildLeaseBillingPeriods(lease, transactions);
    _LeaseBillingPeriod? currentPeriod;
    for (final period in billingPeriods) {
      if (period.isCurrent) {
        currentPeriod = period;
        break;
      }
      if (period.isPast && !period.isPaid && !period.isPending) {
        currentPeriod = period;
      }
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 760;
              final image = _ListingImage(
                imageUrl: lease.property?.mainImage,
                height: compact ? 180 : 96,
                width: compact ? double.infinity : 96,
              );
              final info = Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    lease.property?.title ?? 'Lease agreement',
                    style: const TextStyle(
                      color: AppTheme.foreground,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    lease.property?.locationLabel ?? 'Unknown location',
                    style: const TextStyle(
                      color: AppTheme.mutedForeground,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _PlainBadge(
                        label:
                            'Started: ${formatDashboardDate(lease.startDate)}',
                        background: const Color(0xFFF3F4F6),
                        foreground: AppTheme.mutedForeground,
                      ),
                      _PlainBadge(
                        label: prettyDashboardLabel(lease.status),
                        background: statusColor.withValues(alpha: 0.12),
                        foreground: statusColor,
                      ),
                    ],
                  ),
                ],
              );

              final amountBox = Column(
                crossAxisAlignment:
                    compact ? CrossAxisAlignment.start : CrossAxisAlignment.end,
                children: [
                  Text(
                    formatDashboardMoney(amount),
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    lease.recurringAmount != null ? '/month' : 'total',
                    style: const TextStyle(color: AppTheme.mutedForeground),
                  ),
                ],
              );

              if (compact) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    image,
                    const SizedBox(height: 16),
                    info,
                    const SizedBox(height: 16),
                    amountBox,
                  ],
                );
              }

              return Row(
                children: [
                  image,
                  const SizedBox(width: 16),
                  Expanded(child: info),
                  const SizedBox(width: 16),
                  amountBox,
                ],
              );
            },
          ),
          const SizedBox(height: 18),
          const Divider(color: AppTheme.border),
          const SizedBox(height: 16),
          InkWell(
            onTap: onToggleSchedule,
            borderRadius: BorderRadius.circular(18),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.payments_outlined,
                    size: 18,
                    color: AppTheme.primary,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lease.recurringAmount != null
                              ? 'Monthly Payment Schedule'
                              : 'Lease Payment Settlement',
                          style: const TextStyle(
                            color: AppTheme.foreground,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          lease.recurringAmount != null
                              ? 'Review each billing period and pay the active cycle.'
                              : 'Review the full-term lease settlement.',
                          style: const TextStyle(
                            color: AppTheme.mutedForeground,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  _PlainBadge(
                    label: lease.recurringAmount != null ? 'MONTHLY' : 'ONE-TIME',
                    background: Colors.white,
                    foreground: AppTheme.foreground,
                    borderColor: const Color(0xFFE2E8F0),
                  ),
                  const SizedBox(width: 8),
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
            const SizedBox(height: 16),
            Column(
              children: billingPeriods
                  .map(
                    (period) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _LeaseScheduleCard(
                        period: period,
                        lease: lease,
                        onPayRent: onPayRent,
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Text(
                      'Lease Progress',
                      style: TextStyle(
                        color: AppTheme.mutedForeground,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${progress.clamp(0, 100).round()}%',
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                LinearProgressIndicator(
                  value: ((progress / 100).clamp(0.0, 1.0) as num).toDouble(),
                  minHeight: 8,
                  backgroundColor: const Color(0xFFE5E7EB),
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(999),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Text(
                      'Started ${formatDashboardDate(lease.startDate)}',
                      style: const TextStyle(
                        color: AppTheme.mutedForeground,
                        fontSize: 12,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      currentPeriod == null
                          ? 'Lease term tracked automatically'
                          : '${currentPeriod.index} of ${billingPeriods.length} periods',
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              OutlinedButton(
                onPressed: onViewDetails,
                child: const Text('View Details'),
              ),
              if (lease.isPending && !lease.customerAccepted)
                FilledButton.icon(
                  onPressed: isSubmitting ? null : onAccept,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.check_circle_outline, size: 16),
                  label: const Text('Accept Lease'),
                ),
              if (lease.isActive || lease.isCancellationPending)
                OutlinedButton.icon(
                  onPressed: isSubmitting ? null : onCancel,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: lease.isCancellationPending
                        ? const Color(0xFFEA580C)
                        : const Color(0xFFDC2626),
                  ),
                  icon: const Icon(Icons.close_rounded, size: 16),
                  label: Text(
                    lease.isCancellationPending
                        ? 'Confirm Cancellation'
                        : 'Cancel Lease',
                  ),
                ),
              if (currentPeriod != null &&
                  lease.isActive &&
                  !currentPeriod.isPaid &&
                  !currentPeriod.isPending &&
                  onPayRent != null &&
                  (currentPeriod.isCurrent || currentPeriod.isPast))
                FilledButton(
                  onPressed: () => onPayRent?.call(currentPeriod!.start),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Pay Rent'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TransactionHistoryTable extends StatelessWidget {
  const _TransactionHistoryTable({
    required this.transactions,
    required this.onReceipt,
  });

  final List<TransactionModel> transactions;
  final ValueChanged<TransactionModel> onReceipt;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 860) {
          return Column(
            children: transactions
                .map(
                  (transaction) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _TransactionHistoryMobileCard(
                      transaction: transaction,
                      onReceipt: transaction.isCompleted
                          ? () => onReceipt(transaction)
                          : null,
                    ),
                  ),
                )
                .toList(),
          );
        }

        return ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: AppTheme.border),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Container(
                  color: const Color(0xFFF8FAFC),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 14,
                  ),
                  child: const Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: _TableHeading(label: 'Transaction ID'),
                      ),
                      Expanded(
                        flex: 3,
                        child: _TableHeading(label: 'Description'),
                      ),
                      Expanded(child: _TableHeading(label: 'Date')),
                      Expanded(child: _TableHeading(label: 'Amount')),
                      Expanded(child: _TableHeading(label: 'Status')),
                      Expanded(child: _TableHeading(label: 'Action')),
                    ],
                  ),
                ),
                ...transactions.map(
                  (transaction) => Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    decoration: const BoxDecoration(
                      border: Border(
                        top: BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: Text(
                            transaction.chapaReference ??
                                'TX-${transaction.id.substring(0, 8).toUpperCase()}',
                            style: const TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: AppTheme.primary.withValues(alpha: 0.10),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Icons.payments_outlined,
                                  size: 18,
                                  color: AppTheme.primary,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      transaction.type.toUpperCase() == 'RENT'
                                          ? 'Rent Payment'
                                          : 'Property Purchase',
                                      style: const TextStyle(
                                        color: AppTheme.foreground,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      transaction.metadata?['month']
                                              ?.toString() ??
                                          transaction.property?.title ??
                                          'Payment',
                                      style: const TextStyle(
                                        color: AppTheme.mutedForeground,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Text(
                            formatDashboardDate(transaction.createdAt),
                            style: const TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Text(
                            formatDashboardMoney(transaction.amount),
                            style: const TextStyle(
                              color: AppTheme.foreground,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: _StatusPill(status: transaction.status),
                          ),
                        ),
                        Expanded(
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: transaction.isCompleted
                                ? OutlinedButton(
                                    onPressed: () => onReceipt(transaction),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 14,
                                        vertical: 12,
                                      ),
                                    ),
                                    child: const Text('View Receipt'),
                                  )
                                : const Text(
                                    '—',
                                    style: TextStyle(
                                      color: AppTheme.mutedForeground,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _TransactionHistoryMobileCard extends StatelessWidget {
  const _TransactionHistoryMobileCard({
    required this.transaction,
    this.onReceipt,
  });

  final TransactionModel transaction;
  final VoidCallback? onReceipt;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
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
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.payments_outlined,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      transaction.type.toUpperCase() == 'RENT'
                          ? 'Rent Payment'
                          : 'Property Purchase',
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      transaction.metadata?['month']?.toString() ??
                          transaction.property?.title ??
                          'Payment',
                      style: const TextStyle(
                        color: AppTheme.mutedForeground,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              _StatusPill(status: transaction.status),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 18,
            runSpacing: 12,
            children: [
              _LabeledValue(
                label: 'Transaction ID',
                value: transaction.chapaReference ??
                    'TX-${transaction.id.substring(0, 8).toUpperCase()}',
              ),
              _LabeledValue(
                label: 'Date',
                value: formatDashboardDate(transaction.createdAt),
              ),
              _LabeledValue(
                label: 'Amount',
                value: formatDashboardMoney(transaction.amount),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              if (onReceipt != null)
                OutlinedButton.icon(
                  onPressed: onReceipt,
                  icon: const Icon(Icons.receipt_long_outlined, size: 16),
                  label: const Text('View Receipt'),
                )
              else
                const Text(
                  'Receipt not available yet',
                  style: TextStyle(
                    color: AppTheme.mutedForeground,
                    fontWeight: FontWeight.w600,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TableHeading extends StatelessWidget {
  const _TableHeading({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        color: AppTheme.mutedForeground,
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.6,
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = dashboardStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Text(
        prettyDashboardLabel(status).toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class _LeaseScheduleCard extends StatelessWidget {
  const _LeaseScheduleCard({
    required this.period,
    required this.lease,
    this.onPayRent,
  });

  final _LeaseBillingPeriod period;
  final LeaseModel lease;
  final ValueChanged<DateTime>? onPayRent;

  @override
  Widget build(BuildContext context) {
    final amount = lease.recurringAmount ?? lease.totalPrice;
    final background = period.isPast
        ? const Color(0xFFF0FDF4)
        : period.isCurrent
        ? Colors.white
        : const Color(0xFFF8FAFC);
    final border = period.isPast
        ? const Color(0xFFBBF7D0)
        : period.isCurrent
        ? AppTheme.primary.withValues(alpha: 0.18)
        : AppTheme.border;
    final titleColor = period.isCurrent
        ? AppTheme.primary
        : AppTheme.foreground;
    final fillColor = period.isPast
        ? const Color(0xFF22C55E)
        : AppTheme.primary;
    final barUnits = lease.recurringAmount != null ? 30 : 50;
    final filledUnits = lease.recurringAmount != null
        ? period.daysFilled
        : ((period.progressPercent / 100) * barUnits).round();

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
        boxShadow: period.isCurrent
            ? const [
                BoxShadow(
                  color: Color(0x1400644F),
                  blurRadius: 18,
                  offset: Offset(0, 10),
                ),
              ]
            : null,
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 760;
          final left = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(
                    '${_monthDayLabel(period.start)} - ${_monthDayYearLabel(period.end)}',
                    style: TextStyle(
                      color: titleColor,
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                  if (period.isCurrent)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'CURRENT',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                formatDashboardMoney(amount),
                style: const TextStyle(
                  color: AppTheme.foreground,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          );

          final middle = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      lease.recurringAmount != null
                          ? 'Billing Progress (Fixed 30 Days)'
                          : 'Lease Term Progress',
                      style: const TextStyle(
                        color: AppTheme.mutedForeground,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
                  Text(
                    lease.recurringAmount != null
                        ? '${period.daysFilled}/${period.totalDays} Days'
                        : '${period.progressPercent.round()}%',
                    style: TextStyle(
                      color: period.isPast
                          ? const Color(0xFF16A34A)
                          : period.isCurrent
                          ? AppTheme.primary
                          : AppTheme.mutedForeground,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: List.generate(barUnits, (index) {
                  final filled = index < filledUnits;
                  return Expanded(
                    child: Container(
                      height: 10,
                      margin: EdgeInsets.only(
                        right: index == barUnits - 1 ? 0 : 2,
                      ),
                      decoration: BoxDecoration(
                        color: filled ? fillColor : const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  );
                }),
              ),
            ],
          );

          final right = _LeasePeriodAction(
            lease: lease,
            period: period,
            onPayRent: onPayRent,
          );

          if (compact) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                left,
                const SizedBox(height: 16),
                middle,
                const SizedBox(height: 16),
                right,
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(width: 150, child: left),
              const SizedBox(width: 20),
              Expanded(child: middle),
              const SizedBox(width: 20),
              SizedBox(width: 170, child: right),
            ],
          );
        },
      ),
    );
  }
}

class _LeasePeriodAction extends StatelessWidget {
  const _LeasePeriodAction({
    required this.lease,
    required this.period,
    this.onPayRent,
  });

  final LeaseModel lease;
  final _LeaseBillingPeriod period;
  final ValueChanged<DateTime>? onPayRent;

  @override
  Widget build(BuildContext context) {
    if (period.isPaid && period.transaction != null) {
      return FilledButton.icon(
        onPressed: () => context.push(
          '/transactions/receipt/${period.transaction!.id}',
          extra: period.transaction,
        ),
        style: FilledButton.styleFrom(
          backgroundColor: const Color(0xFF16A34A),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        icon: const Icon(Icons.check_circle, size: 16),
        label: const Text('Collected'),
      );
    }

    if (period.isPending) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFBEB),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.schedule_rounded, size: 16, color: Color(0xFFD97706)),
            SizedBox(width: 8),
            Text(
              'Pending',
              style: TextStyle(
                color: Color(0xFFD97706),
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      );
    }

    final canPay = onPayRent != null &&
        lease.isActive &&
        (period.isCurrent || period.isPast);

    if (canPay) {
      return FilledButton(
        onPressed: () => onPayRent?.call(period.start),
        style: FilledButton.styleFrom(
          backgroundColor: AppTheme.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: const Text('Pay Now'),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            period.isPast
                ? Icons.warning_amber_rounded
                : Icons.schedule_rounded,
            size: 16,
            color: AppTheme.mutedForeground,
          ),
          const SizedBox(width: 8),
          Text(
            period.isPast ? 'Overdue' : 'Upcoming',
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _LeaseBillingPeriod {
  const _LeaseBillingPeriod({
    required this.index,
    required this.start,
    required this.end,
    required this.totalDays,
    required this.daysFilled,
    required this.progressPercent,
    required this.isPast,
    required this.isCurrent,
    required this.isPaid,
    required this.isPending,
    required this.transaction,
  });

  final int index;
  final DateTime start;
  final DateTime end;
  final int totalDays;
  final int daysFilled;
  final double progressPercent;
  final bool isPast;
  final bool isCurrent;
  final bool isPaid;
  final bool isPending;
  final TransactionModel? transaction;
}

List<_LeaseBillingPeriod> _buildLeaseBillingPeriods(
  LeaseModel lease,
  List<TransactionModel> transactions,
) {
  final start = lease.startDate;
  final end = lease.endDate;
  final now = DateTime.now();
  final totalDays = end.difference(start).inDays.abs();
  final totalPeriods = lease.recurringAmount != null
      ? (((totalDays / 30).floor()).clamp(1, 9999) as num).toInt()
      : 1;

  return List.generate(totalPeriods, (index) {
    final periodStart = lease.recurringAmount != null
        ? start.add(Duration(days: 30 * index))
        : start;
    final calculatedEnd = lease.recurringAmount != null
        ? periodStart.add(const Duration(days: 30))
        : end;
    final periodEnd = calculatedEnd.isAfter(end) ? end : calculatedEnd;
    final periodTotalDays =
        ((periodEnd.difference(periodStart).inDays).abs().clamp(1, 30) as num)
            .toInt();
    final isPast = periodEnd.isBefore(now);
    final isCurrent = !now.isBefore(periodStart) && !now.isAfter(periodEnd);
    final rawDaysFilled = isPast
        ? periodTotalDays
        : isCurrent
        ? (now.difference(periodStart).inDays.clamp(0, periodTotalDays) as num)
              .toInt()
        : 0;
    final progressPercent = periodTotalDays == 0
        ? 0.0
        : (rawDaysFilled / periodTotalDays) * 100;
    final monthLabel = _monthYearLabel(periodStart);
    final legacyMonthLabel =
        '${periodStart.month.toString().padLeft(2, '0')}-${periodStart.year}';
    final matchingTransaction = transactions.cast<TransactionModel?>().firstWhere(
      (transaction) =>
          transaction != null &&
          transaction.leaseId == lease.id &&
          (transaction.status.toUpperCase() == 'COMPLETED' ||
              transaction.status.toUpperCase() == 'PENDING') &&
          (transaction.metadata?['month']?.toString() == monthLabel ||
              transaction.metadata?['month']?.toString() == legacyMonthLabel),
      orElse: () => null,
    );

    return _LeaseBillingPeriod(
      index: index + 1,
      start: periodStart,
      end: periodEnd,
      totalDays: periodTotalDays,
      daysFilled: rawDaysFilled,
      progressPercent: progressPercent,
      isPast: isPast,
      isCurrent: isCurrent,
      isPaid: matchingTransaction?.status.toUpperCase() == 'COMPLETED',
      isPending: matchingTransaction?.status.toUpperCase() == 'PENDING',
      transaction: matchingTransaction,
    );
  });
}

String _monthYearLabel(DateTime value) {
  const monthNames = [
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
  return '${monthNames[value.month - 1]}-${value.year}';
}

String _monthDayLabel(DateTime value) {
  const monthNames = [
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
  return '${monthNames[value.month - 1]} ${value.day.toString().padLeft(2, '0')}';
}

String _monthDayYearLabel(DateTime value) {
  const monthNames = [
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
  return '${monthNames[value.month - 1]} ${value.day.toString().padLeft(2, '0')}, ${value.year}';
}

class _FavoriteCard extends StatelessWidget {
  const _FavoriteCard({
    required this.property,
    this.onTap,
  });

  final PropertyModel property;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
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
            _ListingImage(
              imageUrl: property.mainImage,
              height: 210,
              width: double.infinity,
              badgeLabel: property.isHome ? 'HOME' : 'CAR',
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    property.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.foreground,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    property.locationLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.mutedForeground,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    formatDashboardMoney(property.price),
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ListingImage extends StatelessWidget {
  const _ListingImage({
    required this.imageUrl,
    required this.height,
    required this.width,
    this.badgeLabel,
  });

  final String? imageUrl;
  final double height;
  final double width;
  final String? badgeLabel;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Stack(
        children: [
          Container(
            width: width,
            height: height,
            color: const Color(0xFFF3F4F6),
            child: imageUrl?.trim().isNotEmpty == true
                ? Image.network(
                    imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.image_outlined,
                      color: AppTheme.mutedForeground,
                    ),
                  )
                : const Icon(
                    Icons.image_outlined,
                    color: AppTheme.mutedForeground,
                  ),
          ),
          if (badgeLabel?.trim().isNotEmpty ?? false)
            Positioned(
              top: 10,
              left: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  badgeLabel!,
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _MiniInfoCard extends StatelessWidget {
  const _MiniInfoCard({
    required this.title,
    required this.value,
  });

  final String title;
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
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: AppTheme.foreground,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _PlainBadge extends StatelessWidget {
  const _PlainBadge({
    required this.label,
    required this.background,
    required this.foreground,
    this.borderColor,
  });

  final String label;
  final Color background;
  final Color foreground;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: borderColor == null ? null : Border.all(color: borderColor!),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foreground,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _LabeledValue extends StatelessWidget {
  const _LabeledValue({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.mutedForeground,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: AppTheme.foreground,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _DialogInfo extends StatelessWidget {
  const _DialogInfo({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 96,
            child: Text(
              label,
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
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
