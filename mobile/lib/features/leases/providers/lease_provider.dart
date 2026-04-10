import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../models/lease_model.dart';
import '../repositories/lease_repository.dart';

final leasesProvider = FutureProvider<List<LeaseModel>>((ref) async {
  final user = ref.watch(authProvider).user;
  if (user == null) {
    return const [];
  }

  return ref.watch(leaseRepositoryProvider).getLeases();
});

final leaseDetailProvider = FutureProvider.family<LeaseModel, String>((
  ref,
  leaseId,
) async {
  final leases = await ref.watch(leasesProvider.future);
  for (final lease in leases) {
    if (lease.id == leaseId) {
      return lease;
    }
  }
  throw Exception('Lease not found.');
});

class LeaseActionState {
  const LeaseActionState({this.isLoading = false, this.error});

  final bool isLoading;
  final String? error;
}

class LeaseActionNotifier extends StateNotifier<LeaseActionState> {
  LeaseActionNotifier(this.ref) : super(const LeaseActionState());

  final Ref ref;

  Future<void> createLease({
    required String leaseType,
    required String startDate,
    required String endDate,
    required double totalPrice,
    double? recurringAmount,
    required String terms,
    required String propertyId,
    required String customerId,
    required String ownerId,
  }) async {
    state = const LeaseActionState(isLoading: true);
    try {
      await ref
          .read(leaseRepositoryProvider)
          .createLease(
            leaseType: leaseType,
            startDate: startDate,
            endDate: endDate,
            totalPrice: totalPrice,
            recurringAmount: recurringAmount,
            terms: terms,
            propertyId: propertyId,
            customerId: customerId,
            ownerId: ownerId,
          );
      state = const LeaseActionState();
      ref.invalidate(leasesProvider);
    } catch (error) {
      state = LeaseActionState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  Future<void> acceptLease({
    required String leaseId,
    required String role,
  }) async {
    state = const LeaseActionState(isLoading: true);
    try {
      await ref
          .read(leaseRepositoryProvider)
          .acceptLease(leaseId: leaseId, role: role);
      state = const LeaseActionState();
      ref.invalidate(leasesProvider);
    } catch (error) {
      state = LeaseActionState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  Future<void> requestCancellation({
    required String leaseId,
    required String role,
  }) async {
    state = const LeaseActionState(isLoading: true);
    try {
      await ref
          .read(leaseRepositoryProvider)
          .requestCancellation(leaseId: leaseId, role: role);
      state = const LeaseActionState();
      ref.invalidate(leasesProvider);
    } catch (error) {
      state = LeaseActionState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }
}

final leaseActionProvider =
    StateNotifierProvider<LeaseActionNotifier, LeaseActionState>((ref) {
      return LeaseActionNotifier(ref);
    });
