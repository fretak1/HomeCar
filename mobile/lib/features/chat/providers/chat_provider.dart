import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../models/chat_model.dart';
import '../repositories/chat_repository.dart';

final chatConversationsProvider = FutureProvider<List<ChatConversation>>((
  ref,
) async {
  final authState = ref.watch(authProvider);
  if (!authState.isAuthenticated) {
    return const [];
  }

  return ref.watch(chatRepositoryProvider).getConversations();
});

class ChatThreadState {
  const ChatThreadState({
    this.partner,
    this.messages = const [],
    this.isLoading = true,
    this.isSending = false,
    this.error,
  });

  final ChatParticipant? partner;
  final List<ChatMessage> messages;
  final bool isLoading;
  final bool isSending;
  final String? error;

  ChatThreadState copyWith({
    ChatParticipant? partner,
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isSending,
    String? error,
    bool clearError = false,
  }) {
    return ChatThreadState(
      partner: partner ?? this.partner,
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      error: clearError ? null : error ?? this.error,
    );
  }
}

class ChatThreadNotifier extends StateNotifier<ChatThreadState> {
  ChatThreadNotifier(this.ref, this.partnerId)
    : super(const ChatThreadState()) {
    loadThread();
  }

  final Ref ref;
  final String partnerId;

  Future<void> loadThread({bool refreshOnly = false}) async {
    final authState = ref.read(authProvider);
    if (!authState.isAuthenticated) {
      state = state.copyWith(
        isLoading: false,
        isSending: false,
        error: 'Please sign in to open your inbox.',
      );
      return;
    }

    state = state.copyWith(
      isLoading: refreshOnly ? state.messages.isEmpty : true,
      isSending: false,
      clearError: true,
    );

    try {
      final thread = await ref
          .read(chatRepositoryProvider)
          .getThread(partnerId);
      state = state.copyWith(
        partner: thread.partner,
        messages: thread.messages,
        isLoading: false,
        isSending: false,
        clearError: true,
      );
      ref.invalidate(chatConversationsProvider);
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        isSending: false,
        error: _readError(error),
      );
    }
  }

  Future<void> sendMessage(String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty || state.isSending) {
      return;
    }

    final userId = ref.read(authProvider).user?.id;
    if (userId == null || userId.isEmpty) {
      state = state.copyWith(error: 'Please sign in to send messages.');
      return;
    }

    final optimisticMessage = ChatMessage.local(
      senderId: userId,
      receiverId: partnerId,
      content: trimmed,
    );

    state = state.copyWith(
      messages: [...state.messages, optimisticMessage],
      isSending: true,
      clearError: true,
    );

    try {
      final sentMessage = await ref
          .read(chatRepositoryProvider)
          .sendMessage(receiverId: partnerId, content: trimmed);

      state = state.copyWith(
        messages: [
          ...state.messages.where(
            (message) => message.id != optimisticMessage.id,
          ),
          sentMessage,
        ],
        isSending: false,
        clearError: true,
      );
      ref.invalidate(chatConversationsProvider);
    } catch (error) {
      state = state.copyWith(
        messages: state.messages
            .where((message) => message.id != optimisticMessage.id)
            .toList(),
        isSending: false,
        error: _readError(error),
      );
    }
  }

  String _readError(Object error) {
    return error.toString().replaceFirst('Exception: ', '');
  }
}

final chatThreadProvider =
    StateNotifierProvider.family<ChatThreadNotifier, ChatThreadState, String>((
      ref,
      partnerId,
    ) {
      return ChatThreadNotifier(ref, partnerId);
    });
