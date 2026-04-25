import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../chat/providers/chat_provider.dart';
import '../chat/repositories/chat_repository.dart';
import '../dashboard/widgets/dashboard_page_scaffold.dart';
import '../dashboard/widgets/dashboard_utils.dart';
import '../dashboard/widgets/role_dashboard_scaffold.dart';
import 'models/application_model.dart';
import 'providers/application_provider.dart';

class ManagedApplicationsScreen extends ConsumerStatefulWidget {
  const ManagedApplicationsScreen({super.key});

  @override
  ConsumerState<ManagedApplicationsScreen> createState() =>
      _ManagedApplicationsScreenState();
}

class _ManagedApplicationsScreenState
    extends ConsumerState<ManagedApplicationsScreen> {
  String _query = '';
  String _statusFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final applicationsAsync = ref.watch(managedApplicationsProvider);
    final updateState = ref.watch(applicationStatusUpdateProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            DashboardPageHeader(
              title: 'Property Applications',
              subtitle:
                  'Review every customer application, update status, and turn approved inquiries into leases.',
              onBack: () => Navigator.of(context).maybePop(),
              action: OutlinedButton.icon(
                onPressed: () => ref.invalidate(managedApplicationsProvider),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primary,
                  side: const BorderSide(color: AppTheme.border),
                ),
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Refresh'),
              ),
            ),
            Expanded(
              child: applicationsAsync.when(
                data: (applications) {
                  final filtered = applications.where((application) {
                    final normalizedQuery = _query.trim().toLowerCase();
                    final matchesQuery =
                        normalizedQuery.isEmpty ||
                        application.propertyTitle.toLowerCase().contains(
                              normalizedQuery,
                            ) ||
                        application.propertyLocation.toLowerCase().contains(
                              normalizedQuery,
                            ) ||
                        (application.customerName ?? '')
                            .toLowerCase()
                            .contains(normalizedQuery);

                    final matchesStatus = switch (_statusFilter) {
                      'pending' => application.isPending,
                      'accepted' => application.isAccepted,
                      'rejected' => application.isRejected,
                      _ => true,
                    };

                    return matchesQuery && matchesStatus;
                  }).toList(growable: false);

                  final pending =
                      applications.where((item) => item.isPending).length;
                  final accepted =
                      applications.where((item) => item.isAccepted).length;
                  final rejected =
                      applications.where((item) => item.isRejected).length;

                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(managedApplicationsProvider);
                      await ref.read(managedApplicationsProvider.future);
                    },
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
                      children: [
                        Center(
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 1200),
                            child: Column(
                              children: [
                                DashboardSectionCard(
                                  title: 'Application pipeline',
                                  child: Column(
                                    children: [
                                      LayoutBuilder(
                                        builder: (context, constraints) {
                                          final stacked =
                                              constraints.maxWidth < 720;

                                          return stacked
                                              ? Column(
                                                  children: [
                                                    _ApplicationSearchField(
                                                      initialValue: _query,
                                                      onChanged: (value) =>
                                                          setState(
                                                            () => _query = value,
                                                          ),
                                                    ),
                                                    const SizedBox(height: 14),
                                                    _ApplicationFilterWrap(
                                                      selected: _statusFilter,
                                                      onChanged: (value) =>
                                                          setState(
                                                            () => _statusFilter =
                                                                value,
                                                          ),
                                                    ),
                                                  ],
                                                )
                                              : Row(
                                                  children: [
                                                    Expanded(
                                                      child:
                                                          _ApplicationSearchField(
                                                        initialValue: _query,
                                                        onChanged: (value) =>
                                                            setState(
                                                              () =>
                                                                  _query = value,
                                                            ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 16),
                                                    Expanded(
                                                      child: Align(
                                                        alignment: Alignment
                                                            .centerRight,
                                                        child:
                                                            _ApplicationFilterWrap(
                                                          selected:
                                                              _statusFilter,
                                                          onChanged: (value) =>
                                                              setState(
                                                                () =>
                                                                    _statusFilter =
                                                                        value,
                                                              ),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                );
                                        },
                                      ),
                                      const SizedBox(height: 16),
                                      Wrap(
                                        spacing: 12,
                                        runSpacing: 12,
                                        children: [
                                          DashboardMetricTile(
                                            icon:
                                                Icons.hourglass_top_rounded,
                                            label: '$pending pending',
                                          ),
                                          DashboardMetricTile(
                                            icon:
                                                Icons.check_circle_outline,
                                            label: '$accepted accepted',
                                          ),
                                          DashboardMetricTile(
                                            icon: Icons.close_rounded,
                                            label: '$rejected rejected',
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                                if (applications.isEmpty)
                                  const DashboardEmptyState(
                                    title: 'No applications yet',
                                    message:
                                        'When customers apply to your listings, their requests will appear here for review.',
                                  )
                                else if (filtered.isEmpty)
                                  const DashboardEmptyState(
                                    title: 'No applications match this filter',
                                    message:
                                        'Try another search term or switch the application status filter.',
                                  )
                                else
                                  ...filtered.map(
                                    (application) => Padding(
                                      padding: const EdgeInsets.only(
                                        bottom: 14,
                                      ),
                                      child: _ManagedApplicationCard(
                                        application: application,
                                        isUpdating: updateState.isLoading,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
                loading: () => Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: 1200),
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: DashboardLoadingState(
                        label: 'Loading applications...',
                      ),
                    ),
                  ),
                ),
                error: (error, _) => Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1200),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: DashboardEmptyState(
                        title: 'Applications unavailable',
                        message: error.toString().replaceFirst(
                              'Exception: ',
                              '',
                            ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ApplicationSearchField extends StatelessWidget {
  const _ApplicationSearchField({
    required this.initialValue,
    required this.onChanged,
  });

  final String initialValue;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      initialValue: initialValue,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: 'Search by property, location, or applicant',
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
    );
  }
}

class _ApplicationFilterWrap extends StatelessWidget {
  const _ApplicationFilterWrap({
    required this.selected,
    required this.onChanged,
  });

  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        DashboardFilterChip(
          label: 'All',
          selected: selected == 'all',
          onTap: () => onChanged('all'),
        ),
        DashboardFilterChip(
          label: 'Pending',
          selected: selected == 'pending',
          onTap: () => onChanged('pending'),
        ),
        DashboardFilterChip(
          label: 'Accepted',
          selected: selected == 'accepted',
          onTap: () => onChanged('accepted'),
        ),
        DashboardFilterChip(
          label: 'Rejected',
          selected: selected == 'rejected',
          onTap: () => onChanged('rejected'),
        ),
      ],
    );
  }
}

class _ManagedApplicationCard extends ConsumerWidget {
  const _ManagedApplicationCard({
    required this.application,
    required this.isUpdating,
  });

  final PropertyApplication application;
  final bool isUpdating;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DashboardEntityCard(
      title: application.propertyTitle,
      subtitle: application.propertyLocation,
      imageUrl: application.propertyImage,
      imageIcon: application.assetType.toUpperCase() == 'CAR'
          ? Icons.directions_car_outlined
          : Icons.home_work_outlined,
      status: DashboardStatusPill(
        label: prettyDashboardLabel(application.status),
        color: dashboardStatusColor(application.status),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _ApplicantAvatar(
                name: application.customerName ?? 'Customer',
                imageUrl: application.customerProfileImage,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      application.customerName ?? 'Unknown applicant',
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    if (application.customerEmail?.trim().isNotEmpty ??
                        false)
                      Text(
                        application.customerEmail!,
                        style: const TextStyle(
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          if (application.message?.trim().isNotEmpty ?? false) ...[
            const SizedBox(height: 12),
            Text(
              application.message!,
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                height: 1.5,
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
        DashboardMetricTile(
          icon: Icons.calendar_today_outlined,
          label: application.dateLabel ?? 'Recently submitted',
        ),
      ],
      actions: [
        OutlinedButton.icon(
          onPressed: () => _messageCustomer(context, ref),
          icon: const Icon(Icons.chat_bubble_outline, size: 18),
          label: const Text('Message'),
        ),
        if (application.isPending)
          FilledButton.icon(
            onPressed: isUpdating
                ? null
                : () => _updateStatus(context, ref, 'accepted'),
            icon: const Icon(Icons.check_rounded, size: 18),
            label: const Text('Accept'),
          ),
        if (application.isPending)
          OutlinedButton.icon(
            onPressed: isUpdating
                ? null
                : () => _updateStatus(context, ref, 'rejected'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFDC2626),
              side: const BorderSide(color: Color(0xFFFECACA)),
            ),
            icon: const Icon(Icons.close_rounded, size: 18),
            label: const Text('Reject'),
          ),
        if (!application.isPending)
          OutlinedButton.icon(
            onPressed: isUpdating
                ? null
                : () => _updateStatus(context, ref, 'pending'),
            icon: const Icon(Icons.restart_alt_rounded, size: 18),
            label: const Text('Reset'),
          ),
        if (application.isAccepted)
          FilledButton.icon(
            onPressed: () async {
              final created = await context.push(
                '/leases/create',
                extra: {'application': application},
              );
              if (created == true) {
                ref.invalidate(managedApplicationsProvider);
              }
            },
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.note_add_outlined, size: 18),
            label: const Text('Create lease'),
          ),
      ],
    );
  }

  Future<void> _updateStatus(
    BuildContext context,
    WidgetRef ref,
    String status,
  ) async {
    try {
      await ref
          .read(applicationStatusUpdateProvider.notifier)
          .updateStatus(applicationId: application.id, status: status);
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Application ${status == 'accepted'
                ? 'accepted'
                : status == 'rejected'
                    ? 'rejected'
                    : 'reset to pending'}',
          ),
        ),
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
    }
  }

  Future<void> _messageCustomer(BuildContext context, WidgetRef ref) async {
    if (application.customerId.isEmpty) {
      return;
    }

    try {
      await ref.read(chatRepositoryProvider).initiateChat(
            receiverId: application.customerId,
            content:
                'Hello, I am following up on your application for ${application.propertyTitle}.',
          );
      ref.invalidate(chatConversationsProvider);
      if (!context.mounted) {
        return;
      }

      context.go(
        '/inbox/thread/${application.customerId}',
        extra: {
          'name': application.customerName,
          'image': application.customerProfileImage,
        },
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
    }
  }
}

class _ApplicantAvatar extends StatelessWidget {
  const _ApplicantAvatar({
    required this.name,
    this.imageUrl,
  });

  final String name;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final trimmedImage = imageUrl?.trim();
    return CircleAvatar(
      radius: 20,
      backgroundColor: const Color(0xFFE8F3EF),
      backgroundImage: trimmedImage != null && trimmedImage.isNotEmpty
          ? CachedNetworkImageProvider(trimmedImage)
          : null,
      child: trimmedImage == null || trimmedImage.isEmpty
          ? Text(
              name.isEmpty ? '?' : name[0].toUpperCase(),
              style: const TextStyle(
                color: AppTheme.primary,
                fontWeight: FontWeight.w800,
              ),
            )
          : null,
    );
  }
}

