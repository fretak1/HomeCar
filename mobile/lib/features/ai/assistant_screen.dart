import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import 'providers/assistant_provider.dart';

class AssistantScreen extends ConsumerStatefulWidget {
  const AssistantScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends ConsumerState<AssistantScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final assistantState = ref.watch(assistantProvider);

    ref.listen<AssistantState>(assistantProvider, (previous, next) {
      if (next.messages.length != previous?.messages.length) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOut,
            );
          }
        });
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('HomeCar Assistant'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined),
            onPressed: assistantState.messages.isEmpty
                ? null
                : () => ref.read(assistantProvider.notifier).clear(),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: assistantState.messages.isEmpty
                ? const _AssistantEmptyState()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    itemCount:
                        assistantState.messages.length +
                        (assistantState.isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= assistantState.messages.length) {
                        return const _TypingBubble();
                      }

                      final message = assistantState.messages[index];
                      return _AssistantBubble(message: message);
                    },
                  ),
          ),
          if (assistantState.error != null && assistantState.error!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text(
                assistantState.error!,
                style: const TextStyle(color: Colors.redAccent),
              ),
            ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      minLines: 1,
                      maxLines: 5,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(
                        hintText:
                            'Ask about homes, cars, pricing, or recommendations...',
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.06),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  FilledButton(
                    onPressed: assistantState.isLoading ? null : _send,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      minimumSize: const Size(56, 56),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: assistantState.isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send_outlined),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    await ref.read(assistantProvider.notifier).sendMessage(text);
  }
}

class _AssistantEmptyState extends ConsumerWidget {
  const _AssistantEmptyState();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final suggestions = [
      'Average price for a 3-bedroom apartment in Bole?',
      'Find me a Toyota Vitz with low mileage.',
      'Renting a furnished villa in Old Airport.',
      'How does the price prediction work?',
      'Documents needed to verify ownership?',
    ];

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            GlassCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const Icon(
                    Icons.auto_awesome_outlined,
                    size: 40,
                    color: AppTheme.secondary,
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Ask the HomeCar assistant anything about listings, pricing, neighborhoods, vehicles, or your next steps.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white70, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'QUICK SUGGESTIONS',
              style: TextStyle(
                color: Colors.white38,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 10,
              alignment: WrapAlignment.center,
              children: suggestions.map((text) {
                return ActionChip(
                  backgroundColor: Colors.white.withOpacity(0.05),
                  side: BorderSide(color: Colors.white.withOpacity(0.1)),
                  label: Text(
                    text,
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  onPressed: () {
                    ref.read(assistantProvider.notifier).sendMessage(text);
                  },
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _AssistantBubble extends StatelessWidget {
  const _AssistantBubble({required this.message});

  final AssistantMessage message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == 'user';

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: const BoxConstraints(maxWidth: 320),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isUser ? AppTheme.primary : Colors.white.withOpacity(0.07),
          borderRadius: BorderRadius.circular(18),
        ),
        child: _buildMessageContent(context, isUser),
      ),
    );
  }

  Widget _buildMessageContent(BuildContext context, bool isUser) {
    final text = message.text;
    final textStyle = TextStyle(
      color: isUser ? Colors.white : Colors.white70,
      height: 1.45,
      fontSize: 15,
    );

    // Simple regex to find Markdown links: [Text](URL)
    final linkRegex = RegExp(r'\[([^\]]+)\]\(([^\)]+)\)');
    final matches = linkRegex.allMatches(text);

    if (matches.isEmpty) {
      return Text(text, style: textStyle);
    }

    final List<InlineSpan> spans = [];
    int lastMatchEnd = 0;

    for (final match in matches) {
      // Add text before the match
      if (match.start > lastMatchEnd) {
        spans.add(TextSpan(text: text.substring(lastMatchEnd, match.start)));
      }

      final linkText = match.group(1) ?? '';
      final url = (match.group(2) ?? '').trim();

      spans.add(
        TextSpan(
          text: linkText,
          style: TextStyle(
            color: isUser ? Colors.white : AppTheme.secondary,
            fontWeight: FontWeight.bold,
            decoration: TextDecoration.underline,
            decorationColor: isUser ? Colors.white30 : AppTheme.secondary.withOpacity(0.4),
          ),
          recognizer: TapGestureRecognizer()
            ..onTap = () {
              debugPrint('[ASSISTANT] Link Tapped: $url');
              String path = url;
              if (url.startsWith('nav:')) {
                path = url.replaceFirst('nav:', '');
              }
              if (!path.startsWith('/')) {
                path = '/$path';
              }

              debugPrint('[ASSISTANT] Navigating to: $path');
              try {
                // Check if path is valid or if we need to handle specific logic
                if (path == '/explore' || path == '/home' || path == '/ai' || path == '/profile' || path == '/inbox') {
                  context.go(path);
                } else {
                  context.push(path);
                }
              } catch (e) {
                debugPrint('[ASSISTANT] Navigation error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Could not open link: $path')),
                );
              }
            },
        ),
      );

      lastMatchEnd = match.end;
    }

    // Add remaining text
    if (lastMatchEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastMatchEnd)));
    }
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Text.rich(
        TextSpan(children: spans),
        style: textStyle,
      ),
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.07),
          borderRadius: BorderRadius.circular(18),
        ),
        child: const SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }
}

