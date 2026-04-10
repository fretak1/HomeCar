import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../models/application_model.dart';
import '../repositories/application_repository.dart';

final myApplicationsProvider = FutureProvider<List<PropertyApplication>>((
  ref,
) async {
  final user = ref.watch(authProvider).user;
  if (user == null) {
    return const [];
  }

  return ref
      .watch(applicationRepositoryProvider)
      .getApplications(customerId: user.id);
});

final managedApplicationsProvider = FutureProvider<List<PropertyApplication>>((
  ref,
) async {
  final user = ref.watch(authProvider).user;
  if (user == null || !user.isOwnerOrAgent) {
    return const [];
  }

  return ref
      .watch(applicationRepositoryProvider)
      .getApplications(managerId: user.id);
});

final allApplicationsProvider = FutureProvider<List<PropertyApplication>>((
  ref,
) async {
  final user = ref.watch(authProvider).user;
  if (user == null || !user.isAdmin) {
    return const [];
  }

  return ref.watch(applicationRepositoryProvider).getApplications();
});

final propertyApplicationProvider =
    Provider.family<PropertyApplication?, String>((ref, propertyId) {
      final applications =
          ref.watch(myApplicationsProvider).valueOrNull ??
          const <PropertyApplication>[];
      for (final application in applications) {
        if (application.propertyId == propertyId) {
          return application;
        }
      }

      return null;
    });

class ApplicationSubmissionState {
  const ApplicationSubmissionState({this.isSubmitting = false, this.error});

  final bool isSubmitting;
  final String? error;

  ApplicationSubmissionState copyWith({bool? isSubmitting, String? error}) {
    return ApplicationSubmissionState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
    );
  }
}

class ApplicationSubmissionNotifier
    extends StateNotifier<ApplicationSubmissionState> {
  ApplicationSubmissionNotifier(this.ref)
    : super(const ApplicationSubmissionState());

  final Ref ref;

  Future<void> submit({required String propertyId, String? message}) async {
    state = const ApplicationSubmissionState(isSubmitting: true);
    try {
      await ref
          .read(applicationRepositoryProvider)
          .submitApplication(propertyId: propertyId, message: message);
      state = const ApplicationSubmissionState();
      ref.invalidate(myApplicationsProvider);
      ref.invalidate(managedApplicationsProvider);
      ref.invalidate(allApplicationsProvider);
    } catch (error) {
      state = ApplicationSubmissionState(
        isSubmitting: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  void clearError() {
    state = const ApplicationSubmissionState();
  }
}

final applicationSubmissionProvider =
    StateNotifierProvider<
      ApplicationSubmissionNotifier,
      ApplicationSubmissionState
    >((ref) {
      return ApplicationSubmissionNotifier(ref);
    });

class ApplicationStatusUpdateState {
  const ApplicationStatusUpdateState({this.isLoading = false, this.error});

  final bool isLoading;
  final String? error;
}

class ApplicationStatusUpdateNotifier
    extends StateNotifier<ApplicationStatusUpdateState> {
  ApplicationStatusUpdateNotifier(this.ref)
    : super(const ApplicationStatusUpdateState());

  final Ref ref;

  Future<void> updateStatus({
    required String applicationId,
    required String status,
  }) async {
    state = const ApplicationStatusUpdateState(isLoading: true);
    try {
      await ref
          .read(applicationRepositoryProvider)
          .updateApplicationStatus(
            applicationId: applicationId,
            status: status,
          );
      state = const ApplicationStatusUpdateState();
      ref.invalidate(myApplicationsProvider);
      ref.invalidate(managedApplicationsProvider);
      ref.invalidate(allApplicationsProvider);
    } catch (error) {
      state = ApplicationStatusUpdateState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }
}

final applicationStatusUpdateProvider =
    StateNotifierProvider<
      ApplicationStatusUpdateNotifier,
      ApplicationStatusUpdateState
    >((ref) {
      return ApplicationStatusUpdateNotifier(ref);
    });
