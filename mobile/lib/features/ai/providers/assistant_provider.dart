import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../prediction/repositories/ai_repository.dart';

class AssistantMessage {
  const AssistantMessage({required this.role, required this.text});

  final String role;
  final String text;

  Map<String, String> toJson() => {'role': role, 'parts': text};
}

class AssistantState {
  const AssistantState({
    this.messages = const [],
    this.isLoading = false,
    this.error,
  });

  final List<AssistantMessage> messages;
  final bool isLoading;
  final String? error;

  AssistantState copyWith({
    List<AssistantMessage>? messages,
    bool? isLoading,
    String? error,
  }) {
    return AssistantState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AssistantNotifier extends StateNotifier<AssistantState> {
  AssistantNotifier(this.ref) : super(const AssistantState());

  final Ref ref;

  Future<void> sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || state.isLoading) return;

    final history = state.messages.map((message) => message.toJson()).toList();
    final nextMessages = [
      ...state.messages,
      AssistantMessage(role: 'user', text: trimmed),
    ];
    state = state.copyWith(
      messages: nextMessages,
      isLoading: true,
      error: null,
    );

    try {
      final response = await ref
          .read(aiRepositoryProvider)
          .sendAssistantMessage(message: trimmed, history: history);

      state = state.copyWith(
        messages: [
          ...nextMessages,
          AssistantMessage(role: 'model', text: response),
        ],
        isLoading: false,
        error: null,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  void clear() {
    state = const AssistantState();
  }
}

final assistantProvider =
    StateNotifierProvider<AssistantNotifier, AssistantState>((ref) {
      return AssistantNotifier(ref);
    });

final aiInsightsProvider = FutureProvider<dynamic>((ref) async {
  final user = ref.watch(authProvider).user;
  if (user == null) {
    return null;
  }
  return ref.watch(aiRepositoryProvider).getExplanationData(user.id);
});
