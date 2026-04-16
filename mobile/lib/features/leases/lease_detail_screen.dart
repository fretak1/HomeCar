import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../auth/providers/auth_provider.dart';
import '../chat/providers/chat_provider.dart';
import '../chat/repositories/chat_repository.dart';
import '../dashboard/widgets/dashboard_utils.dart';
import '../transactions/models/transaction_model.dart';
import '../transactions/providers/transaction_provider.dart';
import 'models/lease_model.dart';
import 'providers/lease_provider.dart';

class LeaseDetailScreen extends ConsumerWidget {
  const LeaseDetailScreen({super.key, required this.leaseId});

  final String leaseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaseAsync = ref.watch(leaseDetailProvider(leaseId));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: leaseAsync.when(
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
    final transactions = ref.watch(transactionsProvider).valueOrNull ?? const [];
    final actionState = ref.watch(leaseActionProvider);
    final isCustomerView = user?.id == lease.customerId;
    final canAccept = lease.isPending && isCustomerView && !lease.customerAccepted;
    final canCancel =
        isCustomerView && (lease.isActive || lease.isCancellationPending);
    final amount = lease.recurringAmount ?? lease.totalPrice;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1280),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _LeaseHeader(
                lease: lease,
                canAccept: canAccept,
                canCancel: canCancel,
                isSubmitting: actionState.isLoading,
                onAccept: canAccept
                    ? () => _acceptLease(context, ref, 'customer')
                    : null,
                onCancel: canCancel
                    ? () => _cancelLease(context, ref, 'customer')
                    : null,
              ),
              const SizedBox(height: 24),
              LayoutBuilder(
                builder: (context, constraints) {
                  final sidebar = _ContactCard(
                    lease: lease,
                    onMessage: () => _messageCounterpart(
                      context,
                      ref,
                      lease.owner?.id ?? '',
                      lease.owner?.name ?? 'Owner',
                    ),
                  );

                  final content = Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _HeroCard(lease: lease, amount: amount),
                      const SizedBox(height: 20),
                      _LifecycleCard(lease: lease),
                      const SizedBox(height: 20),
                      _TermsCard(terms: lease.terms),
                      const SizedBox(height: 20),
                      _PaymentHistoryCard(
                        lease: lease,
                        transactions: transactions
                            .where((transaction) => transaction.leaseId == lease.id)
                            .toList(),
                        onPayRent: (periodStart) =>
                            _payRent(context, lease, periodStart),
                      ),
                    ],
                  );

                  if (constraints.maxWidth < 1040) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        content,
                        const SizedBox(height: 20),
                        sidebar,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 2, child: content),
                      const SizedBox(width: 24),
                      SizedBox(width: 340, child: sidebar),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
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
      ref.invalidate(leaseDetailProvider(lease.id));
      ref.invalidate(leasesProvider);
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
      ref.invalidate(leaseDetailProvider(lease.id));
      ref.invalidate(leasesProvider);
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
    if (partnerId.isEmpty) return;
    try {
      await ref.read(chatRepositoryProvider).initiateChat(
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

  void _payRent(BuildContext context, LeaseModel lease, DateTime periodStart) {
    final subaccountId = lease.owner?.chapaSubaccountId;
    if (subaccountId == null || subaccountId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment setup incomplete. Please contact the owner.'),
        ),
      );
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
          'month': _monthYearLabel(periodStart),
        },
      },
    );
  }
}

class _LeaseHeader extends StatelessWidget {
  const _LeaseHeader({
    required this.lease,
    required this.canAccept,
    required this.canCancel,
    required this.isSubmitting,
    this.onAccept,
    this.onCancel,
  });

