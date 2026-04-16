import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../applications/models/application_model.dart';
import '../applications/providers/application_provider.dart';
import '../auth/providers/auth_provider.dart';
import '../dashboard/screens/my_listings_screen.dart';
import '../leases/models/lease_model.dart';
import '../leases/providers/lease_provider.dart';
import '../listings/models/property_model.dart';
import '../maintenance/models/maintenance_request_model.dart';
import '../maintenance/providers/maintenance_provider.dart';
import '../transactions/models/transaction_model.dart';
import '../transactions/providers/transaction_provider.dart';
import 'widgets/dashboard_utils.dart';
import 'widgets/role_dashboard_scaffold.dart';

class OwnerDashboardScreen extends ConsumerWidget {
  const OwnerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final properties =
        ref.watch(myListingsProvider).valueOrNull ?? const <PropertyModel>[];
    final applications =
        ref.watch(managedApplicationsProvider).valueOrNull ??
        const <PropertyApplication>[];
    final maintenance =
        ref.watch(maintenanceRequestsProvider).valueOrNull ??
        const <MaintenanceRequestModel>[];
    final transactions =
        ref.watch(transactionsProvider).valueOrNull ??
        const <TransactionModel>[];

    final completedRevenue = transactions
        .where((transaction) => transaction.isCompleted)
        .fold<double>(0, (sum, transaction) => sum + transaction.amount);

    return RoleDashboardScaffold(
      title: 'Owner Dashboard',
      subtitle: 'Manage your listings, tenant activity, transactions, and payout settings.',
      headerAction: FilledButton.icon(
        onPressed: () => context.push('/add-listing'),
        style: FilledButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: AppTheme.primary,
        ),
        icon: const Icon(Icons.add_home_outlined, size: 18),
        label: const Text('Add Property'),
      ),
      stats: [
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
          icon: Icons.assignment_outlined,
        ),
        DashboardStatItem(
          label: 'Maintenance',
          value: '${maintenance.length}',
          icon: Icons.handyman_outlined,
          iconColor: const Color(0xFFD97706),
          iconBackground: const Color(0xFFFEF3C7),
        ),
      ],
      tabs: [
        const DashboardTabItem(label: 'My Properties', child: _OwnerPropertiesTab()),
        const DashboardTabItem(label: 'Applications', child: _OwnerApplicationsTab()),
        const DashboardTabItem(label: 'Leases', child: _OwnerLeasesTab()),
        const DashboardTabItem(label: 'Maintenance', child: _OwnerMaintenanceTab()),
        const DashboardTabItem(label: 'Transactions', child: _OwnerTransactionsTab()),
        DashboardTabItem(
          label: 'Payout',
          child: _OwnerPayoutTab(userName: user?.name ?? ''),
        ),
      ],
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
        final verifiedCount = properties.where((item) => item.isVerified).length;

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(myListingsProvider);
            await ref.read(myListingsProvider.future);
          },
          children: [
            DashboardSectionCard(
              title: 'Portfolio overview',
              trailing: TextButton(
                onPressed: () => context.push('/my-listings'),
                child: const Text('Open full page'),
              ),
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  DashboardMetricTile(
                    icon: Icons.check_circle_outline_rounded,
                    label: '$verifiedCount verified',
                  ),
                  DashboardMetricTile(
                    icon: Icons.inventory_2_outlined,
                    label: '${properties.length} active listings',
                  ),
                ],
              ),
            ),
            if (properties.isEmpty)
              DashboardEmptyState(
                title: 'No properties yet',
                message: 'Create your first listing to start receiving applications.',
                actionLabel: 'Add Property',
                onAction: () => context.push('/add-listing'),
              )
            else
              for (final property in properties)
                _OwnerPropertyCard(property: property),
          ],
        );
      },
      loading: () => DashboardRefreshList(
        onRefresh: _noopRefresh,
        children: const [
          DashboardLoadingState(label: 'Loading owner listings...'),
        ],
      ),
      error: (error, _) => DashboardRefreshList(
        onRefresh: () async {
          ref.invalidate(myListingsProvider);
          await ref.read(myListingsProvider.future);
        },
        children: [
          DashboardEmptyState(
            title: 'Listings unavailable',
            message: error.toString().replaceFirst('Exception: ', ''),
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

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(managedApplicationsProvider);
            await ref.read(managedApplicationsProvider.future);
          },
          children: [
            DashboardSectionCard(
              title: 'Incoming applications',
              trailing: TextButton(
                onPressed: () => context.push('/manage-applications'),
                child: const Text('Open full page'),
              ),
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  DashboardMetricTile(
                    icon: Icons.hourglass_top_rounded,
                    label: '$pending pending',
                  ),
                  DashboardMetricTile(
                    icon: Icons.check_circle_outline_rounded,
                    label: '$accepted accepted',
                  ),
                ],
              ),
            ),
            if (applications.isEmpty)
              DashboardEmptyState(
                title: 'No incoming applications',
                message: 'Applications from customers will appear here for review.',
                actionLabel: 'Open applications',
                onAction: () => context.push('/manage-applications'),
              )
            else
              for (final application in applications)
                _ManagedApplicationCard(
                  application: application,
                  isBusy: actionState.isLoading,
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
          DashboardEmptyState(
            title: 'Applications unavailable',
            message: error.toString().replaceFirst('Exception: ', ''),
          ),
        ],
      ),
    );
  }
}

