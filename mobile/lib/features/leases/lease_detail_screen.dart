import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

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
    debugPrint('[LeaseDetailScreen] Navigated to ID: $leaseId');
    final leaseAsync = ref.watch(leaseDetailProvider(leaseId));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Lease Management',
          style: TextStyle(
            color: Color(0xFF1F2937),
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.primary, size: 20),
          onPressed: () => context.pop(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFE5E7EB), height: 1),
        ),
      ),
      body: leaseAsync.when(
        data: (lease) => _LeaseDetailBody(lease: lease),
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.primary),
        ),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString().replaceFirst('Exception: ', ''),
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF1F2937)),
            ),
          ),
        ),
      ),
    );
  }
}

class _LeaseDetailBody extends ConsumerStatefulWidget {
  const _LeaseDetailBody({required this.lease});
  final LeaseModel lease;

  @override
  ConsumerState<_LeaseDetailBody> createState() => _LeaseDetailBodyState();
}

class _LeaseDetailBodyState extends ConsumerState<_LeaseDetailBody> {
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    final lease = widget.lease;
    final transactions = ref.watch(transactionsProvider).valueOrNull ?? const [];
    final currentUser = ref.watch(authProvider).user;
    
    // Determine the counter-party (Tenant if owner, Owner if tenant)
    final isOwner = currentUser?.id == lease.ownerId;
    final partnerName = isOwner 
        ? (lease as dynamic).customer?.name ?? 'Tenant' 
        : lease.owner?.name ?? 'Owner';
    final partnerId = isOwner ? lease.customerId : lease.ownerId;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1200),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _StatusHeader(lease: lease, onCancel: () => _handleCancel(context)),
              const SizedBox(height: 24),
              LayoutBuilder(
                builder: (context, constraints) {
                  final sidebar = _PartnerCard(
                    name: partnerName,
                    role: isOwner ? 'Tenant' : 'Owner',
                    onMessage: () => _handleMessage(context, partnerId, partnerName),
                    onProfile: () => context.push('/profile/$partnerId'),
                  );

                  final content = Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _PropertyHero(lease: lease),
                      const SizedBox(height: 24),
                      _LifecycleCard(lease: lease),
                      const SizedBox(height: 24),
                      _PaymentHistoryCard(
                        lease: lease,
                        transactions: transactions
                            .where((tx) => tx.leaseId == lease.id)
                            .toList(),
                      ),
                      const SizedBox(height: 24),
                      if (lease.terms.isNotEmpty) ...[
                        _TermsCard(terms: lease.terms),
                        const SizedBox(height: 24),
                      ],
                    ],
                  );

                  if (constraints.maxWidth < 1024) {
                    return Column(
                      children: [
                        content,
                        const SizedBox(height: 24),
                        sidebar,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 2, child: content),
                      const SizedBox(width: 24),
                      SizedBox(width: 360, child: sidebar),
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

  Future<void> _handleCancel(BuildContext context) async {
    setState(() => _isSubmitting = true);
    try {
      final role = ref.read(authProvider).user?.id == widget.lease.ownerId ? 'owner' : 'customer';
      await ref.read(leaseActionProvider.notifier).requestCancellation(
        leaseId: widget.lease.id,
        role: role,
      );
      ref.invalidate(leaseDetailProvider(widget.lease.id));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cancellation request submitted.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _handleMessage(BuildContext context, String partnerId, String name) async {
    try {
      await ref.read(chatRepositoryProvider).initiateChat(receiverId: partnerId);
      if (!mounted) return;
      context.push('/inbox/thread/$partnerId', extra: {'name': name});
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not start chat.')),
      );
    }
  }
}

class _StatusHeader extends StatelessWidget {
  const _StatusHeader({required this.lease, required this.onCancel});
  final LeaseModel lease;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final statusColor = dashboardStatusColor(lease.status);
    final statusLabel = lease.status == 'ACTIVE' ? 'Active Agreement' : 
                        lease.status == 'PENDING' ? 'Agreement Pending' : 
                        lease.status == 'CANCELLATION_PENDING' ? 'Cancellation Pending...' :
                        lease.status;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Agreement Status',
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 10, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                statusLabel.toUpperCase(),
                style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
              ),
            ),
          ],
        ),
        if (lease.status == 'ACTIVE' || (lease.status == 'CANCELLATION_PENDING' && !lease.ownerCancelled))
          OutlinedButton(
            onPressed: onCancel,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red[600],
              side: BorderSide(color: Colors.red[200]!),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              textStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
            ),
            child: Text(lease.status == 'CANCELLATION_PENDING' ? 'CONFIRM CANCELLATION' : 'CANCEL LEASE'),
          ),
      ],
    );
  }
}

