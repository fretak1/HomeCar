import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import 'models/chat_model.dart';
import 'providers/chat_provider.dart';

class ChatListScreen extends ConsumerStatefulWidget {
  const ChatListScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends ConsumerState<ChatListScreen> {
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _refreshTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      if (mounted) {
        ref.invalidate(chatConversationsProvider);
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final conversationsAsync = ref.watch(chatConversationsProvider);

    final content = conversationsAsync.when(
        data: (conversations) {
          if (conversations.isEmpty) {
            return RefreshIndicator(
              onRefresh: () => ref.refresh(chatConversationsProvider.future),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                children: [
                  const SizedBox(height: 80),
                  _InboxStatus(
                    icon: Icons.mark_chat_unread_outlined,
                    title: 'No conversations yet',
                    message:
                        'Start from any listing and message the owner or agent directly.',
                    actionLabel: 'Explore Listings',
                    onAction: () => context.go('/explore'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(chatConversationsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
              itemCount: conversations.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final conversation = conversations[index];
                return _ConversationCard(conversation: conversation);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 80),
            _InboxStatus(
              icon: Icons.error_outline,
              title: 'Inbox unavailable',
              message: error.toString().replaceFirst('Exception: ', ''),
              actionLabel: 'Retry',
              onAction: () => ref.invalidate(chatConversationsProvider),
            ),
          ],
        ),
      );

    if (widget.embedded) return content;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inbox'),
        actions: [
          IconButton(
            onPressed: () => ref.invalidate(chatConversationsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: content,
    );
  }
}

class _ConversationCard extends StatelessWidget {
  const _ConversationCard({required this.conversation});

  final ChatConversation conversation;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: () => context.push(
        '/inbox/thread/${conversation.partnerId}',
        extra: {
          'name': conversation.partnerName,
          'image': conversation.partnerImage,
        },
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          _ConversationAvatar(
            name: conversation.partnerName,
            imageUrl: conversation.partnerImage,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        conversation.partnerName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatConversationTime(conversation.timestamp),
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        conversation.lastMessage.isEmpty
                            ? 'Conversation started'
                            : conversation.lastMessage,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: conversation.unread > 0
                              ? Colors.white
                              : Colors.white70,
                          fontWeight: conversation.unread > 0
                              ? FontWeight.w600
                              : FontWeight.w400,
                          height: 1.4,
                        ),
                      ),
                    ),
                    if (conversation.unread > 0) ...[
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.secondary,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          conversation.unread > 99
                              ? '99+'
                              : '${conversation.unread}',
                          style: const TextStyle(
                            color: AppTheme.darkBackground,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ConversationAvatar extends StatelessWidget {
  const _ConversationAvatar({required this.name, this.imageUrl});

  final String name;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final trimmedImage = imageUrl?.trim();
    return CircleAvatar(
      radius: 26,
      backgroundColor: Colors.white12,
      backgroundImage: trimmedImage != null && trimmedImage.isNotEmpty
          ? CachedNetworkImageProvider(trimmedImage)
          : null,
      child: trimmedImage == null || trimmedImage.isEmpty
          ? Text(
              name.isEmpty ? '?' : name.characters.first.toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            )
          : null,
    );
  }
}

class _InboxStatus extends StatelessWidget {
  const _InboxStatus({
    required this.icon,
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(icon, color: AppTheme.secondary, size: 42),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, height: 1.5),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onAction,
              child: Text(actionLabel),
            ),
          ),
        ],
      ),
    );
  }
}

String _formatConversationTime(DateTime timestamp) {
  final now = DateTime.now();
  final difference = now.difference(timestamp);
  if (difference.inDays <= 0) {
    final hour = timestamp.hour.toString().padLeft(2, '0');
    final minute = timestamp.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  if (difference.inDays < 7) {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return weekdays[timestamp.weekday - 1];
  }

  return '${timestamp.day}/${timestamp.month}';
}
