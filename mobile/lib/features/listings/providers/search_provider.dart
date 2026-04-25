import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/property_model.dart';
import '../repositories/listing_repository.dart';
import 'filter_provider.dart';
import 'listing_provider.dart';

enum ExploreViewMode { list, map }

final exploreViewModeProvider = StateProvider<ExploreViewMode>((ref) {
  return ExploreViewMode.list;
});

final searchPageProvider = StateProvider<int>((ref) => 1);

final exploreResultsProvider = FutureProvider.autoDispose<List<PropertyModel>>((
  ref,
) async {
  final repository = ref.watch(listingRepositoryProvider);
  final assetFilter = ref.watch(assetFilterProvider);
  final filters = ref.watch(filterProvider);

  String? assetQuery;
  if (assetFilter == AssetFilter.homes) assetQuery = 'HOME';
  if (assetFilter == AssetFilter.cars) assetQuery = 'CAR';

  final apiParams = filters.toApiParams(assetQuery ?? 'HOME');
  apiParams['page'] = ref.watch(searchPageProvider);
  apiParams['limit'] = 20;

  if (assetQuery != null) {
    apiParams['assetType'] = assetQuery;
  }

  return repository.getProperties(
    assetType: assetQuery,
    extraParams: apiParams,
  );
});