class _PropertyHero extends StatelessWidget {
  const _PropertyHero({required this.lease});
  final LeaseModel lease;

  @override
  Widget build(BuildContext context) {
    final amount = lease.recurringAmount ?? lease.totalPrice;
    final property = lease.property;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10))],
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            children: [
              CachedNetworkImage(
                imageUrl: property?.mainImage ?? '',
                height: 320,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(color: const Color(0xFFF3F4F6)),
                errorWidget: (context, url, error) => Container(color: const Color(0xFFF3F4F6), child: const Icon(Icons.image_not_supported)),
              ),
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: 24,
                left: 24,
                right: 24,
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final compact = constraints.maxWidth < 620;
                    final summaryCard = Container(
                      constraints: BoxConstraints(
                        maxWidth: compact ? 128 : 152,
                      ),
                      padding: EdgeInsets.symmetric(
                        horizontal: compact ? 12 : 14,
                        vertical: compact ? 10 : 12,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.2)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            lease.recurringAmount != null
                                ? 'MONTHLY INCOME'
                                : 'TOTAL PRICE',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.6),
                              fontSize: compact ? 7 : 8,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            formatDashboardMoney(amount),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: compact ? 15 : 17,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    );

                    final details = Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          property?.title ?? 'Lease Property',
                          maxLines: compact ? 2 : 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: compact ? 20 : 22,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(
                              Icons.location_on,
                              color: AppTheme.primary,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                property?.locationLabel ?? 'Location Not Set',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.8),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    );

                    if (compact) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          details,
                          const SizedBox(height: 12),
                          summaryCard,
                        ],
                      );
                    }

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(child: details),
                        const SizedBox(width: 16),
                        summaryCard,
                      ],
                    );
                  },
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(32),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 720;
                return Wrap(
                  spacing: compact ? 20 : 28,
                  runSpacing: 18,
                  children: [
                    SizedBox(
                      width: compact ? constraints.maxWidth : null,
                      child: _HeroMetaItem(
                        label: 'PROPERTY TYPE',
                        value: property?.assetType == 'HOME'
                            ? 'Home'
                            : 'Vehicle',
                        icon: property?.assetType == 'HOME'
                            ? Icons.home
                            : Icons.directions_car,
                      ),
                    ),
                    SizedBox(
                      width: compact ? constraints.maxWidth : null,
                      child: _HeroMetaItem(
                        label: 'CURRENT TENANT',
                        value: (lease as dynamic).customer?.name ??
                            'Verified User',
                      ),
                    ),
                    SizedBox(
                      width: compact ? constraints.maxWidth : null,
                      child: const _HeroMetaItem(
                        label: 'LEASE STATUS',
                        value: 'Active',
                        isBadge: true,
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroMetaItem extends StatelessWidget {
  const _HeroMetaItem({required this.label, required this.value, this.icon, this.isBadge = false});
  final String label;
  final String value;
  final IconData? icon;
  final bool isBadge;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
        const SizedBox(height: 6),
        if (isBadge)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: Colors.green[100], borderRadius: BorderRadius.circular(4)),
            child: const Text('ACTIVE', style: TextStyle(color: Colors.green, fontSize: 9, fontWeight: FontWeight.w900)),
          )
        else
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 14, color: AppTheme.primary), const SizedBox(width: 6)],
              Flexible(
                child: Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Color(0xFF1F2937), fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
      ],
    );
  }
}

class _LifecycleCard extends StatelessWidget {
  const _LifecycleCard({required this.lease});
  final LeaseModel lease;

