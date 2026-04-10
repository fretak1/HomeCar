import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../applications/providers/application_provider.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../../leases/providers/lease_provider.dart';
import '../../listings/models/property_model.dart';
import '../../listings/repositories/listing_repository.dart';
import '../../maintenance/providers/maintenance_provider.dart';
import '../../transactions/providers/transaction_provider.dart';
import '../repositories/admin_repository.dart';

final adminUsersProvider = FutureProvider<List<UserModel>>((ref) async {
  final user = ref.watch(authProvider).user;
  if (user == null || !user.isAdmin) {
    return const [];
  }

  return ref.watch(adminRepositoryProvider).getUsers();
});

final pendingAgentsProvider = FutureProvider<List<UserModel>>((ref) async {
  final users = await ref.watch(adminUsersProvider.future);
  return users
      .where((user) => user.isAgent && !user.verified)
      .toList(growable: false);
});

final pendingPropertiesProvider = FutureProvider<List<PropertyModel>>((
  ref,
) async {
  final user = ref.watch(authProvider).user;
  if (user == null || !user.isAdmin) {
    return const [];
  }

  return ref
      .watch(listingRepositoryProvider)
      .getProperties(extraParams: {'isVerified': 'false'});
});

final adminUserDetailProvider = FutureProvider.family<UserModel, String>((
  ref,
  userId,
) async {
  final user = ref.watch(authProvider).user;
  if (user == null || !user.isAdmin) {
    throw Exception('Admin access required.');
  }

  return ref.watch(adminRepositoryProvider).getUserById(userId);
});

final adminPropertyDetailProvider =
    FutureProvider.family<PropertyModel, String>((ref, propertyId) async {
      final user = ref.watch(authProvider).user;
      if (user == null || !user.isAdmin) {
        throw Exception('Admin access required.');
      }

      return ref.watch(adminRepositoryProvider).getPropertyById(propertyId);
    });

final propertyDocumentDataUriProvider = FutureProvider.family<String, String>((
  ref,
  docId,
) async {
  final user = ref.watch(authProvider).user;
  if (user == null || !user.isAdmin) {
    throw Exception('Admin access required.');
  }

  return ref.watch(adminRepositoryProvider).getPropertyDocumentDataUri(docId);
});

class AdminVerificationState {
  const AdminVerificationState({this.isLoading = false, this.error});

  final bool isLoading;
  final String? error;
}

class AdminVerificationNotifier extends StateNotifier<AdminVerificationState> {
  AdminVerificationNotifier(this.ref) : super(const AdminVerificationState());

  final Ref ref;

  Future<void> verifyUser({
    required String userId,
    required bool verified,
    String? rejectionReason,
  }) async {
    state = const AdminVerificationState(isLoading: true);
    try {
      await ref
          .read(adminRepositoryProvider)
          .verifyUser(
            userId: userId,
            verified: verified,
            rejectionReason: rejectionReason,
          );
      state = const AdminVerificationState();
      ref.invalidate(adminUsersProvider);
    } catch (error) {
      state = AdminVerificationState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  Future<void> verifyProperty({
    required String propertyId,
    required bool isVerified,
    String? rejectionReason,
  }) async {
    state = const AdminVerificationState(isLoading: true);
    try {
      await ref
          .read(adminRepositoryProvider)
          .verifyProperty(
            propertyId: propertyId,
            isVerified: isVerified,
            rejectionReason: rejectionReason,
          );
      state = const AdminVerificationState();
      ref.invalidate(pendingPropertiesProvider);
    } catch (error) {
      state = AdminVerificationState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }
}

final adminVerificationProvider =
    StateNotifierProvider<AdminVerificationNotifier, AdminVerificationState>((
      ref,
    ) {
      return AdminVerificationNotifier(ref);
    });

final adminOverviewProvider = Provider<AdminOverviewData>((ref) {
  final users =
      ref.watch(adminUsersProvider).valueOrNull ?? const <UserModel>[];
  final pendingProperties =
      ref.watch(pendingPropertiesProvider).valueOrNull ??
      const <PropertyModel>[];
  final leases = ref.watch(leasesProvider).valueOrNull ?? const <dynamic>[];
  final maintenance =
      ref.watch(maintenanceRequestsProvider).valueOrNull ?? const <dynamic>[];
  final transactions =
      ref.watch(transactionsProvider).valueOrNull ?? const <dynamic>[];
  final applications =
      ref.watch(allApplicationsProvider).valueOrNull ?? const <dynamic>[];

  final pendingAgents = users
      .where((user) => user.isAgent && !user.verified)
      .toList(growable: false);
  final verifiedUsers = users.where((user) => user.verified).length;

  return AdminOverviewData(
    totalUsers: users.length,
    verifiedUsers: verifiedUsers,
    pendingAgents: pendingAgents.length,
    pendingProperties: pendingProperties.length,
    totalLeases: leases.length,
    totalMaintenanceRequests: maintenance.length,
    totalTransactions: transactions.length,
    totalApplications: applications.length,
  );
});

class AdminOverviewData {
  const AdminOverviewData({
    required this.totalUsers,
    required this.verifiedUsers,
    required this.pendingAgents,
    required this.pendingProperties,
    required this.totalLeases,
    required this.totalMaintenanceRequests,
    required this.totalTransactions,
    required this.totalApplications,
  });

  final int totalUsers;
  final int verifiedUsers;
  final int pendingAgents;
  final int pendingProperties;
  final int totalLeases;
  final int totalMaintenanceRequests;
  final int totalTransactions;
  final int totalApplications;
}
