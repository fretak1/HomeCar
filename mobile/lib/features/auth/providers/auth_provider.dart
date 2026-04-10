import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/user_model.dart';
import '../repositories/auth_repository.dart';

class AuthState {
  const AuthState({
    this.user,
    this.pendingEmail,
    this.isLoading = false,
    this.error,
  });

  final UserModel? user;
  final String? pendingEmail;
  final bool isLoading;
  final String? error;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserModel? user,
    String? pendingEmail,
    bool? isLoading,
    String? error,
    bool clearUser = false,
    bool clearPendingEmail = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      pendingEmail: clearPendingEmail
          ? null
          : (pendingEmail ?? this.pendingEmail),
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    _init();
    return const AuthState(isLoading: true);
  }

  Future<void> _init() async {
    try {
      final repo = ref.read(authRepositoryProvider);
      final user = await repo.getCurrentUser();
      final pendingEmail = await repo.getPendingEmail();
      state = AuthState(user: user, pendingEmail: pendingEmail);
    } catch (_) {
      state = const AuthState();
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await ref
          .read(authRepositoryProvider)
          .login(email, password);
      state = AuthState(user: user);
    } on Exception catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: error.toString(),
        pendingEmail: email,
      );
      rethrow;
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String role,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await ref
          .read(authRepositoryProvider)
          .register(name: name, email: email, password: password, role: role);
      state = state.copyWith(isLoading: false, pendingEmail: email);
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
      rethrow;
    }
  }

  Future<void> resendVerificationOtp([String? email]) async {
    final targetEmail = email ?? state.pendingEmail;
    if (targetEmail == null || targetEmail.isEmpty) {
      throw Exception('Enter the email address you want to verify.');
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      await ref.read(authRepositoryProvider).sendVerificationOtp(targetEmail);
      state = state.copyWith(isLoading: false, pendingEmail: targetEmail);
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
      rethrow;
    }
  }

  Future<void> verifyEmail({required String email, required String otp}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await ref
          .read(authRepositoryProvider)
          .verifyEmail(email: email, otp: otp);
      state = AuthState(user: user);
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
      rethrow;
    }
  }

  Future<void> requestPasswordReset(String email) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await ref.read(authRepositoryProvider).requestPasswordReset(email);
      state = state.copyWith(isLoading: false, pendingEmail: email);
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
      rethrow;
    }
  }

  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await ref
          .read(authRepositoryProvider)
          .resetPassword(email: email, otp: otp, newPassword: newPassword);
      await ref.read(authRepositoryProvider).clearPendingEmail();
      state = state.copyWith(isLoading: false, clearPendingEmail: true);
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
      rethrow;
    }
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AuthState();
  }

  Future<void> updateProfile({
    String? name,
    String? email,
    String? phoneNumber,
    String? currentPassword,
    String? newPassword,
    String? profileImagePath,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await ref
          .read(authRepositoryProvider)
          .updateProfile(
            name: name,
            email: email,
            phoneNumber: phoneNumber,
            currentPassword: currentPassword,
            newPassword: newPassword,
            profileImagePath: profileImagePath,
          );
      state = state.copyWith(user: user, isLoading: false, error: null);
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
      rethrow;
    }
  }

  Future<void> submitAgentVerification({
    required String licensePath,
    required String selfiePath,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await ref
          .read(authRepositoryProvider)
          .submitAgentVerification(
            licensePath: licensePath,
            selfiePath: selfiePath,
          );
      state = state.copyWith(user: user, isLoading: false, error: null);
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
      rethrow;
    }
  }

  Future<void> refreshCurrentUser() async {
    try {
      final user = await ref.read(authRepositoryProvider).getCurrentUser();
      state = state.copyWith(user: user, isLoading: false, error: null);
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, error: error.toString());
      rethrow;
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});

final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});
