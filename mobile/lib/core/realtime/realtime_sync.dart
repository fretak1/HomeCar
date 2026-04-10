import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../features/applications/providers/application_provider.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/chat/providers/chat_provider.dart';
import '../../features/leases/providers/lease_provider.dart';
import '../../features/maintenance/providers/maintenance_provider.dart';
import '../../features/notifications/providers/notification_provider.dart';
import '../api/dio_client.dart';
import '../api/session_storage.dart';

class RealtimeSyncService {
  RealtimeSyncService(this.ref);

  final Ref ref;
  io.Socket? _socket;
  String? _connectedUserId;

  Future<void> syncWithAuth(AuthState authState) async {
    final user = authState.user;
    if (user == null) {
      disconnect();
      return;
    }

    if (_connectedUserId == user.id && (_socket?.connected ?? false)) {
      return;
    }

    final cookies = await ref.read(sessionStorageProvider).readCookies();
    disconnect();

    final headers = <String, dynamic>{};
    if (cookies != null && cookies.isNotEmpty) {
      headers['Cookie'] = cookies;
    }

    final socket = io.io(
      DioClient.baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .enableForceNew()
          .setExtraHeaders(headers)
          .build(),
    );

    socket.on('new_message', _handleMessage);
    socket.on('new_notification', _handleNotification);
    socket.onDisconnect((_) {
      if (_socket == socket) {
        _connectedUserId = null;
      }
    });

    _socket = socket;
    _connectedUserId = user.id;
    socket.connect();
  }

  void _handleMessage(dynamic payload) {
    final data = _toMap(payload);
    final currentUserId = ref.read(authProvider).user?.id;
    final senderId = data['senderId']?.toString();
    final receiverId = data['receiverId']?.toString();

    ref.invalidate(chatConversationsProvider);

    final partnerId = senderId == currentUserId ? receiverId : senderId;
    if (partnerId != null && partnerId.isNotEmpty) {
      ref.invalidate(chatThreadProvider(partnerId));
    }
  }

  void _handleNotification(dynamic payload) {
    final data = _toMap(payload);
    final type = data['type']?.toString().toUpperCase() ?? '';

    ref.invalidate(notificationsProvider);

    switch (type) {
      case 'APPLICATION':
        ref.invalidate(myApplicationsProvider);
        ref.invalidate(managedApplicationsProvider);
        ref.invalidate(allApplicationsProvider);
        break;
      case 'LEASE':
        ref.invalidate(leasesProvider);
        break;
      case 'MAINTENANCE':
        ref.invalidate(maintenanceRequestsProvider);
        break;
      case 'MESSAGE':
        ref.invalidate(chatConversationsProvider);
        break;
    }
  }

  Map<String, dynamic> _toMap(dynamic payload) {
    if (payload is Map) {
      return Map<String, dynamic>.from(payload);
    }
    return <String, dynamic>{};
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connectedUserId = null;
  }
}

final realtimeSyncProvider = Provider<RealtimeSyncService>((ref) {
  final service = RealtimeSyncService(ref);
  ref.onDispose(service.disconnect);
  ref.listen<AuthState>(authProvider, (_, next) {
    unawaited(service.syncWithAuth(next));
  }, fireImmediately: true);
  return service;
});
