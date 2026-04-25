import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../auth/providers/auth_provider.dart';
import '../chat/providers/chat_provider.dart';
import '../chat/repositories/chat_repository.dart';
import 'models/lease_model.dart';
import 'providers/lease_provider.dart';

class LeasesScreen extends ConsumerWidget {
  const LeasesScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leasesAsync = ref.watch(leasesProvider);
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Leases')),
      body: leasesAsync.when(
        data: (leases) {
          if (leases.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 80),
                _EmptyLeases(isCustomer: user?.isCustomer ?? false),
              ],
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(leasesProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
              itemCount: leases.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) => _LeaseCard(lease: leases[index]),
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
}

class _LeaseCard extends ConsumerWidget {
  const _LeaseCard({required this.lease});

  final LeaseModel lease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final actionState = ref.watch(leaseActionProvider);
    final isOwnerView = user != null && user.id == lease.ownerId;
    final isCustomerView = user != null && user.id == lease.customerId;
    final counterpart = isOwnerView ? lease.customer : lease.owner;

    return GlassCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (lease.property?.mainImage.isNotEmpty == true)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              child: CachedNetworkImage(
                imageUrl: lease.property!.mainImage,
                height: 170,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
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
                            lease.property?.title ?? 'Lease',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            lease.property?.locationLabel ?? 'Unknown location',
                            style: const TextStyle(color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    _LeaseStatusChip(status: lease.status),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '${(lease.recurringAmount ?? lease.totalPrice).toStringAsFixed(0)} ETB',
                  style: const TextStyle(
                    color: AppTheme.secondary,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${lease.leaseType} • ${_formatDate(lease.startDate)} to ${_formatDate(lease.endDate)}',
                  style: const TextStyle(color: Colors.white54, fontSize: 13),
                ),
                if (counterpart != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    isOwnerView
                        ? 'Customer: ${counterpart.name}'
                        : 'Owner: ${counterpart.name}',
                    style: const TextStyle(color: Colors.white70),
                  ),
                ],
                if (lease.isPending) ...[
                  const SizedBox(height: 12),
                  _LeaseAcceptanceStatus(lease: lease),
                ],
                if (lease.terms.trim().isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    lease.terms,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white70, height: 1.45),
                  ),
                ],
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    OutlinedButton(
                      onPressed: () => context.go('/leases/${lease.id}'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white24),
                      ),
                      child: const Text('View Details'),
                    ),
                    OutlinedButton(
                      onPressed: counterpart == null || counterpart.id.isEmpty
                          ? null
                          : () => _messageCounterpart(
                              context,
                              ref,
                              counterpart.id,
                              counterpart.name,
                            ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white24),
                      ),
                      child: const Text('Message'),
                    ),
                    if (lease.isPending &&
                        ((isOwnerView && !lease.ownerAccepted) ||
                            (isCustomerView && !lease.customerAccepted)))
                      ElevatedButton(
                        onPressed: actionState.isLoading
                            ? null
                            : () => _acceptLease(
                                context,
                                ref,
                                isOwnerView ? 'owner' : 'customer',
                              ),
                        child: const Text('Accept'),
                      ),
                    if (lease.isActive || lease.isCancellationPending)
                      ElevatedButton(
                        onPressed: actionState.isLoading
                            ? null
                            : () => _cancelLease(
                                context,
                                ref,
                                isOwnerView ? 'owner' : 'customer',
                              ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.redAccent,
                        ),
                        child: Text(
                          lease.isCancellationPending
                              ? 'Confirm Cancel'
                              : 'Cancel Lease',
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _acceptLease(
    BuildContext context,
    WidgetRef ref,
    String role,
  ) async {
    try {
      await ref
          .read(leaseActionProvider.notifier)
          .acceptLease(leaseId: lease.id, role: role);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lease updated successfully.')),
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

  Future<void> _cancelLease(
    BuildContext context,
    WidgetRef ref,
    String role,
  ) async {
    try {
      await ref
          .read(leaseActionProvider.notifier)
          .requestCancellation(leaseId: lease.id, role: role);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lease cancellation updated.')),
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

  Future<void> _messageCounterpart(
    BuildContext context,
    WidgetRef ref,
    String partnerId,
    String name,
  ) async {
    try {
      await ref
          .read(chatRepositoryProvider)
          .initiateChat(
            receiverId: partnerId,
            content:
                'Hello, I am following up on our lease for ${lease.property?.title ?? 'the listing'}.',
          );
      ref.invalidate(chatConversationsProvider);
      if (!context.mounted) return;
      context.push('/inbox/thread/$partnerId', extra: {'name': name});
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

class _LeaseAcceptanceStatus extends StatelessWidget {
  const _LeaseAcceptanceStatus({required this.lease});

  final LeaseModel lease;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Acceptance',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Owner: ${lease.ownerAccepted ? 'Accepted' : 'Pending'}',
            style: const TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 4),
          Text(
            'Customer: ${lease.customerAccepted ? 'Accepted' : 'Pending'}',
            style: const TextStyle(color: Colors.white70),
          ),
        ],
      ),
    );
  }
}

class _LeaseStatusChip extends StatelessWidget {
  const _LeaseStatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toUpperCase();
    final color = normalized == 'ACTIVE'
        ? const Color(0xFF34D399)
        : normalized == 'CANCELLATION_PENDING'
        ? const Color(0xFFFBBF24)
        : normalized == 'CANCELLED'
        ? const Color(0xFFFB7185)
        : const Color(0xFFA78BFA);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        normalized.replaceAll('_', ' '),
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _EmptyLeases extends StatelessWidget {
  const _EmptyLeases({required this.isCustomer});

  final bool isCustomer;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.description_outlined,
            color: AppTheme.secondary.withOpacity(0.95),
            size: 42,
          ),
          const SizedBox(height: 16),
          Text(
            'No leases yet',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          Text(
            isCustomer
                ? 'Accepted lease offers and active rental agreements will appear here.'
                : 'Leases for your managed listings will appear here once they are created.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, height: 1.5),
          ),
        ],
      ),
    );
  }
}

String _formatDate(DateTime date) {
  return '${date.day}/${date.month}/${date.year}';
}

