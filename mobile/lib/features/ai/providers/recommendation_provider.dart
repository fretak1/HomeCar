import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../listings/models/property_model.dart';
import '../../prediction/repositories/ai_repository.dart';

class RecommendationNotifier extends AsyncNotifier<List<PropertyModel>> {
  @override
  Future<List<PropertyModel>> build() async {
    return _fetch();
  }

  Future<List<PropertyModel>> _fetch() async {
    final user = ref.watch(authProvider).user;
    final repo = ref.read(aiRepositoryProvider);

    // If not logged in, we could pass local history from a persistence layer
    // For now, we'll fetch based on userId if available
    return repo.getRecommendations(userId: user?.id);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetch());
  }

  Future<String> getExplanation() async {
    final user = ref.read(authProvider).user;
    if (user == null)
      return "Start interacting with listings to get personalized explanations.";
    return ref.read(aiRepositoryProvider).explainRecommendation(user.id);
  }
}

final recommendationProvider =
    AsyncNotifierProvider<RecommendationNotifier, List<PropertyModel>>(() {
      return RecommendationNotifier();
    });
