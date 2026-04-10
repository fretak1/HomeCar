import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../auth/providers/auth_provider.dart';
import 'models/transaction_model.dart';
import 'providers/transaction_provider.dart';

class TransactionsScreen extends ConsumerWidget {
  const TransactionsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsAsync = ref.watch(transactionsProvider);
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions'),
        actions: [
          IconButton(
            onPressed: () => ref.invalidate(transactionsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: transactionsAsync.when(
        data: (transactions) {
          if (transactions.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 80),
                _EmptyTransactions(isManager: user?.isOwnerOrAgent ?? false),
              ],
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(transactionsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
              itemCount: transactions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return _TransactionCard(transaction: transactions[index]);
              },
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

class _TransactionCard extends ConsumerWidget {
  const _TransactionCard({required this.transaction});

  final TransactionModel transaction;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final isCustomerView = user?.isCustomer ?? false;
    final counterpart = isCustomerView ? transaction.payee : transaction.payer;

    return GlassCard(
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
                      transaction.property?.title ??
                          _typeLabel(transaction.type),
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      transaction.property?.locationLabel ??
                          _typeLabel(transaction.type),
                      style: const TextStyle(color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              _TransactionStatusChip(status: transaction.status),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            '${transaction.amount.toStringAsFixed(0)} ${transaction.currency}',
            style: const TextStyle(
              color: AppTheme.secondary,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _formatDate(transaction.createdAt),
            style: const TextStyle(color: Colors.white54, fontSize: 12),
          ),
          if (counterpart != null) ...[
            const SizedBox(height: 8),
            Text(
              '${isCustomerView ? 'Paid to' : 'Paid by'} ${counterpart.name}',
              style: const TextStyle(color: Colors.white70),
            ),
          ],
          if (transaction.chapaReference != null &&
              transaction.chapaReference!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              'Reference: ${transaction.chapaReference}',
              style: const TextStyle(color: Colors.white54, fontSize: 12),
            ),
          ],
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              if (transaction.isCompleted)
                ElevatedButton(
                  onPressed: () => context.push(
                    '/transactions/receipt/${transaction.id}',
                    extra: transaction,
                  ),
                  child: const Text('View Receipt'),
                ),
              OutlinedButton(
                onPressed: () => _copyReference(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Colors.white24),
                ),
                child: const Text('Copy Reference'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _copyReference(BuildContext context) {
    final reference = transaction.chapaReference ?? transaction.id;
    Clipboard.setData(ClipboardData(text: reference));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Transaction reference copied.')),
    );
  }
}

class _TransactionStatusChip extends StatelessWidget {
  const _TransactionStatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toUpperCase();
    final color = normalized == 'COMPLETED'
        ? const Color(0xFF34D399)
        : normalized == 'PENDING'
        ? const Color(0xFFFBBF24)
        : const Color(0xFFFB7185);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        normalized,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _EmptyTransactions extends StatelessWidget {
  const _EmptyTransactions({required this.isManager});

  final bool isManager;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.receipt_long_outlined,
            color: AppTheme.secondary.withOpacity(0.95),
            size: 42,
          ),
          const SizedBox(height: 16),
          Text(
            'No transactions yet',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          Text(
            isManager
                ? 'Incoming payments and verified receipts will appear here.'
                : 'Your listing and lease payments will appear here once completed.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, height: 1.5),
          ),
        ],
      ),
    );
  }
}

String _typeLabel(String type) {
  return type.replaceAll('_', ' ');
}

String _formatDate(DateTime date) {
  return '${date.day}/${date.month}/${date.year}';
}
