import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/models/user_model.dart';
import '../../leases/models/lease_model.dart';
import '../../leases/repositories/lease_repository.dart';
import '../../listings/models/property_model.dart';
import '../../listings/repositories/listing_repository.dart';
import '../repositories/public_profile_repository.dart';

final publicUserProvider = FutureProvider.family<UserModel, String>((
  ref,
  userId,
) async {
  return ref.watch(publicProfileRepositoryProvider).getUserById(userId);
});

final publicUserListingsProvider =
    FutureProvider.family<List<PropertyModel>, String>((ref, userId) async {
      final user = await ref.watch(publicUserProvider(userId).future);
      final repository = ref.watch(listingRepositoryProvider);

      if (user.isAgent) {
        return repository.getManagedListings(userId);
      }

      if (user.isOwner) {
        return repository.getPropertiesByOwnerId(userId);
      }

      return [];
    });

final publicUserLeasesProvider =
    FutureProvider.family<List<LeaseModel>, String>((ref, userId) async {
      return ref.watch(leaseRepositoryProvider).getLeasesForUser(userId);
    });

