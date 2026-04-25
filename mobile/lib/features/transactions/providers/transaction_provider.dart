import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../models/transaction_model.dart';
import '../repositories/transaction_repository.dart';

final transactionsProvider = FutureProvider<List<TransactionModel>>((
  ref,
) async {
  final user = ref.watch(authProvider).user;
  if (user == null) {
    return const [];
  }

  return ref.watch(transactionRepositoryProvider).getTransactions();
});

