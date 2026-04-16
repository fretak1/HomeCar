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
import 'widgets/dashboard_utils.dart';
import 'widgets/role_dashboard_scaffold.dart';

class AgentDashboardScreen extends ConsumerWidget {
  const AgentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final properties =
        ref.watch(myListingsProvider).valueOrNull ?? const <PropertyModel>[];
    final applications =
        ref.watch(managedApplicationsProvider).valueOrNull ??
        const <PropertyApplication>[];
    final leases =
        ref.watch(leasesProvider).valueOrNull ?? const <LeaseModel>[];

    return RoleDashboardScaffold(
      title: 'Agent Dashboard',
      subtitle: 'Manage assigned listings, nurture incoming applications, and initiate leases.',
      headerAction: FilledButton.icon(
        onPressed: user?.verified == true ? () => context.push('/add-listing') : null,
        style: FilledButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: AppTheme.primary,
          disabledBackgroundColor: Colors.white24,
          disabledForegroundColor: Colors.white70,
        ),
        icon: const Icon(Icons.add_home_work_outlined, size: 18),
        label: const Text('Add Property'),
      ),
      topContent: user == null || user.verified
          ? null
          : _AgentVerificationBanner(user: user),
      stats: [
        DashboardStatItem(
          label: 'My Properties',
          value: '${properties.length}',
          icon: Icons.home_work_outlined,
        ),
        DashboardStatItem(
          label: 'Applications',
          value: '${applications.length}',
          icon: Icons.assignment_outlined,
        ),
        DashboardStatItem(
          label: 'Initiated Leases',
          value: '${leases.length}',
          icon: Icons.description_outlined,
        ),
      ],
      tabs: const [
        DashboardTabItem(label: 'My Properties', child: _AgentPropertiesTab()),
        DashboardTabItem(label: 'Applications', child: _AgentApplicationsTab()),
        DashboardTabItem(label: 'Leases', child: _AgentLeasesTab()),
      ],
    );
  }
}

class _AgentVerificationBanner extends StatelessWidget {
  const _AgentVerificationBanner({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final pending = user.isAgentVerificationPending;
    final rejected = user.isAgentVerificationRejected;
    final title = pending
        ? 'Verification in progress'
        : rejected
            ? 'Verification rejected'
            : 'Verification required';
    final message = pending
        ? 'Your documents are under review. Listing management features will unlock once approval is complete.'
        : rejected
            ? 'Your last verification was rejected. Update your documents and resubmit to regain listing access.'
            : 'Upload your verification documents to unlock property management and leasing tools.';
    final accentColor = pending ? const Color(0xFFD97706) : const Color(0xFFDC2626);

    return LayoutBuilder(
      builder: (context, constraints) {
        final stacked = constraints.maxWidth < 720;

        return Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: accentColor.withValues(alpha: 0.24),
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x12000000),
                blurRadius: 18,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: stacked
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _AgentVerificationBannerBody(
                      accentColor: accentColor,
                      pending: pending,
                      title: title,
                      message: message,
                      rejectionReason: rejected ? user.rejectionReason : null,
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: () => context.push('/agent-verification'),
                        style: FilledButton.styleFrom(
                          backgroundColor: accentColor,
                          foregroundColor: Colors.white,
                        ),
                        icon: const Icon(Icons.verified_user_outlined, size: 18),
                        label: Text(pending ? 'Update Verification' : 'Verify Now'),
                      ),
                    ),
                  ],
                )
              : Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _AgentVerificationBannerBody(
                        accentColor: accentColor,
                        pending: pending,
                        title: title,
                        message: message,
                        rejectionReason:
                            rejected ? user.rejectionReason : null,
                      ),
                    ),
                    const SizedBox(width: 16),
                    FilledButton.icon(
                      onPressed: () => context.push('/agent-verification'),
                      style: FilledButton.styleFrom(
                        backgroundColor: accentColor,
                        foregroundColor: Colors.white,
                      ),
                      icon:
                          const Icon(Icons.verified_user_outlined, size: 18),
                      label: Text(pending ? 'Update' : 'Verify now'),
                    ),
                  ],
                ),
        );
      },
    );
  }
}

