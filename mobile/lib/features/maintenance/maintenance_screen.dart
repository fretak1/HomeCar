import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../auth/providers/auth_provider.dart';
import '../dashboard/widgets/dashboard_page_scaffold.dart';
import '../dashboard/widgets/dashboard_utils.dart';
import '../dashboard/widgets/role_dashboard_scaffold.dart';
import '../leases/models/lease_model.dart';
import '../leases/providers/lease_provider.dart';
import 'models/maintenance_request_model.dart';
import 'providers/maintenance_provider.dart';

class MaintenanceScreen extends ConsumerStatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  ConsumerState<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends ConsumerState<MaintenanceScreen> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final requestsAsync = ref.watch(maintenanceRequestsProvider);
    final user = ref.watch(authProvider).user;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            DashboardPageHeader(
              title: 'Maintenance',
              subtitle: user?.isCustomer == true
                  ? 'Track your requests, attachments, and repair progress for active leases.'
                  : 'Manage incoming maintenance issues across your active listings and leases.',
              onBack: () => Navigator.of(context).maybePop(),
              action: user?.isCustomer == true
                  ? FilledButton.icon(
                      onPressed: () => _showCreateRequestDialog(context, ref),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                      ),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('New request'),
                    )
                  : OutlinedButton.icon(
                      onPressed: () => ref.invalidate(maintenanceRequestsProvider),
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('Refresh'),
                    ),
            ),
            Expanded(
              child: requestsAsync.when(
                data: (requests) {
                  final filtered = requests.where((request) {
                    return switch (_filter) {
                      'pending' => request.isPending,
                      'inprogress' => request.isInProgress,
                      'completed' => request.isCompleted,
                      _ => true,
                    };
                  }).toList(growable: false);

                  final pending = requests.where((item) => item.isPending).length;
                  final inProgress =
                      requests.where((item) => item.isInProgress).length;
                  final completed =
                      requests.where((item) => item.isCompleted).length;

                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(maintenanceRequestsProvider);
                      await ref.read(maintenanceRequestsProvider.future);
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
                                  title: 'Maintenance queue',
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Wrap(
                                        spacing: 10,
                                        runSpacing: 10,
                                        children: [
                                          DashboardFilterChip(
                                            label: 'All',
                                            selected: _filter == 'all',
                                            onTap: () =>
                                                setState(() => _filter = 'all'),
                                          ),
                                          DashboardFilterChip(
                                            label: 'Pending',
                                            selected: _filter == 'pending',
                                            onTap: () => setState(
                                              () => _filter = 'pending',
                                            ),
                                          ),
                                          DashboardFilterChip(
                                            label: 'In Progress',
                                            selected: _filter == 'inprogress',
                                            onTap: () => setState(
                                              () => _filter = 'inprogress',
                                            ),
                                          ),
                                          DashboardFilterChip(
                                            label: 'Completed',
                                            selected: _filter == 'completed',
                                            onTap: () => setState(
                                              () => _filter = 'completed',
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      Wrap(
                                        spacing: 12,
                                        runSpacing: 12,
                                        children: [
                                          DashboardMetricTile(
                                            icon: Icons.hourglass_top_rounded,
                                            label: '$pending pending',
                                          ),
                                          DashboardMetricTile(
                                            icon: Icons.build_circle_outlined,
                                            label: '$inProgress in progress',
                                          ),
                                          DashboardMetricTile(
                                            icon: Icons.check_circle_outline,
                                            label: '$completed completed',
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                                if (requests.isEmpty)
                                  DashboardEmptyState(
                                    title: 'No maintenance requests',
                                    message: user?.isCustomer == true
                                        ? 'Use the request button to report issues for your active leases.'
                                        : 'Tenant maintenance issues will appear here once they are submitted.',
                                    actionLabel: user?.isCustomer == true
                                        ? 'New request'
                                        : null,
                                    onAction: user?.isCustomer == true
                                        ? () => _showCreateRequestDialog(
                                              context,
                                              ref,
                                            )
                                        : null,
                                  )
                                else if (filtered.isEmpty)
                                  const DashboardEmptyState(
                                    title: 'No requests match this filter',
                                    message:
                                        'Switch the maintenance status filter to see more requests.',
                                  )
                                else
                                  ...filtered.map(
                                    (request) => Padding(
                                      padding: const EdgeInsets.only(
                                        bottom: 14,
                                      ),
                                      child: _MaintenanceCard(request: request),
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
                        label: 'Loading maintenance queue...',
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
                        title: 'Maintenance unavailable',
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

  Future<void> _showCreateRequestDialog(
    BuildContext context,
    WidgetRef ref,
  ) async {
    List<LeaseModel> leases;
    try {
      leases = await ref.read(leasesProvider.future);
    } catch (error) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
      return;
    }

    final customerLeases =
        leases.where((lease) => lease.isActive).toList(growable: false);
    if (customerLeases.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'You need an active lease before creating maintenance requests.',
          ),
        ),
      );
      return;
    }

    String selectedPropertyId = customerLeases.first.propertyId;
    String selectedCategory = 'PLUMBING';
    final descriptionController = TextEditingController();
    final imagePaths = <String>[];

    final submitted = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              backgroundColor: Colors.white,
              surfaceTintColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              title: const Text('New Maintenance Request'),
              content: SingleChildScrollView(
                child: SizedBox(
                  width: 420,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      DropdownButtonFormField<String>(
                        value: selectedPropertyId,
                        decoration: _fieldDecoration('Property'),
                        items: customerLeases
                            .map(
                              (lease) => DropdownMenuItem(
                                value: lease.propertyId,
                                child: Text(
                                  lease.property?.title ?? 'Property',
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          if (value != null) {
                            setModalState(() => selectedPropertyId = value);
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: selectedCategory,
                        decoration: _fieldDecoration('Category'),
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
                            setModalState(() => selectedCategory = value);
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: descriptionController,
                        minLines: 4,
                        maxLines: 6,
                        decoration: _fieldDecoration('Description').copyWith(
                          hintText: 'Describe the issue in detail.',
                        ),
                      ),
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final result = await FilePicker.platform.pickFiles(
                              allowMultiple: true,
                              type: FileType.image,
                            );
                            if (result == null) {
                              return;
                            }
                            setModalState(() {
                              imagePaths
                                ..clear()
                                ..addAll(
                                  result.files
                                      .where((file) => file.path != null)
                                      .map((file) => file.path!)
                                      .take(5),
                                );
                            });
                          },
                          icon: const Icon(Icons.photo_library_outlined),
                          label: Text(
                            imagePaths.isEmpty
                                ? 'Attach photos'
                                : '${imagePaths.length} photo(s) selected',
                          ),
                        ),
                      ),
                    ],
                  ),
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
                  child: const Text('Submit'),
                ),
              ],
            );
          },
        );
      },
    );

    if (submitted != true) {
      descriptionController.dispose();
      return;
    }

    try {
      await ref.read(maintenanceActionProvider.notifier).createRequest(
            propertyId: selectedPropertyId,
            category: selectedCategory,
            description: descriptionController.text,
            imagePaths: imagePaths,
          );
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maintenance request submitted.')),
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
    } finally {
      descriptionController.dispose();
    }
  }
}

class _MaintenanceCard extends ConsumerWidget {
  const _MaintenanceCard({required this.request});

  final MaintenanceRequestModel request;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final actionState = ref.watch(maintenanceActionProvider);
    final canStartWork =
        (user?.isOwnerOrAgent == true || user?.isAdmin == true) &&
        request.isPending;
    final canComplete = user?.isCustomer == true && request.isInProgress;

    return DashboardEntityCard(
      title: request.propertyTitle,
      subtitle: prettyDashboardLabel(request.category),
      imageUrl: request.property?.mainImage,
      imageIcon: Icons.handyman_outlined,
      status: DashboardStatusPill(
        label: request.isInProgress
            ? 'In Progress'
            : prettyDashboardLabel(request.status),
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
                fontWeight: FontWeight.w800,
              ),
            ),
          if (request.customer?.name?.trim().isNotEmpty ?? false)
            const SizedBox(height: 8),
          Text(
            request.description,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              height: 1.5,
            ),
          ),
        ],
      ),
      metrics: [
        DashboardMetricTile(
          icon: Icons.calendar_today_outlined,
          label: request.dateLabel ?? 'Recently submitted',
        ),
        DashboardMetricTile(
          icon: Icons.photo_library_outlined,
          label: '${request.images.length} attachments',
        ),
      ],
      actions: [
        if (canStartWork)
          FilledButton.icon(
            onPressed: actionState.isLoading
                ? null
                : () => _updateStatus(context, ref, 'inprogress'),
            icon: const Icon(Icons.play_arrow_rounded, size: 18),
            label: const Text('Start work'),
          ),
        if (canComplete)
          FilledButton.icon(
            onPressed: actionState.isLoading
                ? null
                : () => _updateStatus(context, ref, 'completed'),
            icon: const Icon(Icons.check_circle_outline, size: 18),
            label: const Text('Mark completed'),
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
          .read(maintenanceActionProvider.notifier)
          .updateStatus(requestId: request.id, status: status);
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Maintenance updated to $status')),
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

InputDecoration _fieldDecoration(String label) {
  return InputDecoration(
    labelText: label,
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
  );
}