class _OwnerLeasesTab extends ConsumerWidget {
  const _OwnerLeasesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leasesAsync = ref.watch(leasesProvider);

    return leasesAsync.when(
      data: (leases) {
        final active = leases.where((item) => item.isActive).length;
        final pending = leases.where((item) => item.isPending).length;

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(leasesProvider);
            await ref.read(leasesProvider.future);
          },
          children: [
            DashboardSectionCard(
              title: 'Lease agreements',
              trailing: TextButton(
                onPressed: () => context.push('/leases'),
                child: const Text('Open full page'),
              ),
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  DashboardMetricTile(
                    icon: Icons.check_circle_outline_rounded,
                    label: '$active active leases',
                  ),
                  DashboardMetricTile(
                    icon: Icons.pending_actions_outlined,
                    label: '$pending pending signatures',
                  ),
                ],
              ),
            ),
            if (leases.isEmpty)
              DashboardEmptyState(
                title: 'No leases yet',
                message: 'Accepted applications can be turned into leases from here.',
                actionLabel: 'Open leases',
                onAction: () => context.push('/leases'),
              )
            else
              for (final lease in leases)
                _OwnerLeaseCard(lease: lease),
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

class _OwnerMaintenanceTab extends ConsumerWidget {
  const _OwnerMaintenanceTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(maintenanceRequestsProvider);
    final actionState = ref.watch(maintenanceActionProvider);

    return requestsAsync.when(
      data: (requests) {
        final open = requests.where((item) => !item.isCompleted).length;

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(maintenanceRequestsProvider);
            await ref.read(maintenanceRequestsProvider.future);
          },
          children: [
            DashboardSectionCard(
              title: 'Maintenance queue',
              trailing: TextButton(
                onPressed: () => context.push('/maintenance'),
                child: const Text('Open full page'),
              ),
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  DashboardMetricTile(
                    icon: Icons.build_circle_outlined,
                    label: '$open open requests',
                  ),
                  DashboardMetricTile(
                    icon: Icons.fact_check_outlined,
                    label: '${requests.length} total tickets',
                  ),
                ],
              ),
            ),
            if (requests.isEmpty)
              DashboardEmptyState(
                title: 'No maintenance requests',
                message: 'Customer maintenance requests will show up here.',
                actionLabel: 'Open maintenance',
                onAction: () => context.push('/maintenance'),
              )
            else
              for (final request in requests)
                _OwnerMaintenanceCard(
                  request: request,
                  isBusy: actionState.isLoading,
                ),
          ],
        );
      },
      loading: () => DashboardRefreshList(
        onRefresh: _noopRefresh,
        children: const [
          DashboardLoadingState(label: 'Loading maintenance queue...'),
        ],
      ),
      error: (error, _) => DashboardRefreshList(
        onRefresh: () async {
          ref.invalidate(maintenanceRequestsProvider);
          await ref.read(maintenanceRequestsProvider.future);
        },
        children: [
          DashboardEmptyState(
            title: 'Maintenance unavailable',
            message: error.toString().replaceFirst('Exception: ', ''),
          ),
        ],
      ),
    );
  }
}

class _OwnerTransactionsTab extends ConsumerWidget {
  const _OwnerTransactionsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsAsync = ref.watch(transactionsProvider);

