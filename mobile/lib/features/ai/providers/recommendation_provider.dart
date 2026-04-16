import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../listings/models/property_model.dart';
import '../../prediction/repositories/ai_repository.dart';

class RecommendationNotifier extends AsyncNotifier<List<PropertyModel>> {
  @override
  Future<List<PropertyModel>> build() async {
    ref.listen<AuthState>(authProvider, (previous, next) {
      final previousSettled = previous != null && !previous.isLoading;
      final nextSettled = !next.isLoading;

      if (!previousSettled || !nextSettled) {
        return;
      }

      if (previous.user?.id != next.user?.id) {
        ref.invalidateSelf();
      }
    });

    return _fetchResolved();
  }

  Future<AuthState> _resolveAuthState() async {
    var current = ref.read(authProvider);
    if (!current.isLoading) {
      return current;
    }

    for (var attempt = 0; attempt < 100; attempt++) {
      await Future<void>.delayed(const Duration(milliseconds: 50));
      current = ref.read(authProvider);
      if (!current.isLoading) {
        return current;
      }
    }

    return current;
  }

  Future<List<PropertyModel>> _fetchResolved() async {
    final authState = await _resolveAuthState();
    return _fetchForUser(authState.user?.id);
  }

  Future<List<PropertyModel>> _fetchForUser(String? userId) async {
    final repo = ref.read(aiRepositoryProvider);

    try {
      return await repo.getRecommendations(userId: userId);
    } on DioException catch (error) {
      final isTimeout =
          error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout;

      if (userId != null && isTimeout) {
        return repo.getRecommendations();
      }

      rethrow;
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchResolved);
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
