import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../auth/providers/auth_provider.dart';
import '../dashboard/widgets/dashboard_page_scaffold.dart';
import '../dashboard/widgets/dashboard_utils.dart';
import '../dashboard/widgets/role_dashboard_scaffold.dart';
import 'models/transaction_model.dart';
import 'providers/transaction_provider.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  String _statusFilter = 'all';
  String _dateFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final transactionsAsync = ref.watch(transactionsProvider);
    final user = ref.watch(authProvider).user;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            DashboardPageHeader(
              title: 'Transactions',
              subtitle: user?.isOwnerOrAgent == true
                  ? 'Track incoming payments, receipts, and transaction status across your listings.'
                  : 'Review your payment history, references, and completed receipts.',
              onBack: () => Navigator.of(context).maybePop(),
              action: OutlinedButton.icon(
                onPressed: () => ref.invalidate(transactionsProvider),
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Refresh'),
              ),
            ),
            Expanded(
              child: transactionsAsync.when(
                data: (transactions) {
                  final filtered = transactions.where((transaction) {
                    final matchesStatus = switch (_statusFilter) {
                      'completed' => transaction.status.toUpperCase() == 'COMPLETED',
                      'pending' => transaction.status.toUpperCase() == 'PENDING',
                      'failed' => transaction.status.toUpperCase() == 'FAILED',
                      _ => true,
                    };
                    return matchesStatus &&
                        _matchesDateFilter(transaction.createdAt, _dateFilter);
                  }).toList(growable: false);

                  final completed =
                      transactions.where((item) => item.isCompleted).length;
                  final revenue = transactions
                      .where((item) => item.isCompleted)
                      .fold<double>(0, (sum, item) => sum + item.amount);

                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(transactionsProvider);
                      await ref.read(transactionsProvider.future);
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
                                  title: 'Transaction history',
                                  child: Column(
                                    children: [
                                      LayoutBuilder(
                                        builder: (context, constraints) {
                                          final stacked =
                                              constraints.maxWidth < 720;
                                          final dateField = _SelectFilter(
                                            label: 'Date range',
                                            value: _dateFilter,
                                            items: const {
                                              'all': 'All time',
                                              'today': 'Today',
                                              'month': 'This month',
                                              'year': 'This year',
                                            },
                                            onChanged: (value) => setState(
                                              () => _dateFilter = value,
                                            ),
                                          );
                                          final statusField = _SelectFilter(
                                            label: 'Status',
                                            value: _statusFilter,
                                            items: const {
                                              'all': 'All status',
                                              'completed': 'Completed',
                                              'pending': 'Pending',
                                              'failed': 'Failed',
                                            },
                                            onChanged: (value) => setState(
                                              () => _statusFilter = value,
                                            ),
                                          );

                                          if (stacked) {
                                            return Column(
                                              children: [
                                                dateField,
                                                const SizedBox(height: 14),
                                                statusField,
                                              ],
                                            );
                                          }

                                          return Row(
                                            children: [
                                              Expanded(child: dateField),
                                              const SizedBox(width: 14),
                                              Expanded(child: statusField),
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
                                            icon: Icons.check_circle_outline,
                                            label: '$completed completed',
                                          ),
                                          DashboardMetricTile(
                                            icon: Icons.account_balance_wallet_outlined,
                                            label: formatDashboardMoney(revenue),
                                          ),
                                          DashboardMetricTile(
                                            icon: Icons.receipt_long_outlined,
                                            label: '${transactions.length} total records',
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                                if (transactions.isEmpty)
                                  DashboardEmptyState(
                                    title: 'No transactions yet',
                                    message: user?.isOwnerOrAgent == true
                                        ? 'Incoming payments and verified receipts will appear here once activity starts.'
                                        : 'Your listing and lease payments will show up here after they are processed.',
                                  )
                                else if (filtered.isEmpty)
                                  const DashboardEmptyState(
                                    title: 'No transactions match this filter',
                                    message:
                                        'Try changing the status or date range to inspect more payment activity.',
                                  )
                                else
                                  LayoutBuilder(
                                    builder: (context, constraints) {
                                      if (constraints.maxWidth >= 900) {
                                        return _TransactionsTable(
                                          transactions: filtered,
                                        );
                                      }

                                      return Column(
                                        children: filtered
                                            .map(
                                              (transaction) => Padding(
                                                padding: const EdgeInsets.only(
                                                  bottom: 14,
                                                ),
                                                child: _TransactionCard(
                                                  transaction: transaction,
                                                ),
                                              ),
                                            )
                                            .toList(),
                                      );
                                    },
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
                        label: 'Loading transactions...',
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
                        title: 'Transactions unavailable',
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

class _SelectFilter extends StatelessWidget {
  const _SelectFilter({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String label;
  final String value;
  final Map<String, String> items;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.foreground,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(
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
          items: items.entries
              .map(
                (entry) => DropdownMenuItem<String>(
                  value: entry.key,
                  child: Text(entry.value),
                ),
              )
              .toList(),
          onChanged: (next) {
            if (next != null) {
              onChanged(next);
            }
          },
        ),
      ],
    );
  }
}

class _TransactionsTable extends StatelessWidget {
  const _TransactionsTable({required this.transactions});

  final List<TransactionModel> transactions;

  @override
  Widget build(BuildContext context) {
    return DashboardSectionCard(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingTextStyle: const TextStyle(
            color: AppTheme.mutedForeground,
            fontSize: 11,
            fontWeight: FontWeight.w800,
          ),
          columns: const [
            DataColumn(label: Text('Transaction')),
            DataColumn(label: Text('Details')),
            DataColumn(label: Text('Date')),
            DataColumn(label: Text('Amount')),
            DataColumn(label: Text('Status')),
            DataColumn(label: Text('Action')),
          ],
          rows: transactions.map((transaction) {
            return DataRow(
              cells: [
                DataCell(
                  Text(
                    'TX-${transaction.id.substring(0, transaction.id.length > 8 ? 8 : transaction.id.length).toUpperCase()}',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                DataCell(
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        transaction.property?.title ??
                            prettyDashboardLabel(transaction.type),
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      Text(
                        transaction.property?.locationLabel ??
                            prettyDashboardLabel(transaction.type),
                        style: const TextStyle(
                          color: AppTheme.mutedForeground,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                DataCell(Text(formatDashboardDate(transaction.createdAt))),
                DataCell(
                  Text(
                    formatDashboardMoney(transaction.amount),
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                DataCell(
                  DashboardStatusPill(
                    label: prettyDashboardLabel(transaction.status),
                    color: dashboardStatusColor(transaction.status),
                  ),
                ),
                DataCell(
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (transaction.isCompleted)
                        OutlinedButton(
                          onPressed: () => context.push(
                            '/transactions/receipt/${transaction.id}',
                            extra: transaction,
                          ),
                          child: const Text('Receipt'),
                        ),
                      const SizedBox(width: 8),
                      IconButton(
                        tooltip: 'Copy reference',
                        onPressed: () => _copyReference(context, transaction),
                        icon: const Icon(Icons.copy_rounded, size: 18),
                      ),
                    ],
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _TransactionCard extends ConsumerWidget {
  const _TransactionCard({required this.transaction});

  final TransactionModel transaction;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final isCustomerView = user?.isCustomer ?? false;
    final counterpart = isCustomerView ? transaction.payee : transaction.payer;

    return DashboardEntityCard(
      title:
          transaction.property?.title ?? prettyDashboardLabel(transaction.type),
      subtitle:
          transaction.property?.locationLabel ??
          prettyDashboardLabel(transaction.type),
      imageIcon: Icons.payments_outlined,
      status: DashboardStatusPill(
        label: prettyDashboardLabel(transaction.status),
        color: dashboardStatusColor(transaction.status),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (counterpart != null)
            Text(
              '${isCustomerView ? 'Paid to' : 'Paid by'} ${counterpart.name}',
              style: const TextStyle(
                color: AppTheme.foreground,
                fontWeight: FontWeight.w800,
              ),
            ),
          if (counterpart != null) const SizedBox(height: 8),
          Text(
            transaction.chapaReference?.trim().isNotEmpty == true
                ? 'Reference: ${transaction.chapaReference}'
                : 'Reference: ${transaction.id}',
            style: const TextStyle(
              color: AppTheme.mutedForeground,
            ),
          ),
        ],
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
          onPressed: () => _copyReference(context, transaction),
          icon: const Icon(Icons.copy_rounded, size: 18),
          label: const Text('Copy reference'),
        ),
      ],
    );
  }
}

void _copyReference(BuildContext context, TransactionModel transaction) {
  final reference = transaction.chapaReference ?? transaction.id;
  Clipboard.setData(ClipboardData(text: reference));
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text('Transaction reference copied.')),
  );
}

bool _matchesDateFilter(DateTime date, String filter) {
  final now = DateTime.now();

  switch (filter) {
    case 'today':
      return date.year == now.year &&
          date.month == now.month &&
          date.day == now.day;
    case 'month':
      return date.year == now.year && date.month == now.month;
    case 'year':
      return date.year == now.year;
    default:
      return true;
  }
}
