import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../listings/models/property_model.dart';
import '../repositories/favorite_repository.dart';

class FavoriteNotifier extends AsyncNotifier<List<PropertyModel>> {
  @override
  Future<List<PropertyModel>> build() async {
    final user = ref.watch(authProvider).user;
    if (user == null) return [];
    return _fetchFromServer();
  }

  Future<List<PropertyModel>> _fetchFromServer() async {
    final repo = ref.read(favoriteRepositoryProvider);
    return repo.getFavorites();
  }

  bool isFavorited(String propertyId) {
    return state.valueOrNull?.any((property) => property.id == propertyId) ??
        false;
  }

  Future<void> toggle(PropertyModel property) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final current = state.valueOrNull ?? [];
    final alreadyFavorited = current.any((item) => item.id == property.id);
    final repo = ref.read(favoriteRepositoryProvider);

    if (alreadyFavorited) {
      state = AsyncData(
        current.where((item) => item.id != property.id).toList(),
      );
    } else {
      state = AsyncData([property, ...current]);
    }

    try {
      if (alreadyFavorited) {
        await repo.removeFavorite(property.id);
      } else {
        await repo.addFavorite(property.id);
      }
    } catch (_) {
      state = AsyncData(current);
    }
  }

  Future<void> refresh() async {
    final user = ref.read(authProvider).user;
    if (user == null) {
      state = const AsyncData([]);
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchFromServer);
  }
}

final favoriteProvider =
    AsyncNotifierProvider<FavoriteNotifier, List<PropertyModel>>(
      FavoriteNotifier.new,
    );

final favoritedIdsProvider = Provider<Set<String>>((ref) {
  return ref
          .watch(favoriteProvider)
          .valueOrNull
          ?.map((item) => item.id)
          .toSet() ??
      {};
});

