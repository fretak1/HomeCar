import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/dio_client.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../auth/models/user_model.dart';
import 'providers/admin_provider.dart';

class AdminAgentReviewScreen extends ConsumerWidget {
  const AdminAgentReviewScreen({super.key, required this.userId});

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(adminUserDetailProvider(userId));
    final actionState = ref.watch(adminVerificationProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Agent Verification Review')),
      body: userAsync.when(
        data: (user) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: [
            _AgentHeaderCard(user: user),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Verification Assets',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  _DocumentPreviewCard(
                    title: 'Identity selfie',
                    subtitle: user.verificationPhoto?.isNotEmpty == true
                        ? 'Uploaded by the agent for identity confirmation.'
                        : 'No selfie uploaded yet.',
                    source: user.verificationPhoto,
                    fallbackIcon: Icons.camera_alt_outlined,
                  ),
                  const SizedBox(height: 14),
                  _DocumentPreviewCard(
                    title: 'Professional license',
                    subtitle: user.licenseDocument != null
                        ? 'Tap to review the submitted license file.'
                        : 'No license uploaded yet.',
                    source: user.licenseDocument?.url,
                    fallbackIcon: Icons.badge_outlined,
                    onOpen: user.licenseDocument == null
                        ? null
                        : () => context.push(
                            '/admin/document',
                            extra: {
                              'title': '${user.name} license',
                              'source': user.licenseDocument!.url,
                            },
                          ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Review Decision',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Approve this agent once the selfie and license clearly match the account holder.',
                    style: TextStyle(color: Colors.white70, height: 1.45),
                  ),
                  if (user.rejectionReason?.trim().isNotEmpty == true) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.redAccent.withOpacity(0.25),
                        ),
                      ),
                      child: Text(
                        user.rejectionReason!,
                        style: const TextStyle(color: Colors.redAccent),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: actionState.isLoading || user.verified
                              ? null
                              : () => _verify(context, ref, user, true),
                          child: Text(
                            user.verified ? 'Already Verified' : 'Approve',
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: actionState.isLoading
                              ? null
                              : () => _verify(context, ref, user, false),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.redAccent,
                          ),
                          child: const Text('Reject'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString().replaceFirst('Exception: ', ''),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _verify(
    BuildContext context,
    WidgetRef ref,
    UserModel user,
    bool approved,
  ) async {
    String? reason;
    if (!approved) {
      reason = await _askForReason(
        context,
        'Why are you rejecting this agent?',
      );
      if (!context.mounted || reason == null) {
        return;
      }
    }

    try {
      await ref
          .read(adminVerificationProvider.notifier)
          .verifyUser(
            userId: user.id,
            verified: approved,
            rejectionReason: reason,
          );
      ref.invalidate(adminUsersProvider);
      ref.invalidate(pendingAgentsProvider);
      ref.invalidate(adminUserDetailProvider(user.id));
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Agent ${approved ? 'approved' : 'rejected'}')),
      );
      context.pop();
    } catch (error) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
    }
  }
}

class _AgentHeaderCard extends StatelessWidget {
  const _AgentHeaderCard({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final initials = user.name
        .split(' ')
        .where((part) => part.trim().isNotEmpty)
        .map((part) => part[0].toUpperCase())
        .take(2)
        .join();

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: AppTheme.secondary.withOpacity(0.18),
            backgroundImage: user.profileImage?.isNotEmpty == true
                ? CachedNetworkImageProvider(_resolveSource(user.profileImage!))
                : null,
            child: user.profileImage?.isNotEmpty == true
                ? null
                : Text(
                    initials.isEmpty ? 'A' : initials,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user.name, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 6),
                Text(user.email, style: const TextStyle(color: Colors.white70)),
                if (user.phoneNumber?.trim().isNotEmpty == true) ...[
                  const SizedBox(height: 4),
                  Text(
                    user.phoneNumber!,
                    style: const TextStyle(color: Colors.white54),
                  ),
                ],
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _StatusChip(
                      label: user.verified ? 'Verified' : 'Pending',
                      color: user.verified
                          ? const Color(0xFF34D399)
                          : const Color(0xFFFBBF24),
                    ),
                    _StatusChip(label: user.role, color: AppTheme.secondary),
                    if (user.createdAt != null)
                      _StatusChip(
                        label:
                            'Joined ${user.createdAt!.day}/${user.createdAt!.month}/${user.createdAt!.year}',
                        color: Colors.white70,
                        outlined: true,
                      ),
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

class _DocumentPreviewCard extends StatelessWidget {
  const _DocumentPreviewCard({
    required this.title,
    required this.subtitle,
    required this.fallbackIcon,
    this.source,
    this.onOpen,
  });

  final String title;
  final String subtitle;
  final String? source;
  final IconData fallbackIcon;
  final VoidCallback? onOpen;

  @override
  Widget build(BuildContext context) {
    final hasSource = source?.trim().isNotEmpty == true;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(fallbackIcon, color: AppTheme.secondary),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: Colors.white70,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (hasSource) ...[
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AspectRatio(
                aspectRatio: 16 / 10,
                child: CachedNetworkImage(
                  imageUrl: _resolveSource(source!),
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(
                    color: Colors.white.withOpacity(0.04),
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.description_outlined,
                      color: Colors.white54,
                      size: 40,
                    ),
                  ),
                ),
              ),
            ),
          ],
          if (onOpen != null) ...[
            const SizedBox(height: 14),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton(
                onPressed: onOpen,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Colors.white24),
                ),
                child: const Text('Open Document'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.color,
    this.outlined = false,
  });

  final String label;
  final Color color;
  final bool outlined;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: outlined ? Colors.transparent : color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
        border: outlined ? Border.all(color: Colors.white24) : null,
      ),
      child: Text(
        label,
        style: TextStyle(
          color: outlined ? Colors.white70 : color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

Future<String?> _askForReason(BuildContext context, String title) async {
  final controller = TextEditingController();
  final result = await showDialog<String>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: const Color(0xFF1E293B),
      title: Text(title),
      content: TextField(
        controller: controller,
        minLines: 3,
        maxLines: 5,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: 'Optional rejection reason',
          hintStyle: const TextStyle(color: Colors.white38),
          filled: true,
          fillColor: Colors.white.withOpacity(0.06),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(dialogContext).pop(controller.text),
          child: const Text('Submit'),
        ),
      ],
    ),
  );
  controller.dispose();
  return result;
}

String _resolveSource(String source) {
  if (source.startsWith('http') || source.startsWith('data:')) {
    return source;
  }
  return '${DioClient.baseUrl}$source';
}
