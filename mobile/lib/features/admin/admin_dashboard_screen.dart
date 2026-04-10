import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../admin/providers/admin_provider.dart';
import '../applications/providers/application_provider.dart';
import '../auth/models/user_model.dart';
import '../leases/providers/lease_provider.dart';
import '../listings/models/property_model.dart';
import '../maintenance/providers/maintenance_provider.dart';
import '../transactions/providers/transaction_provider.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overview = ref.watch(adminOverviewProvider);
    final usersAsync = ref.watch(adminUsersProvider);
    final propertiesAsync = ref.watch(pendingPropertiesProvider);
    final transactions =
        ref.watch(transactionsProvider).valueOrNull ?? const [];
    final leases = ref.watch(leasesProvider).valueOrNull ?? const [];
    final maintenance =
        ref.watch(maintenanceRequestsProvider).valueOrNull ?? const [];
    final applications =
        ref.watch(allApplicationsProvider).valueOrNull ?? const [];
    final actionState = ref.watch(adminVerificationProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          IconButton(
            onPressed: () {
              ref.invalidate(adminUsersProvider);
              ref.invalidate(pendingPropertiesProvider);
              ref.invalidate(transactionsProvider);
              ref.invalidate(leasesProvider);
              ref.invalidate(maintenanceRequestsProvider);
              ref.invalidate(allApplicationsProvider);
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GridView.count(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.4,
            children: [
              _StatCard(
                label: 'Users',
                value: '${overview.totalUsers}',
                icon: Icons.group_outlined,
              ),
              _StatCard(
                label: 'Pending Agents',
                value: '${overview.pendingAgents}',
                icon: Icons.badge_outlined,
              ),
              _StatCard(
                label: 'Pending Properties',
                value: '${overview.pendingProperties}',
                icon: Icons.approval_outlined,
              ),
              _StatCard(
                label: 'Transactions',
                value: '${overview.totalTransactions}',
                icon: Icons.payments_outlined,
              ),
              _StatCard(
                label: 'Leases',
                value: '${overview.totalLeases}',
                icon: Icons.description_outlined,
              ),
              _StatCard(
                label: 'Maintenance',
                value: '${overview.totalMaintenanceRequests}',
                icon: Icons.build_outlined,
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            'Pending Property Verifications',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          propertiesAsync.when(
            data: (properties) => properties.isEmpty
                ? const _SectionEmpty(
                    message: 'No pending property verifications.',
                  )
                : Column(
                    children: properties.take(5).map((property) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _PendingPropertyCard(
                          property: property,
                          isLoading: actionState.isLoading,
                        ),
                      );
                    }).toList(),
                  ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => _SectionEmpty(
              message: error.toString().replaceFirst('Exception: ', ''),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Pending Agent Verifications',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          usersAsync.when(
            data: (users) {
              final pendingAgents = users
                  .where((user) => user.isAgent && !user.verified)
                  .take(5)
                  .toList();
              if (pendingAgents.isEmpty) {
                return const _SectionEmpty(
                  message: 'No pending agent verifications.',
                );
              }
              return Column(
                children: pendingAgents
                    .map(
                      (user) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _PendingAgentCard(
                          user: user,
                          isLoading: actionState.isLoading,
                        ),
                      ),
                    )
                    .toList(),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => _SectionEmpty(
              message: error.toString().replaceFirst('Exception: ', ''),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Activity Snapshot',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SnapshotRow(
                  label: 'Verified users',
                  value: '${overview.verifiedUsers}',
                ),
                _SnapshotRow(
                  label: 'Applications',
                  value: '${applications.length}',
                ),
                _SnapshotRow(label: 'Recent leases', value: '${leases.length}'),
                _SnapshotRow(
                  label: 'Open maintenance',
                  value:
                      '${maintenance.where((item) => !item.isCompleted).length}',
                ),
                _SnapshotRow(
                  label: 'Revenue tracked',
                  value:
                      '${transactions.fold<double>(0.0, (sum, item) => sum + item.amount).toStringAsFixed(0)} ETB',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppTheme.secondary),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }
}

class _PendingPropertyCard extends ConsumerWidget {
  const _PendingPropertyCard({required this.property, required this.isLoading});

  final PropertyModel property;
  final bool isLoading;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            property.title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 6),
          Text(
            property.locationLabel,
            style: const TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 6),
          Text(
            '${property.price.toStringAsFixed(0)} ETB',
            style: const TextStyle(color: AppTheme.secondary),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => context.push('/admin/properties/${property.id}'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: const BorderSide(color: Colors.white24),
            ),
            child: const Text('Review Details'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: isLoading
                      ? null
                      : () => _verify(context, ref, true),
                  child: const Text('Approve'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: isLoading
                      ? null
                      : () => _verify(context, ref, false),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                  ),
                  child: const Text('Reject'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _verify(
    BuildContext context,
    WidgetRef ref,
    bool approved,
  ) async {
    String? reason;
    if (!approved) {
      reason = await _askForReason(
        context,
        'Why are you rejecting this property?',
      );
      if (!context.mounted) return;
      if (reason == null) return;
    }
    try {
      await ref
          .read(adminVerificationProvider.notifier)
          .verifyProperty(
            propertyId: property.id,
            isVerified: approved,
            rejectionReason: reason,
          );
      ref.invalidate(pendingPropertiesProvider);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Property ${approved ? 'approved' : 'rejected'}'),
        ),
      );
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

class _PendingAgentCard extends ConsumerWidget {
  const _PendingAgentCard({required this.user, required this.isLoading});

  final UserModel user;
  final bool isLoading;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            user.name,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 6),
          Text(user.email, style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 6),
          Text(
            user.createdAt != null
                ? 'Joined ${user.createdAt!.day}/${user.createdAt!.month}/${user.createdAt!.year}'
                : 'Pending review',
            style: const TextStyle(color: Colors.white54),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => context.push('/admin/agents/${user.id}'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: const BorderSide(color: Colors.white24),
            ),
            child: const Text('Review Details'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: isLoading
                      ? null
                      : () => _verify(context, ref, true),
                  child: const Text('Approve'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: isLoading
                      ? null
                      : () => _verify(context, ref, false),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                  ),
                  child: const Text('Reject'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _verify(
    BuildContext context,
    WidgetRef ref,
    bool approved,
  ) async {
    String? reason;
    if (!approved) {
      reason = await _askForReason(
        context,
        'Why are you rejecting this agent?',
      );
      if (!context.mounted) return;
      if (reason == null) return;
    }
    try {
      await ref
          .read(adminVerificationProvider.notifier)
          .verifyUser(
            userId: user.id,
            verified: approved,
            rejectionReason: reason,
          );
      ref.invalidate(adminUsersProvider);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Agent ${approved ? 'approved' : 'rejected'}')),
      );
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

class _SnapshotRow extends StatelessWidget {
  const _SnapshotRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(color: Colors.white70)),
          ),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

class _SectionEmpty extends StatelessWidget {
  const _SectionEmpty({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(18),
      child: Text(message, style: const TextStyle(color: Colors.white70)),
    );
  }
}

Future<String?> _askForReason(BuildContext context, String title) async {
  final controller = TextEditingController();
  final result = await showDialog<String>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: const Color(0xFF1E293B),
      title: Text(title),
      content: TextField(
        controller: controller,
        minLines: 3,
        maxLines: 5,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: 'Optional rejection reason',
          hintStyle: const TextStyle(color: Colors.white38),
          filled: true,
          fillColor: Colors.white.withOpacity(0.06),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(dialogContext).pop(controller.text),
          child: const Text('Submit'),
        ),
      ],
    ),
  );
  controller.dispose();
  return result;
}
