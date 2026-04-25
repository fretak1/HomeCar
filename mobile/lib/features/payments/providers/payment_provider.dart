import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/payment_repository.dart';

class PaymentState {
  final bool isLoading;
  final String? error;
  final String? checkoutUrl;
  final bool isVerified;
  final Map<String, dynamic>? transactionData;
  final List<dynamic> banks;

  PaymentState({
    this.isLoading = false,
    this.error,
    this.checkoutUrl,
    this.isVerified = false,
    this.transactionData,
    this.banks = const [],
  });

  PaymentState copyWith({
    bool? isLoading,
    String? error,
    String? checkoutUrl,
    bool? isVerified,
    Map<String, dynamic>? transactionData,
    List<dynamic>? banks,
  }) {
    return PaymentState(
      isLoading: isLoading ?? this.isLoading,
      error: error, // explicit override
      checkoutUrl: checkoutUrl ?? this.checkoutUrl,
      isVerified: isVerified ?? this.isVerified,
      transactionData: transactionData ?? this.transactionData,
      banks: banks ?? this.banks,
    );
  }
}

class PaymentNotifier extends StateNotifier<PaymentState> {
  final PaymentRepository _repo;

  PaymentNotifier(this._repo) : super(PaymentState());

  Future<void> fetchBanks() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final banks = await _repo.getBanks();
      state = state.copyWith(banks: banks, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<String?> initialize(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final checkoutUrl = await _repo.initializePayment(data);
      state = state.copyWith(isLoading: false, checkoutUrl: checkoutUrl);
      return checkoutUrl;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }

  Future<bool> verify(String txRef) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _repo.verifyPayment(txRef);
      if (result['success'] == true) {
        state = state.copyWith(
          isLoading: false,
          isVerified: true,
          transactionData: result['transaction'],
        );
        return true;
      }
      state = state.copyWith(
        isLoading: false,
        error: result['message'] ?? 'Verification failed',
      );
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> createSubaccount({
    required String userId,
    required String bankCode,
    required String accountNumber,
    required String accountName,
    String? businessName,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.createSubaccount(
        userId: userId,
        bankCode: bankCode,
        accountNumber: accountNumber,
        accountName: accountName,
        businessName: businessName,
      );
      state = state.copyWith(isLoading: false, error: null);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  void reset() {
    state = PaymentState();
  }
}

final paymentProvider = StateNotifierProvider<PaymentNotifier, PaymentState>((
  ref,
) {
  return PaymentNotifier(ref.watch(paymentRepositoryProvider));
});

