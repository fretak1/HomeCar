import 'package:file_picker/file_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/upload_repository.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/maintenance_request_model.dart';
import '../repositories/maintenance_repository.dart';

final maintenanceRequestsProvider =
    FutureProvider<List<MaintenanceRequestModel>>((ref) async {
      final user = ref.watch(authProvider).user;
      if (user == null) {
        return const [];
      }

      return ref.watch(maintenanceRepositoryProvider).getRequests();
    });

class MaintenanceActionState {
  const MaintenanceActionState({this.isLoading = false, this.error});

  final bool isLoading;
  final String? error;
}

class MaintenanceActionNotifier extends StateNotifier<MaintenanceActionState> {
  MaintenanceActionNotifier(this.ref) : super(const MaintenanceActionState());

  final Ref ref;

  Future<void> createRequest({
    required String propertyId,
    required String category,
    required String description,
    List<String> imagePaths = const [],
    List<PlatformFile> attachments = const [],
  }) async {
    state = const MaintenanceActionState(isLoading: true);
    try {
      final uploadedImages = await ref
          .read(uploadRepositoryProvider)
          .uploadSelectedFiles(
            paths: imagePaths,
            files: attachments,
          );
      await ref
          .read(maintenanceRepositoryProvider)
          .createRequest(
            propertyId: propertyId,
            category: category,
            description: description,
            images: uploadedImages,
          );
      state = const MaintenanceActionState();
      ref.invalidate(maintenanceRequestsProvider);
    } catch (error) {
      state = MaintenanceActionState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  Future<void> updateStatus({
    required String requestId,
    required String status,
  }) async {
    state = const MaintenanceActionState(isLoading: true);
    try {
      await ref
          .read(maintenanceRepositoryProvider)
          .updateStatus(requestId: requestId, status: status);
      state = const MaintenanceActionState();
      ref.invalidate(maintenanceRequestsProvider);
    } catch (error) {
      state = MaintenanceActionState(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }
}

final maintenanceActionProvider =
    StateNotifierProvider<MaintenanceActionNotifier, MaintenanceActionState>((
      ref,
    ) {
      return MaintenanceActionNotifier(ref);
    });

