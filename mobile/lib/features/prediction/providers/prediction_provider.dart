import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/prediction_model.dart';
import '../repositories/ai_repository.dart';

enum PredictionType { car, house }

class PredictionState {
  final PredictionType type;
  final bool isLoading;
  final PredictionResponse? result;
  final String? error;

  PredictionState({
    this.type = PredictionType.car,
    this.isLoading = false,
    this.result,
    this.error,
  });

  PredictionState copyWith({
    PredictionType? type,
    bool? isLoading,
    PredictionResponse? result,
    String? error,
    bool clearResult = false,
  }) {
    return PredictionState(
      type: type ?? this.type,
      isLoading: isLoading ?? this.isLoading,
      result: clearResult ? null : (result ?? this.result),
      error: error,
    );
  }
}

class PredictionNotifier extends StateNotifier<PredictionState> {
  final AiRepository _repo;

  PredictionNotifier(this._repo) : super(PredictionState());

  void setType(PredictionType type) {
    state = state.copyWith(type: type, clearResult: true, error: null);
  }

  Future<void> predictCar(CarPredictionRequest request) async {
    state = state.copyWith(isLoading: true, error: null, clearResult: true);
    try {
      final res = await _repo.predictCarPrice(request);
      state = state.copyWith(isLoading: false, result: res);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> predictHouse(HousePredictionRequest request) async {
    state = state.copyWith(isLoading: true, error: null, clearResult: true);
    try {
      final res = await _repo.predictHousePrice(request);
      state = state.copyWith(isLoading: false, result: res);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void reset() {
    state = state.copyWith(clearResult: true, error: null);
  }
}

final predictionProvider =
    StateNotifierProvider<PredictionNotifier, PredictionState>((ref) {
      return PredictionNotifier(ref.watch(aiRepositoryProvider));
    });
