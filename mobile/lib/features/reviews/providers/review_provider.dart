import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/review_model.dart';
import '../repositories/review_repository.dart';

final propertyReviewsProvider =
    FutureProvider.family<List<ReviewModel>, String>((ref, propertyId) async {
      return ref.watch(reviewRepositoryProvider).getReviews(propertyId);
    });

class ReviewActionState {
  const ReviewActionState({this.isLoading = false, this.error});

  final bool isLoading;
  final String? error;
}

class ReviewActionNotifier extends StateNotifier<ReviewActionState> {
  ReviewActionNotifier(this.ref) : super(const ReviewActionState());

  final Ref ref;

  Future<void> submitReview({
    required String propertyId,
    required int rating,
    String? comment,
  }) async {
    state = const ReviewActionState(isLoading: true);
    try {
      await ref
          .read(reviewRepositoryProvider)
          .submitReview(
            propertyId: propertyId,
            rating: rating,
            comment: comment,
          );
      state = const ReviewActionState();
      ref.invalidate(propertyReviewsProvider(propertyId));
    } catch (error) {
      state = ReviewActionState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  Future<void> deleteReview({
    required String propertyId,
    required String reviewId,
  }) async {
    state = const ReviewActionState(isLoading: true);
    try {
      await ref.read(reviewRepositoryProvider).deleteReview(reviewId);
      state = const ReviewActionState();
      ref.invalidate(propertyReviewsProvider(propertyId));
    } catch (error) {
      state = ReviewActionState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }
}

final reviewActionProvider =
    StateNotifierProvider<ReviewActionNotifier, ReviewActionState>((ref) {
      return ReviewActionNotifier(ref);
    });
