import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_paths.dart';
import '../../../core/api/dio_client.dart';
import '../models/chat_model.dart';

class ChatRepository {
  ChatRepository(this._client);

  final DioClient _client;

  Future<List<ChatConversation>> getConversations() async {
    try {
      final response = await _client.dio.get('${ApiPaths.chats}/conversations');
      final data = response.data;
      if (data is! List) {
        return const [];
      }

      return data
          .whereType<Map>()
          .map(
            (item) =>
                ChatConversation.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList();
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Unable to load conversations.'));
    }
  }

  Future<ChatThread> getThread(String partnerId) async {
    try {
      final response = await _client.dio.get(
        '${ApiPaths.chats}/messages/$partnerId',
      );
      final data = response.data is Map
          ? Map<String, dynamic>.from(response.data as Map)
          : <String, dynamic>{};

      final rawMessages = data['messages'];
      final messages = rawMessages is List
          ? rawMessages
                .whereType<Map>()
                .map(
                  (item) =>
                      ChatMessage.fromJson(Map<String, dynamic>.from(item)),
                )
                .toList()
          : <ChatMessage>[];

      ChatParticipant? partner;
      if (data['partner'] is Map) {
        partner = ChatParticipant.fromJson(
          Map<String, dynamic>.from(data['partner'] as Map),
        );
      }

      partner ??= _inferPartner(partnerId, messages);
      return ChatThread(partner: partner, messages: messages);
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Unable to load messages.'));
    }
  }

  Future<ChatMessage> sendMessage({
    required String receiverId,
    required String content,
  }) async {
    try {
      final response = await _client.dio.post(
        '${ApiPaths.chats}/send',
        data: {'receiverId': receiverId, 'content': content},
      );

      final data = response.data is Map
          ? Map<String, dynamic>.from(response.data as Map)
          : <String, dynamic>{};
      return ChatMessage.fromJson(data);
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Unable to send message.'));
    }
  }

  Future<void> initiateChat({
    required String receiverId,
    String? content,
  }) async {
    try {
      await _client.dio.post(
        '${ApiPaths.chats}/initiate',
        data: {
          'receiverId': receiverId,
          if (content != null && content.trim().isNotEmpty)
            'content': content.trim(),
        },
      );
    } on DioException catch (error) {
      throw Exception(_extractError(error, 'Unable to start conversation.'));
    }
  }

  ChatParticipant _inferPartner(String partnerId, List<ChatMessage> messages) {
    for (final message in messages) {
      if (message.senderId == partnerId && message.sender != null) {
        return message.sender!;
      }
    }

    return ChatParticipant(id: partnerId, name: 'Conversation');
  }

  String _extractError(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map && data['error'] != null) {
      return data['error'].toString();
    }

    if (data is Map && data['message'] != null) {
      return data['message'].toString();
    }

    return fallback;
  }
}

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(ref.watch(dioClientProvider));
});