  @override
  Widget build(BuildContext context) {
    final start = lease.startDate;
    final end = lease.endDate;
    final totalDays = end.difference(start).inDays.abs();
    final elapsedDays = DateTime.now().difference(start).inDays.clamp(0, totalDays);
    final progress = totalDays == 0 ? 1.0 : elapsedDays / totalDays;
    final remainingMonths = ((totalDays - elapsedDays) / 30).floor().clamp(0, 999);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 620;
                final termBadge = Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'TERM: ${(totalDays / 30).floor()} MONTHS ($totalDays DAYS)',
                    style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                );

                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.timer_outlined, color: AppTheme.primary, size: 20),
                          SizedBox(width: 12),
                          Text(
                            'Lease Lifecycle',
                            style: TextStyle(
                              color: Color(0xFF1F2937),
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      termBadge,
                    ],
                  );
                }

                return Row(
                  children: [
                    const Icon(Icons.timer_outlined, color: AppTheme.primary, size: 20),
                    const SizedBox(width: 12),
                    const Text(
                      'Lease Lifecycle',
                      style: TextStyle(
                        color: Color(0xFF1F2937),
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    termBadge,
                  ],
                );
              },
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(32),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 620;
                return Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('TERM PROGRESS', style: TextStyle(color: Color(0xFF6B7280), fontSize: 10, fontWeight: FontWeight.bold)),
                            Text(
                              '${(progress * 100).toInt()}%',
                              style: const TextStyle(color: Color(0xFF1F2937), fontSize: 20, fontWeight: FontWeight.w900),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('REMAINING', style: TextStyle(color: Color(0xFF6B7280), fontSize: 10, fontWeight: FontWeight.bold)),
                            Text(
                              '$remainingMonths Months',
                              style: const TextStyle(color: AppTheme.primary, fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 12,
                        backgroundColor: const Color(0xFFF3F4F6),
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (compact)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Start: ${DateFormat('MMM dd, yyyy').format(start)}',
                            style: const TextStyle(
                              color: Color(0xFF6B7280),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            DateFormat('MMM dd, yyyy').format(DateTime.now()),
                            style: const TextStyle(
                              color: AppTheme.primary,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'End: ${DateFormat('MMM dd, yyyy').format(end)}',
                            style: const TextStyle(
                              color: Color(0xFF6B7280),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      )
                    else
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Start: ${DateFormat('MMM dd, yyyy').format(start)}', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 10, fontWeight: FontWeight.bold)),
                          Text(DateFormat('MMM dd, yyyy').format(DateTime.now()), style: const TextStyle(color: AppTheme.primary, fontSize: 10, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                          Text('End: ${DateFormat('MMM dd, yyyy').format(end)}', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentHistoryCard extends StatelessWidget {
  const _PaymentHistoryCard({required this.lease, required this.transactions});
  final LeaseModel lease;
  final List<TransactionModel> transactions;

  @override
  Widget build(BuildContext context) {
    final start = lease.startDate;
    final end = lease.endDate;
    final totalDays = end.difference(start).inDays.abs();
    final totalMonths = lease.recurringAmount != null ? (totalDays / 30).floor().clamp(1, 999) : 1;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                const Icon(Icons.payments_outlined, color: AppTheme.primary, size: 20),
                const SizedBox(width: 12),
                Text(
                  lease.recurringAmount != null ? 'Revenue Collection Record' : 'Lease Payment Settlement',
                  style: const TextStyle(color: Color(0xFF1F2937), fontSize: 16, fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Theme(
              data: Theme.of(context).copyWith(
                textButtonTheme: TextButtonThemeData(
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF111827),
                  ),
                ),
              ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(minWidth: 680),
                  child: DataTable(
                  headingRowColor: MaterialStateProperty.all(const Color(0xFFF9FAFB)),
                  dataTextStyle: const TextStyle(
                    color: Color(0xFF111827),
                    fontWeight: FontWeight.w600,
                  ),
                  columns: const [
                  DataColumn(label: Text('BILLING PERIOD', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1))),
                  DataColumn(label: Text('SETTLEMENT DATE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1))),
                  DataColumn(label: Text('GROSS AMOUNT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1))),
                  DataColumn(label: Text('COLLECTION STATUS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1))),
                ],
                rows: List.generate(totalMonths, (index) {
                  final periodStart = lease.recurringAmount != null ? start.add(Duration(days: index * 30)) : start;
                  final periodEnd = lease.recurringAmount != null ? periodStart.add(const Duration(days: 30)) : end;
                  final monthKey = DateFormat('MMM-yyyy').format(periodStart);
                  
                  final tx = transactions.firstWhere(
                    (t) => t.status == 'COMPLETED' && (t.metadata?['month']?.toString() == monthKey),
                    orElse: () => TransactionModel(id: '', amount: 0, status: '', type: '', createdAt: DateTime.now()),
                  );
                  
                  final isPaid = tx.id.isNotEmpty;
                  final isOverdue = !isPaid && periodEnd.isBefore(DateTime.now());
                  final isCurrent = !isPaid && DateTime.now().isAfter(periodStart) && DateTime.now().isBefore(periodEnd);

                  return DataRow(
                    cells: [
                      DataCell(Text(
                        '${DateFormat('MMM dd').format(periodStart)} - ${DateFormat('MMM dd, yyyy').format(periodEnd.isAfter(end) ? end : periodEnd)}',
                        style: const TextStyle(
                          color: Color(0xFF111827),
                          fontWeight: FontWeight.bold,
                        ),
                      )),
                      DataCell(Text(
                        isPaid ? DateFormat('MMM dd, yyyy').format(tx.createdAt) : '-',
                        style: const TextStyle(
                          color: Color(0xFF111827),
                          fontWeight: FontWeight.w600,
                        ),
                      )),
                      DataCell(Text(
                        formatDashboardMoney(
                          lease.recurringAmount ?? lease.totalPrice,
                        ),
                        style: const TextStyle(
                          color: Color(0xFF111827),
                          fontWeight: FontWeight.w900,
                        ),
                      )),
                      DataCell(_StatusBadge(isPaid: isPaid, isOverdue: isOverdue, isCurrent: isCurrent)),
                    ],
                  );
                }),
              ),
            ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.isPaid, required this.isOverdue, required this.isCurrent});
  final bool isPaid;
  final bool isOverdue;
  final bool isCurrent;

  @override
  Widget build(BuildContext context) {
    if (isPaid) return _Badge(label: 'RECEIVED', color: Colors.green);
    if (isOverdue) return _Badge(label: 'OVERDUE', color: Colors.red);
    if (isCurrent) return _Badge(label: 'UPCOMING', color: AppTheme.primary, pulse: true);
    return const _Badge(label: 'PENDING', color: Colors.grey, outline: true);
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color, this.pulse = false, this.outline = false});
  final String label;
  final Color color;
  final bool pulse;
  final bool outline;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: outline ? Colors.transparent : color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: outline ? Border.all(color: color.withOpacity(0.3)) : null,
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5),
      ),
    );
  }
}

class _PartnerCard extends StatelessWidget {
  const _PartnerCard({required this.name, required this.role, required this.onMessage, required this.onProfile});
  final String name;
  final String role;
  final VoidCallback onMessage;
  final VoidCallback onProfile;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: const Color(0xFF005A41).withOpacity(0.05), blurRadius: 20)],
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            color: AppTheme.primary,
            width: double.infinity,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.people, color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    Text('Active $role', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
                Text('Primary contact for this property', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        name.split(' ').map((n) => n[0]).join(''),
                        style: const TextStyle(color: AppTheme.primary, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: const TextStyle(color: Color(0xFF1F2937), fontSize: 14, fontWeight: FontWeight.bold)),
                          const Text('Certified HomeCar User', style: TextStyle(color: Color(0xFF6B7280), fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                    child: FilledButton.icon(
                      onPressed: onMessage,
                      icon: const Icon(Icons.message, size: 18),
                      label: const Text(
                        'Message Tenant',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: onProfile,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFE5E7EB)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('View Profile', style: TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
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
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.description_outlined, color: AppTheme.primary, size: 20),
              SizedBox(width: 12),
              Text('Agreement Terms', style: TextStyle(color: Color(0xFF1F2937), fontSize: 16, fontWeight: FontWeight.w900)),
            ],
          ),
          const SizedBox(height: 20),
          Text(terms, style: const TextStyle(color: Color(0xFF4B5563), height: 1.6)),
        ],
      ),
    );
  }
}
