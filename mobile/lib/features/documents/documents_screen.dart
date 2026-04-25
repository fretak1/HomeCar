import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../auth/providers/auth_provider.dart';
import '../leases/models/lease_model.dart';
import '../leases/providers/lease_provider.dart';
import '../transactions/models/transaction_model.dart';
import '../transactions/providers/transaction_provider.dart';

class DocumentsScreen extends ConsumerWidget {
  const DocumentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsAsync = ref.watch(transactionsProvider);
    final leasesAsync = ref.watch(leasesProvider);
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Documents'),
        actions: [
          IconButton(
            onPressed: () {
              ref.invalidate(transactionsProvider);
              ref.invalidate(leasesProvider);
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(transactionsProvider);
          ref.invalidate(leasesProvider);
          await Future.wait([
            ref.read(transactionsProvider.future),
            ref.read(leasesProvider.future),
          ]);
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: [
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Document Center',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    user?.isOwnerOrAgent ?? false
                        ? 'Open payment receipts and lease agreements for your managed activity.'
                        : 'Open payment receipts and lease agreements for your applications and rentals.',
                    style: const TextStyle(color: Colors.white70, height: 1.45),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            transactionsAsync.when(
              data: (transactions) => _DocumentSection(
                title: 'Receipts',
                icon: Icons.receipt_long_outlined,
                emptyMessage: 'Completed payment receipts will appear here.',
                children: _buildReceiptItems(context, transactions),
              ),
              loading: () => const _LoadingSection(title: 'Receipts'),
              error: (error, _) => _ErrorSection(
                title: 'Receipts',
                message: error.toString().replaceFirst('Exception: ', ''),
              ),
            ),
            const SizedBox(height: 16),
            leasesAsync.when(
              data: (leases) => _DocumentSection(
                title: 'Lease Agreements',
                icon: Icons.description_outlined,
                emptyMessage:
                    'Lease agreements and active offers will appear here.',
                children: _buildLeaseItems(context, leases),
              ),
              loading: () => const _LoadingSection(title: 'Lease Agreements'),
              error: (error, _) => _ErrorSection(
                title: 'Lease Agreements',
                message: error.toString().replaceFirst('Exception: ', ''),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildReceiptItems(
    BuildContext context,
    List<TransactionModel> transactions,
  ) {
    final completed = transactions
        .where((item) => item.isCompleted)
        .toList(growable: false);
    if (completed.isEmpty) {
      return const [];
    }

    return completed
        .map(
          (transaction) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _ReceiptDocumentCard(transaction: transaction),
          ),
        )
        .toList();
  }

  List<Widget> _buildLeaseItems(BuildContext context, List<LeaseModel> leases) {
    if (leases.isEmpty) {
      return const [];
    }

    return leases
        .map(
          (lease) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _LeaseDocumentCard(lease: lease),
          ),
        )
        .toList();
  }
}

class _DocumentSection extends StatelessWidget {
  const _DocumentSection({
    required this.title,
    required this.icon,
    required this.emptyMessage,
    required this.children,
  });

  final String title;
  final IconData icon;
  final String emptyMessage;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppTheme.secondary),
              const SizedBox(width: 10),
              Text(title, style: Theme.of(context).textTheme.titleLarge),
            ],
          ),
          const SizedBox(height: 14),
          if (children.isEmpty)
            Text(emptyMessage, style: const TextStyle(color: Colors.white70))
          else
            Column(children: children),
        ],
      ),
    );
  }
}

class _ReceiptDocumentCard extends StatelessWidget {
  const _ReceiptDocumentCard({required this.transaction});

  final TransactionModel transaction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            transaction.property?.title ??
                transaction.type.replaceAll('_', ' '),
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 6),
          Text(
            '${transaction.amount.toStringAsFixed(0)} ${transaction.currency}',
            style: const TextStyle(
              color: AppTheme.secondary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${transaction.createdAt.day}/${transaction.createdAt.month}/${transaction.createdAt.year}',
            style: const TextStyle(color: Colors.white54),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () => context.push(
              '/transactions/receipt/${transaction.id}',
              extra: transaction,
            ),
            child: const Text('Open Receipt'),
          ),
        ],
      ),
    );
  }
}

class _LeaseDocumentCard extends StatelessWidget {
  const _LeaseDocumentCard({required this.lease});

  final LeaseModel lease;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            lease.property?.title ?? 'Lease Agreement',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 6),
          Text(
            '${lease.startDate.day}/${lease.startDate.month}/${lease.startDate.year} to ${lease.endDate.day}/${lease.endDate.month}/${lease.endDate.year}',
            style: const TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 6),
          Text(
            lease.status.replaceAll('_', ' '),
            style: const TextStyle(color: Colors.white54),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () =>
                context.push('/leases/${lease.id}/contract', extra: lease),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: const BorderSide(color: Colors.white24),
            ),
            child: const Text('Open Agreement'),
          ),
        ],
      ),
    );
  }
}

class _LoadingSection extends StatelessWidget {
  const _LoadingSection({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}

class _ErrorSection extends StatelessWidget {
  const _ErrorSection({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          Text(message, style: const TextStyle(color: Colors.redAccent)),
        ],
      ),
    );
  }
}

