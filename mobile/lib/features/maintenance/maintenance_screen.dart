import 'package:cached_network_image/cached_network_image.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../auth/providers/auth_provider.dart';
import '../leases/models/lease_model.dart';
import '../leases/providers/lease_provider.dart';
import 'models/maintenance_request_model.dart';
import 'providers/maintenance_provider.dart';

class MaintenanceScreen extends ConsumerWidget {
  const MaintenanceScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(maintenanceRequestsProvider);
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Maintenance')),
      floatingActionButton: user?.isCustomer == true
          ? FloatingActionButton.extended(
              onPressed: () => _showCreateRequestDialog(context, ref),
              backgroundColor: AppTheme.secondary,
              foregroundColor: AppTheme.darkBackground,
              icon: const Icon(Icons.add),
              label: const Text('Request'),
            )
          : null,
      body: requestsAsync.when(
        data: (requests) {
          if (requests.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 80),
                _EmptyMaintenance(isCustomer: user?.isCustomer ?? false),
              ],
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(maintenanceRequestsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
              itemCount: requests.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) =>
                  _MaintenanceCard(request: requests[index]),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString().replaceFirst('Exception: ', ''),
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.redAccent),
            ),
          ),
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
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
      return;
    }
    final customerLeases = leases
        .where((lease) => lease.isActive)
        .toList(growable: false);
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
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1E293B),
              title: const Text('New Maintenance Request'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      value: selectedPropertyId,
                      dropdownColor: const Color(0xFF1E293B),
                      decoration: const InputDecoration(labelText: 'Property'),
                      items: customerLeases
                          .map(
                            (lease) => DropdownMenuItem(
                              value: lease.propertyId,
                              child: Text(lease.property?.title ?? 'Property'),
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
                      dropdownColor: const Color(0xFF1E293B),
                      decoration: const InputDecoration(labelText: 'Category'),
                      items:
                          const [
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
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Description',
                        hintText: 'Describe the issue in detail.',
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.06),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton.icon(
                        onPressed: () async {
                          final result = await FilePicker.platform.pickFiles(
                            allowMultiple: true,
                            type: FileType.image,
                          );
                          if (result == null) return;
                          setState(() {
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
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.of(dialogContext).pop(true),
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
      await ref
          .read(maintenanceActionProvider.notifier)
          .createRequest(
            propertyId: selectedPropertyId,
            category: selectedCategory,
            description: descriptionController.text,
            imagePaths: imagePaths,
          );
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maintenance request submitted.')),
      );
    } catch (error) {
      if (!context.mounted) return;
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

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (request.images.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: request.images.first,
                    width: 72,
                    height: 72,
                    fit: BoxFit.cover,
                  ),
                )
              else
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Colors.white10,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.build_outlined,
                    color: Colors.white38,
                  ),
                ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request.propertyTitle,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      request.category.replaceAll('_', ' '),
                      style: const TextStyle(color: AppTheme.secondary),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      request.dateLabel ?? 'Recently submitted',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              _MaintenanceStatusChip(status: request.status),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            request.description,
            style: const TextStyle(color: Colors.white70, height: 1.45),
          ),
          if (request.customer != null) ...[
            const SizedBox(height: 10),
            Text(
              'Requested by ${request.customer!.name}',
              style: const TextStyle(color: Colors.white54, fontSize: 12),
            ),
          ],
          if (request.images.length > 1) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 64,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: request.images.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) => ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                    imageUrl: request.images[index],
                    width: 64,
                    height: 64,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ],
          if (canStartWork || canComplete) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                ElevatedButton(
                  onPressed: actionState.isLoading
                      ? null
                      : () => _updateStatus(
                          context,
                          ref,
                          canStartWork ? 'inprogress' : 'completed',
                        ),
                  child: Text(canStartWork ? 'Start Work' : 'Mark Completed'),
                ),
              ],
            ),
          ],
        ],
      ),
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
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Maintenance updated to $status')));
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
    }
  }
}

class _MaintenanceStatusChip extends StatelessWidget {
  const _MaintenanceStatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toLowerCase();
    final color = normalized == 'completed'
        ? const Color(0xFF34D399)
        : normalized == 'inprogress'
        ? const Color(0xFFFBBF24)
        : const Color(0xFF60A5FA);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        normalized == 'inprogress' ? 'IN PROGRESS' : normalized.toUpperCase(),
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 11,
        ),
      ),
    );
  }
}

class _EmptyMaintenance extends StatelessWidget {
  const _EmptyMaintenance({required this.isCustomer});

  final bool isCustomer;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.build_circle_outlined,
            color: AppTheme.secondary.withOpacity(0.95),
            size: 42,
          ),
          const SizedBox(height: 16),
          Text(
            'No maintenance requests',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          Text(
            isCustomer
                ? 'Use the request button to report issues with an active lease.'
                : 'Tenant maintenance issues for your listings will appear here.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, height: 1.5),
          ),
        ],
      ),
    );
  }
}
