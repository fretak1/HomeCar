import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/property_model.dart';
import '../repositories/listing_repository.dart';

enum AssetFilter { all, homes, cars }

final assetFilterProvider = StateProvider<AssetFilter>(
  (ref) => AssetFilter.all,
);

final propertiesProvider = FutureProvider<List<PropertyModel>>((ref) async {
  final repository = ref.watch(listingRepositoryProvider);
  final filter = ref.watch(assetFilterProvider);

  String? assetQuery;
  if (filter == AssetFilter.homes) assetQuery = 'HOME';
  if (filter == AssetFilter.cars) assetQuery = 'CAR';

  return repository.getProperties(assetType: assetQuery);
});

final similarListingsProvider =
    FutureProvider.family<List<PropertyModel>, String>((ref, propertyId) async {
  final repository = ref.watch(listingRepositoryProvider);
  final all = await repository.getProperties();
  final current = all.where((p) => p.id == propertyId).firstOrNull;
  if (current == null) return [];

  return all
      .where((p) => p.id != propertyId && p.assetType == current.assetType)
      .take(6)
      .toList();
});