class _AgentVerificationBannerBody extends StatelessWidget {
  const _AgentVerificationBannerBody({
    required this.accentColor,
    required this.pending,
    required this.title,
    required this.message,
    required this.rejectionReason,
  });

  final Color accentColor;
  final bool pending;
  final String title;
  final String message;
  final String? rejectionReason;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: accentColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(
            pending ? Icons.schedule_outlined : Icons.warning_amber_rounded,
            color: accentColor,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppTheme.foreground,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                message,
                style: const TextStyle(
                  color: AppTheme.mutedForeground,
                  height: 1.5,
                ),
              ),
              if (rejectionReason != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Reason: $rejectionReason',
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _AgentPropertiesTab extends ConsumerWidget {
  const _AgentPropertiesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertiesAsync = ref.watch(myListingsProvider);
    final user = ref.watch(authProvider).user;

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
              title: 'Managed listings',
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
                    label: '${properties.length} managed listings',
                  ),
                ],
              ),
            ),
            if (properties.isEmpty)
              DashboardEmptyState(
                title: 'No managed listings',
                message: 'Assigned or created agent listings will appear here.',
                actionLabel: user?.verified == true ? 'Add Property' : 'Verify account',
                onAction: () => context.push(
                  user?.verified == true ? '/add-listing' : '/agent-verification',
                ),
              )
            else
              for (final property in properties)
                _AgentPropertyCard(
                  property: property,
                  isVerifiedAgent: user?.verified == true,
                ),
          ],
        );
      },
      loading: () => DashboardRefreshList(
        onRefresh: _noopRefresh,
        children: const [
          DashboardLoadingState(label: 'Loading managed listings...'),
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

class _AgentApplicationsTab extends ConsumerWidget {
  const _AgentApplicationsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final applicationsAsync = ref.watch(managedApplicationsProvider);
    final actionState = ref.watch(applicationStatusUpdateProvider);
    final user = ref.watch(authProvider).user;

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
              title: 'Application pipeline',
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
                title: 'No applications yet',
                message: 'Incoming customer applications for your managed listings will appear here.',
                actionLabel: 'Open applications',
                onAction: () => context.push('/manage-applications'),
              )
            else
              for (final application in applications)
                _AgentApplicationCard(
                  application: application,
                  isBusy: actionState.isLoading,
                  canManage: user?.verified == true,
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

class _AgentLeasesTab extends ConsumerWidget {
  const _AgentLeasesTab();

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
              title: 'Initiated leases',
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
                title: 'No leases created yet',
                message: 'Accepted applications can be converted into leases from your dashboard.',
                actionLabel: 'Open leases',
                onAction: () => context.push('/leases'),
              )
            else
              for (final lease in leases)
                _AgentLeaseCard(lease: lease),
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

class _AgentPropertyCard extends StatelessWidget {
  const _AgentPropertyCard({
    required this.property,
    required this.isVerifiedAgent,
  });

  final PropertyModel property;
  final bool isVerifiedAgent;

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
          onPressed: isVerifiedAgent
              ? () => context.push('/edit-listing', extra: property)
              : null,
          icon: const Icon(Icons.edit_outlined, size: 18),
          label: const Text('Edit'),
        ),
      ],
    );
  }
}

class _AgentApplicationCard extends ConsumerWidget {
  const _AgentApplicationCard({
    required this.application,
    required this.isBusy,
    required this.canManage,
  });

  final PropertyApplication application;
  final bool isBusy;
  final bool canManage;

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
      body: Text(
        'Applicant: ${application.customerName ?? 'Unknown customer'}',
        style: const TextStyle(
          color: AppTheme.foreground,
          fontWeight: FontWeight.w700,
        ),
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
            onPressed: !canManage || isBusy
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
            onPressed: !canManage || isBusy
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
            onPressed: canManage
                ? () => context.push(
                      '/leases/create',
                      extra: {'application': application},
                    )
                : null,
            icon: const Icon(Icons.note_add_outlined, size: 18),
            label: const Text('Create lease'),
          ),
      ],
    );
  }
}

class _AgentLeaseCard extends StatelessWidget {
  const _AgentLeaseCard({required this.lease});

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
        'Customer: ${lease.customer?.name ?? 'Unknown customer'}',
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

Future<void> _noopRefresh() async {}