  final LeaseModel lease;
  final bool canAccept;
  final bool canCancel;
  final bool isSubmitting;
  final VoidCallback? onAccept;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      padding: const EdgeInsets.all(18),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final actions = Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _StatusBadge(status: lease.status),
              if (canAccept)
                FilledButton(
                  onPressed: isSubmitting ? null : onAccept,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Accept Lease'),
                ),
              if (canCancel)
                OutlinedButton(
                  onPressed: isSubmitting ? null : onCancel,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: lease.isCancellationPending
                        ? const Color(0xFFEA580C)
                        : const Color(0xFFDC2626),
                  ),
                  child: Text(
                    lease.isCancellationPending
                        ? 'Confirm Cancellation'
                        : 'Cancel Lease',
                  ),
                ),
            ],
          );

          if (constraints.maxWidth < 760) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back_ios_new_rounded),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Lease Details',
                            style: TextStyle(
                              color: AppTheme.foreground,
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            'ID: ${lease.id}',
                            style: const TextStyle(color: AppTheme.mutedForeground),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                actions,
              ],
            );
          }

          return Row(
            children: [
              IconButton(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Lease Details',
                      style: TextStyle(
                        color: AppTheme.foreground,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'ID: ${lease.id}',
                      style: const TextStyle(color: AppTheme.mutedForeground),
                    ),
                  ],
                ),
              ),
              actions,
            ],
          );
        },
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.lease, required this.amount});

  final LeaseModel lease;
  final double amount;

  @override
  Widget build(BuildContext context) {
    final imageUrl = lease.property?.mainImage ?? '';
    return _SurfaceCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: imageUrl.isEmpty
                    ? Container(height: 280, color: const Color(0xFFE2E8F0))
                    : CachedNetworkImage(
                        imageUrl: imageUrl,
                        height: 280,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
              ),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(24),
                    ),
                    gradient: const LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Color(0xCC000000), Color(0x33000000)],
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 24,
                right: 24,
                bottom: 24,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            lease.property?.title ?? 'Lease',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 30,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            lease.property?.locationLabel ?? 'Unknown location',
                            style: const TextStyle(
                              color: Color(0xE6FFFFFF),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0x33FFFFFF),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0x40FFFFFF)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Monthly Billing',
                            style: TextStyle(
                              color: Color(0xB3FFFFFF),
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.6,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            formatDashboardMoney(amount),
                            style: const TextStyle(
                              color: Colors.white,
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
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Wrap(
              spacing: 32,
              runSpacing: 18,
              children: [
                _MetaItem(label: 'Property Type', value: lease.leaseType),
                _MetaItem(label: 'Owner', value: lease.owner?.name ?? 'Unknown'),
                _MetaItem(
                  label: 'Agreement Status',
                  value: prettyDashboardLabel(lease.status),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LifecycleCard extends StatelessWidget {
  const _LifecycleCard({required this.lease});

  final LeaseModel lease;

  @override
  Widget build(BuildContext context) {
    final totalDays = lease.endDate.difference(lease.startDate).inDays.abs();
    final elapsedDays = (DateTime.now()
            .difference(lease.startDate)
            .inDays
            .clamp(0, totalDays) as num)
        .toInt();
    final progress = totalDays == 0 ? 0.0 : (elapsedDays / totalDays) * 100;
    final remainingMonths = ((totalDays - elapsedDays) / 30).floor().clamp(
      0,
      9999,
    );

    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.schedule_rounded, color: AppTheme.primary),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Lease Lifecycle',
                  style: TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              _OutlineBadge(
                label:
                    'TERM: ${(totalDays / 30).floor()} MONTHS (${totalDays} DAYS)',
              ),
            ],
          ),
          const SizedBox(height: 22),
          Row(
            children: [
              Expanded(
                child: Text(
                  '${progress.round()}% elapsed ($elapsedDays days)',
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Text(
                '$remainingMonths months left',
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: ((progress / 100).clamp(0.0, 1.0) as num).toDouble(),
            minHeight: 14,
            backgroundColor: const Color(0xFFE5E7EB),
            color: AppTheme.primary,
            borderRadius: BorderRadius.circular(999),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                'Start: ${formatDashboardDate(lease.startDate)}',
                style: const TextStyle(color: AppTheme.mutedForeground),
              ),
              const Spacer(),
              Text(
                'Today: ${formatDashboardDate(DateTime.now())}',
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              Text(
                'End: ${formatDashboardDate(lease.endDate)}',
                style: const TextStyle(color: AppTheme.mutedForeground),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TermsCard extends StatelessWidget {
  const _TermsCard({required this.terms});

  final String terms;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.description_outlined, color: AppTheme.primary),
              SizedBox(width: 10),
              Text(
                'Agreement Terms',
                style: TextStyle(
                  color: AppTheme.foreground,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.border),
            ),
            child: Text(
              terms.trim().isEmpty ? 'No lease terms provided.' : terms,
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentHistoryCard extends StatelessWidget {
  const _PaymentHistoryCard({
    required this.lease,
    required this.transactions,
    required this.onPayRent,
  });

  final LeaseModel lease;
  final List<TransactionModel> transactions;
  final ValueChanged<DateTime> onPayRent;

  @override
  Widget build(BuildContext context) {
    final periods = _buildLeaseBillingPeriods(lease, transactions);
    return _SurfaceCard(
      padding: const EdgeInsets.all(0),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                const Icon(Icons.payments_outlined, color: AppTheme.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    lease.recurringAmount != null
                        ? 'Revenue Collection Record'
                        : 'Lease Payment Settlement',
                    style: const TextStyle(
                      color: AppTheme.foreground,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),
          LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth < 860) {
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: periods
                        .map(
                          (period) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _LeaseHistoryMobileCard(
                              lease: lease,
                              period: period,
                              onPayRent: onPayRent,
                            ),
                          ),
                        )
                        .toList(),
                  ),
                );
              }

              return Column(
                children: [
                  Container(
                    color: const Color(0xFFF8FAFC),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 14,
                    ),
                    child: const Row(
                      children: [
                        Expanded(flex: 3, child: _HistoryHeading('Billing Period')),
                        Expanded(child: _HistoryHeading('Settlement Date')),
                        Expanded(child: _HistoryHeading('Gross Amount')),
                        Expanded(child: _HistoryHeading('Status')),
                        Expanded(child: _HistoryHeading('Receipt')),
                      ],
                    ),
                  ),
                  ...periods.map(
                    (period) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 16,
                      ),
                      decoration: const BoxDecoration(
                        border: Border(top: BorderSide(color: AppTheme.border)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${_monthDayLabel(period.start)} - ${_monthDayYearLabel(period.end)}',
                                  style: const TextStyle(
                                    color: AppTheme.foreground,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  lease.recurringAmount != null
                                      ? 'Fixed 30-Day Billing Cycle'
                                      : 'Full Lease Term',
                                  style: const TextStyle(
                                    color: AppTheme.mutedForeground,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Text(
                              period.isPaid && period.transaction != null
                                  ? formatDashboardDate(
                                      period.transaction!.createdAt,
                                    )
                                  : '-',
                              style: const TextStyle(
                                color: AppTheme.mutedForeground,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              formatDashboardMoney(
                                lease.recurringAmount ?? lease.totalPrice,
                              ),
                              style: const TextStyle(
                                color: AppTheme.foreground,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          Expanded(child: _LeasePeriodStatus(period: period)),
                          Expanded(
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: _LeasePeriodAction(
                                lease: lease,
                                period: period,
                                onPayRent: onPayRent,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.lease, required this.onMessage});

  final LeaseModel lease;
  final VoidCallback onMessage;

  @override
  Widget build(BuildContext context) {
    final ownerName = lease.owner?.name ?? 'Unknown Owner';
    final initials = ownerName
        .split(' ')
        .where((part) => part.trim().isNotEmpty)
        .map((part) => part[0])
        .take(2)
        .join();
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Property Manager',
            style: TextStyle(
              color: AppTheme.foreground,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Center(
                  child: Text(
                    initials.isEmpty ? 'U' : initials,
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ownerName,
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Certified Property Owner',
                      style: TextStyle(color: AppTheme.mutedForeground),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: onMessage,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
              ),
              icon: const Icon(Icons.chat_bubble_outline, size: 18),
              label: const Text('Message Manager'),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: lease.owner?.id == null || lease.owner!.id.isEmpty
                  ? null
                  : () => context.push('/profile/view/${lease.owner!.id}'),
              child: const Text('View Manager Profile'),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => context.push('/leases/${lease.id}/contract', extra: lease),
              child: const Text('View Agreement'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SurfaceCard extends StatelessWidget {
  const _SurfaceCard({required this.child, this.padding = const EdgeInsets.all(24)});

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 20,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _MetaItem extends StatelessWidget {
  const _MetaItem({required this.label, required this.value});

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
            fontWeight: FontWeight.w800,
            letterSpacing: 0.6,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: AppTheme.foreground,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = dashboardStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        prettyDashboardLabel(status).toUpperCase(),
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w800,
          fontSize: 11,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class _OutlineBadge extends StatelessWidget {
  const _OutlineBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppTheme.border),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppTheme.mutedForeground,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class _HistoryHeading extends StatelessWidget {
  const _HistoryHeading(this.label);

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

class _LeaseHistoryMobileCard extends StatelessWidget {
  const _LeaseHistoryMobileCard({
    required this.lease,
    required this.period,
    required this.onPayRent,
  });

  final LeaseModel lease;
  final _LeaseBillingPeriod period;
  final ValueChanged<DateTime> onPayRent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: period.isCurrent ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${_monthDayLabel(period.start)} - ${_monthDayYearLabel(period.end)}',
            style: const TextStyle(
              color: AppTheme.foreground,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            period.isPaid && period.transaction != null
                ? 'Settled ${formatDashboardDate(period.transaction!.createdAt)}'
                : lease.recurringAmount != null
                ? 'Fixed 30-Day Billing Cycle'
                : 'Full Lease Term',
            style: const TextStyle(color: AppTheme.mutedForeground),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 18,
            runSpacing: 12,
            children: [
              _MetaItem(
                label: 'Amount',
                value: formatDashboardMoney(
                  lease.recurringAmount ?? lease.totalPrice,
                ),
              ),
              _MetaItem(label: 'Status', value: period.statusLabel),
            ],
          ),
          const SizedBox(height: 16),
          _LeasePeriodAction(lease: lease, period: period, onPayRent: onPayRent),
        ],
      ),
    );
  }
}

class _LeasePeriodStatus extends StatelessWidget {
  const _LeasePeriodStatus({required this.period});

  final _LeaseBillingPeriod period;

  @override
  Widget build(BuildContext context) {
    final color = period.isPaid
        ? const Color(0xFF16A34A)
        : period.isPending
        ? const Color(0xFFD97706)
        : period.isCurrent
        ? AppTheme.primary
        : period.isPast
        ? const Color(0xFFDC2626)
        : AppTheme.mutedForeground;
    final background = period.isPaid
        ? const Color(0xFFF0FDF4)
        : period.isPending
        ? const Color(0xFFFFFBEB)
        : period.isCurrent
        ? AppTheme.primary.withValues(alpha: 0.10)
        : period.isPast
        ? const Color(0xFFFEF2F2)
        : const Color(0xFFF8FAFC);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        period.statusLabel,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w800,
          fontSize: 10,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class _LeasePeriodAction extends StatelessWidget {
  const _LeasePeriodAction({
    required this.lease,
    required this.period,
    required this.onPayRent,
  });

  final LeaseModel lease;
  final _LeaseBillingPeriod period;
  final ValueChanged<DateTime> onPayRent;

  @override
  Widget build(BuildContext context) {
    if (period.isPaid && period.transaction != null) {
      return OutlinedButton(
        onPressed: () => context.push(
          '/transactions/receipt/${period.transaction!.id}',
          extra: period.transaction,
        ),
        child: const Text('View'),
      );
    }

    if ((period.isCurrent || period.isPast) && !period.isPending && lease.isActive) {
      return FilledButton(
        onPressed: () => onPayRent(period.start),
        style: FilledButton.styleFrom(
          backgroundColor: AppTheme.primary,
          foregroundColor: Colors.white,
        ),
        child: const Text('Pay Now'),
      );
    }

    return Text(
      '-',
      style: const TextStyle(
        color: AppTheme.mutedForeground,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _LeaseBillingPeriod {
  const _LeaseBillingPeriod({
    required this.start,
    required this.end,
    required this.isPast,
    required this.isCurrent,
    required this.isPaid,
    required this.isPending,
    required this.transaction,
  });

  final DateTime start;
  final DateTime end;
  final bool isPast;
  final bool isCurrent;
  final bool isPaid;
  final bool isPending;
  final TransactionModel? transaction;

  String get statusLabel {
    if (isPaid) return 'COLLECTED';
    if (isPending) return 'PENDING';
    if (isCurrent) return 'SETTLING';
    if (isPast) return 'OVERDUE';
    return 'UPCOMING';
  }
}

List<_LeaseBillingPeriod> _buildLeaseBillingPeriods(
  LeaseModel lease,
  List<TransactionModel> transactions,
) {
  final start = lease.startDate;
  final end = lease.endDate;
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
    final now = DateTime.now();
    final monthLabel = _monthYearLabel(periodStart);
    final legacyMonthLabel =
        '${periodStart.month.toString().padLeft(2, '0')}-${periodStart.year}';
    final transaction = transactions.cast<TransactionModel?>().firstWhere(
      (item) =>
          item != null &&
          (item.metadata?['month']?.toString() == monthLabel ||
              item.metadata?['month']?.toString() == legacyMonthLabel),
      orElse: () => null,
    );

    return _LeaseBillingPeriod(
      start: periodStart,
      end: periodEnd,
      isPast: periodEnd.isBefore(now),
      isCurrent: !now.isBefore(periodStart) && !now.isAfter(periodEnd),
      isPaid: transaction?.status.toUpperCase() == 'COMPLETED',
      isPending: transaction?.status.toUpperCase() == 'PENDING',
      transaction: transaction,
    );
  });
}

String _monthYearLabel(DateTime value) {
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
  return '${months[value.month - 1]}-${value.year}';
}

String _monthDayLabel(DateTime value) {
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
  return '${months[value.month - 1]} ${value.day.toString().padLeft(2, '0')}';
}

String _monthDayYearLabel(DateTime value) {
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
  return '${months[value.month - 1]} ${value.day.toString().padLeft(2, '0')}, ${value.year}';
}