    return transactionsAsync.when(
      data: (transactions) {
        final completed = transactions.where((item) => item.isCompleted).length;
        final revenue = transactions
            .where((item) => item.isCompleted)
            .fold<double>(0, (sum, item) => sum + item.amount);

        return DashboardRefreshList(
          onRefresh: () async {
            ref.invalidate(transactionsProvider);
            await ref.read(transactionsProvider.future);
          },
          children: [
            DashboardSectionCard(
              title: 'Owner transactions',
              trailing: TextButton(
                onPressed: () => context.push('/transactions'),
                child: const Text('Open full page'),
              ),
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  DashboardMetricTile(
                    icon: Icons.check_circle_outline_rounded,
                    label: '$completed completed',
                  ),
                  DashboardMetricTile(
                    icon: Icons.account_balance_wallet_outlined,
                    label: formatDashboardMoney(revenue),
                  ),
                ],
              ),
            ),
            if (transactions.isEmpty)
              DashboardEmptyState(
                title: 'No transactions yet',
                message: 'Lease payments and deposits will appear here.',
                actionLabel: 'Open transactions',
                onAction: () => context.push('/transactions'),
              )
            else
              for (final transaction in transactions)
                _OwnerTransactionCard(transaction: transaction),
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

class _OwnerPayoutTab extends ConsumerWidget {
  const _OwnerPayoutTab({required this.userName});

  final String userName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final payoutReady =
        (user?.chapaSubaccountId?.trim().isNotEmpty ?? false) &&
        (user?.payoutBankCode?.trim().isNotEmpty ?? false) &&
        (user?.payoutAccountNumber?.trim().isNotEmpty ?? false);

    return DashboardRefreshList(
      onRefresh: () async {
        await ref.read(authProvider.notifier).refreshCurrentUser();
      },
      children: [
        DashboardSectionCard(
          title: 'Payout setup',
          trailing: FilledButton.icon(
            onPressed: () => context.push('/payout-setup'),
            icon: const Icon(Icons.account_balance_outlined, size: 18),
            label: Text(payoutReady ? 'Manage setup' : 'Complete setup'),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                payoutReady
                    ? 'Payout settings are connected and ready for $userName.'
                    : 'Finish your payout details so rent and sale proceeds can be routed correctly.',
                style: const TextStyle(
                  color: AppTheme.mutedForeground,
                  height: 1.55,
                ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  DashboardMetricTile(
                    icon: Icons.verified_outlined,
                    label: payoutReady ? 'Payout ready' : 'Setup incomplete',
                  ),
                  DashboardMetricTile(
                    icon: Icons.account_balance_outlined,
                    label: user?.payoutBankCode?.trim().isNotEmpty ?? false
                        ? 'Bank selected'
                        : 'Bank missing',
                  ),
                  DashboardMetricTile(
                    icon: Icons.badge_outlined,
                    label: user?.chapaSubaccountId?.trim().isNotEmpty ?? false
                        ? 'Chapa connected'
                        : 'Chapa not linked',
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _OwnerPropertyCard extends StatelessWidget {
  const _OwnerPropertyCard({required this.property});

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
          icon: property.isCar ? Icons.local_gas_station_outlined : Icons.bed_outlined,
          label: property.isCar
              ? prettyDashboardLabel(property.fuelType ?? 'Vehicle')
              : '${property.bedrooms ?? 0} bedrooms',
        ),
        DashboardMetricTile(
          icon: Icons.pin_drop_outlined,
          label: property.region ?? property.city ?? 'Location set',
        ),
      ],
      actions: [
        FilledButton.icon(
          onPressed: () => context.push('/property-detail', extra: property),
          icon: const Icon(Icons.visibility_outlined, size: 18),
          label: const Text('View detail'),
        ),
        OutlinedButton.icon(
          onPressed: () => context.push('/edit-listing', extra: property),
          icon: const Icon(Icons.edit_outlined, size: 18),
          label: const Text('Edit'),
        ),
      ],
    );
  }
}

class _ManagedApplicationCard extends ConsumerWidget {
  const _ManagedApplicationCard({
    required this.application,
    required this.isBusy,
  });

  final PropertyApplication application;
  final bool isBusy;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DashboardEntityCard(
      title: application.propertyTitle,
      subtitle: application.propertyLocation,
      imageUrl: application.propertyImage,
      imageIcon: Icons.assignment_outlined,
      status: DashboardStatusPill(
        label: prettyDashboardLabel(application.status),
        color: dashboardStatusColor(application.status),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Applicant: ${application.customerName ?? 'Unknown customer'}',
            style: const TextStyle(
              color: AppTheme.foreground,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (application.customerEmail?.trim().isNotEmpty ?? false) ...[
            const SizedBox(height: 4),
            Text(
              application.customerEmail!,
              style: const TextStyle(color: AppTheme.mutedForeground),
            ),
          ],
          if (application.message?.trim().isNotEmpty ?? false) ...[
            const SizedBox(height: 8),
            Text(
              application.message!,
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                height: 1.45,
              ),
            ),
          ],
        ],
      ),
      metrics: [
        DashboardMetricTile(
          icon: Icons.sell_outlined,
          label: formatDashboardMoney(application.price),
        ),
        DashboardMetricTile(
          icon: Icons.category_outlined,
          label: application.listingLabel,
        ),
      ],
      actions: [
        if (application.isPending)
          FilledButton.icon(
            onPressed: isBusy
                ? null
                : () async {
                    await ref
                        .read(applicationStatusUpdateProvider.notifier)
                        .updateStatus(
                          applicationId: application.id,
                          status: 'accepted',
                        );
                    ref.invalidate(managedApplicationsProvider);
                  },
            icon: const Icon(Icons.check_rounded, size: 18),
            label: const Text('Accept'),
          ),
        if (application.isPending)
          OutlinedButton.icon(
            onPressed: isBusy
                ? null
                : () async {
                    await ref
                        .read(applicationStatusUpdateProvider.notifier)
                        .updateStatus(
                          applicationId: application.id,
                          status: 'rejected',
                        );
                    ref.invalidate(managedApplicationsProvider);
                  },
            icon: const Icon(Icons.close_rounded, size: 18),
            label: const Text('Reject'),
          ),
        if (application.isAccepted)
          FilledButton.icon(
            onPressed: () => context.push(
              '/leases/create',
              extra: {'application': application},
            ),
            icon: const Icon(Icons.note_add_outlined, size: 18),
            label: const Text('Create lease'),
          ),
      ],
    );
  }
}

class _OwnerLeaseCard extends StatelessWidget {
  const _OwnerLeaseCard({required this.lease});

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
        'Tenant: ${lease.customer?.name ?? 'Unknown tenant'}',
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
        OutlinedButton.icon(
          onPressed: () =>
              context.push('/leases/${lease.id}/contract', extra: lease),
          icon: const Icon(Icons.description_outlined, size: 18),
          label: const Text('Contract'),
        ),
      ],
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
      nextLabel = 'Mark in progress';
    } else if (request.isInProgress) {
      nextStatus = 'completed';
      nextLabel = 'Mark completed';
    }

    return DashboardEntityCard(
      title: request.propertyTitle,
      subtitle: prettyDashboardLabel(request.category),
      imageUrl: request.property?.mainImage,
      imageIcon: Icons.handyman_outlined,
      status: DashboardStatusPill(
        label: prettyDashboardLabel(request.status),
        color: dashboardStatusColor(request.status),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (request.customer?.name?.trim().isNotEmpty ?? false)
            Text(
              'Requested by ${request.customer!.name}',
              style: const TextStyle(
                color: AppTheme.foreground,
                fontWeight: FontWeight.w700,
              ),
            ),
          const SizedBox(height: 8),
          Text(
            request.description,
            style: const TextStyle(color: AppTheme.mutedForeground, height: 1.5),
          ),
        ],
      ),
      metrics: [
        DashboardMetricTile(
          icon: Icons.calendar_today_outlined,
          label: request.dateLabel ?? 'Awaiting schedule',
        ),
        DashboardMetricTile(
          icon: Icons.photo_library_outlined,
          label: '${request.images.length} attachments',
        ),
      ],
      actions: [
        if (nextStatus != null && nextLabel != null)
          FilledButton.icon(
            onPressed: isBusy
                ? null
                : () async {
                    await ref
                        .read(maintenanceActionProvider.notifier)
                        .updateStatus(
                          requestId: request.id,
                          status: nextStatus!,
                        );
                    ref.invalidate(maintenanceRequestsProvider);
                  },
            icon: const Icon(Icons.sync_alt_rounded, size: 18),
            label: Text(nextLabel),
          ),
        OutlinedButton.icon(
          onPressed: () => context.push('/maintenance'),
          icon: const Icon(Icons.launch_rounded, size: 18),
          label: const Text('Open maintenance'),
        ),
      ],
    );
  }
}

class _OwnerTransactionCard extends StatelessWidget {
  const _OwnerTransactionCard({required this.transaction});

  final TransactionModel transaction;

  @override
  Widget build(BuildContext context) {
    return DashboardEntityCard(
      title: transaction.property?.title ?? prettyDashboardLabel(transaction.type),
      subtitle: transaction.property?.locationLabel ?? formatDashboardDate(transaction.createdAt),
      imageIcon: Icons.payments_outlined,
      status: DashboardStatusPill(
        label: prettyDashboardLabel(transaction.status),
        color: dashboardStatusColor(transaction.status),
      ),
      metrics: [
        DashboardMetricTile(
          icon: Icons.account_balance_wallet_outlined,
          label: formatDashboardMoney(transaction.amount),
        ),
        DashboardMetricTile(
          icon: Icons.calendar_today_outlined,
          label: formatDashboardDate(transaction.createdAt),
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
        OutlinedButton.icon(
          onPressed: () => context.push('/transactions'),
          icon: const Icon(Icons.launch_rounded, size: 18),
          label: const Text('Open transactions'),
        ),
      ],
    );
  }
}

Future<void> _noopRefresh() async {}
