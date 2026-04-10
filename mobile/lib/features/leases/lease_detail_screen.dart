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

class LeaseDetailScreen extends ConsumerWidget {
  const LeaseDetailScreen({super.key, required this.leaseId});

  final String leaseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaseAsync = ref.watch(leaseDetailProvider(leaseId));

    return Scaffold(
      appBar: AppBar(title: const Text('Lease Details')),
      body: leaseAsync.when(
        data: (lease) => _LeaseDetailBody(lease: lease),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString().replaceFirst('Exception: ', ''),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}

class _LeaseDetailBody extends ConsumerWidget {
  const _LeaseDetailBody({required this.lease});

  final LeaseModel lease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final actionState = ref.watch(leaseActionProvider);
    final isOwnerView = user != null && user.id == lease.ownerId;
    final isCustomerView = user != null && user.id == lease.customerId;
    final counterpart = isOwnerView ? lease.customer : lease.owner;
    final amountLabel = lease.recurringAmount ?? lease.totalPrice;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      children: [
        GlassCard(
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
                    height: 240,
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
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                lease.property?.locationLabel ??
                                    'Unknown location',
                                style: const TextStyle(color: Colors.white70),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        _LeaseStatusChip(status: lease.status),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '${amountLabel.toStringAsFixed(0)} ETB',
                      style: const TextStyle(
                        color: AppTheme.secondary,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      lease.recurringAmount != null
                          ? 'Recurring amount'
                          : 'Total lease price',
                      style: const TextStyle(color: Colors.white54),
                    ),
                    const SizedBox(height: 18),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _MetaPill(label: lease.leaseType),
                        _MetaPill(
                          label:
                              '${_formatDate(lease.startDate)} to ${_formatDate(lease.endDate)}',
                        ),
                        if (lease.createdAt != null)
                          _MetaPill(
                            label: 'Created ${_formatDate(lease.createdAt!)}',
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Participants',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 14),
              _ParticipantRow(
                label: 'Owner',
                name: lease.owner?.name ?? 'Unknown owner',
                accepted: lease.ownerAccepted,
                cancelled: lease.ownerCancelled,
              ),
              const SizedBox(height: 12),
              _ParticipantRow(
                label: 'Customer',
                name: lease.customer?.name ?? 'Unknown customer',
                accepted: lease.customerAccepted,
                cancelled: lease.customerCancelled,
              ),
              if (counterpart != null) ...[
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: counterpart.id.isEmpty
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
                  child: Text(
                    isOwnerView ? 'Message Customer' : 'Message Owner',
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        GlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Terms', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 10),
              Text(
                lease.terms.trim().isEmpty
                    ? 'No lease terms provided.'
                    : lease.terms,
                style: const TextStyle(color: Colors.white70, height: 1.5),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Actions', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              const Text(
                'Complete acceptance, manage cancellation, or make rent payments from here.',
                style: TextStyle(color: Colors.white70, height: 1.45),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.push(
                    '/leases/${lease.id}/contract',
                    extra: lease,
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white24),
                  ),
                  child: const Text('View Agreement'),
                ),
              ),
              const SizedBox(height: 12),
              if (lease.isPending &&
                  ((isOwnerView && !lease.ownerAccepted) ||
                      (isCustomerView && !lease.customerAccepted)))
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: actionState.isLoading
                        ? null
                        : () => _acceptLease(
                            context,
                            ref,
                            isOwnerView ? 'owner' : 'customer',
                          ),
                    child: const Text('Accept Lease'),
                  ),
                ),
              if ((lease.isActive || lease.isCancellationPending) &&
                  (isOwnerView || isCustomerView)) ...[
                if (lease.isPending &&
                    ((isOwnerView && !lease.ownerAccepted) ||
                        (isCustomerView && !lease.customerAccepted)))
                  const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
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
                          ? 'Confirm Cancellation'
                          : 'Request Cancellation',
                    ),
                  ),
                ),
              ],
              if (isCustomerView &&
                  lease.isActive &&
                  lease.owner?.chapaSubaccountId != null &&
                  lease.owner!.chapaSubaccountId!.isNotEmpty) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.push(
                      '/checkout',
                      extra: {
                        'amount': lease.recurringAmount ?? lease.totalPrice,
                        'title': lease.property?.title ?? 'Lease payment',
                        'category': 'Lease Payment',
                        'leaseId': lease.id,
                        'propertyId': lease.propertyId,
                        'payeeId': lease.ownerId,
                        'subaccountId': lease.owner!.chapaSubaccountId,
                        'meta': {
                          'leaseId': lease.id,
                          'month':
                              '${DateTime.now().month.toString().padLeft(2, '0')}-${DateTime.now().year}',
                        },
                      },
                    ),
                    child: const Text('Pay Rent'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
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
      ref.invalidate(leaseDetailProvider(lease.id));
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lease updated successfully.')),
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

  Future<void> _cancelLease(
    BuildContext context,
    WidgetRef ref,
    String role,
  ) async {
    try {
      await ref
          .read(leaseActionProvider.notifier)
          .requestCancellation(leaseId: lease.id, role: role);
      ref.invalidate(leaseDetailProvider(lease.id));
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lease cancellation updated.')),
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
      if (!context.mounted) {
        return;
      }
      context.push('/inbox/thread/$partnerId', extra: {'name': name});
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

class _ParticipantRow extends StatelessWidget {
  const _ParticipantRow({
    required this.label,
    required this.name,
    required this.accepted,
    required this.cancelled,
  });

  final String label;
  final String name;
  final bool accepted;
  final bool cancelled;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white54)),
          const SizedBox(height: 6),
          Text(
            name,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 6),
          Text(
            'Acceptance: ${accepted ? 'Accepted' : 'Pending'}',
            style: const TextStyle(color: Colors.white70),
          ),
          if (cancelled) ...[
            const SizedBox(height: 4),
            const Text(
              'Cancellation requested',
              style: TextStyle(color: Colors.redAccent),
            ),
          ],
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

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white10),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 12, color: Colors.white70),
      ),
    );
  }
}

String _formatDate(DateTime date) {
  return '${date.day}/${date.month}/${date.year}';
}
