import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/dio_client.dart';
import '../../core/theme/app_theme.dart';
import '../auth/models/user_model.dart';
import '../dashboard/widgets/dashboard_page_scaffold.dart';
import '../dashboard/widgets/dashboard_utils.dart';
import '../dashboard/widgets/role_dashboard_scaffold.dart';
import 'providers/admin_provider.dart';

class AdminAgentReviewScreen extends ConsumerWidget {
  const AdminAgentReviewScreen({super.key, required this.userId});

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(adminUserDetailProvider(userId));
    final actionState = ref.watch(adminVerificationProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            DashboardPageHeader(
              title: 'Verify Agent License',
              subtitle:
                  'Review the agent profile, selfie verification, and license document before approving access.',
              onBack: () => Navigator.of(context).maybePop(),
            ),
            Expanded(
              child: userAsync.when(
                data: (user) => SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1100),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final stacked = constraints.maxWidth < 900;
                          final profile = _AgentProfileColumn(
                            user: user,
                            actionState: actionState,
                            onVerify: (approved) =>
                                _verify(context, ref, user, approved),
                          );
                          final evidence = _AgentEvidenceColumn(user: user);

                          if (stacked) {
                            return Column(
                              children: [
                                profile,
                                const SizedBox(height: 16),
                                evidence,
                              ],
                            );
                          }

                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: profile),
                              const SizedBox(width: 16),
                              Expanded(child: evidence),
                            ],
                          );
                        },
                      ),
                    ),
                  ),
                ),
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: DashboardLoadingState(
                      label: 'Loading agent review...',
                    ),
                  ),
                ),
                error: (error, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: DashboardEmptyState(
                      title: 'Agent review unavailable',
                      message: error.toString().replaceFirst(
                            'Exception: ',
                            '',
                          ),
                    ),
                  ),
                ),
              ),
            ),
          ],
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
      await ref.read(adminVerificationProvider.notifier).verifyUser(
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

class _AgentProfileColumn extends StatelessWidget {
  const _AgentProfileColumn({
    required this.user,
    required this.actionState,
    required this.onVerify,
  });

  final UserModel user;
  final AdminVerificationState actionState;
  final ValueChanged<bool> onVerify;

  @override
  Widget build(BuildContext context) {
    final initials = user.name
        .split(' ')
        .where((part) => part.trim().isNotEmpty)
        .map((part) => part[0].toUpperCase())
        .take(2)
        .join();

    return Column(
      children: [
        DashboardSectionCard(
          child: Column(
            children: [
              CircleAvatar(
                radius: 42,
                backgroundColor: const Color(0xFFE8F3EF),
                backgroundImage: user.profileImage?.isNotEmpty == true
                    ? CachedNetworkImageProvider(_resolveSource(user.profileImage!))
                    : null,
                child: user.profileImage?.isNotEmpty == true
                    ? null
                    : Text(
                        initials.isEmpty ? 'A' : initials,
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
              ),
              const SizedBox(height: 14),
              Text(
                user.name,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppTheme.foreground,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                user.email,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.mutedForeground),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                alignment: WrapAlignment.center,
                children: [
                  DashboardStatusPill(
                    label: user.verified ? 'Verified' : 'Pending review',
                    color: user.verified
                        ? const Color(0xFF059669)
                        : const Color(0xFFD97706),
                  ),
                  DashboardStatusPill(
                    label: prettyDashboardLabel(user.role),
                    color: AppTheme.primary,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  DashboardMetricTile(
                    icon: Icons.badge_outlined,
                    label: prettyDashboardLabel(user.role),
                  ),
                  DashboardMetricTile(
                    icon: Icons.calendar_today_outlined,
                    label: user.createdAt == null
                        ? 'Unknown date'
                        : formatDashboardDate(user.createdAt),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        DashboardSectionCard(
          title: 'Verification decision',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Approve this agent once the selfie and professional license clearly match the account holder.',
                style: TextStyle(
                  color: AppTheme.mutedForeground,
                  height: 1.5,
                ),
              ),
              if (user.rejectionReason?.trim().isNotEmpty == true) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Text(
                    user.rejectionReason!,
                    style: const TextStyle(
                      color: Color(0xFFB91C1C),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              LayoutBuilder(
                builder: (context, constraints) {
                  final stacked = constraints.maxWidth < 460;
                  final approve = FilledButton.icon(
                    onPressed: actionState.isLoading || user.verified
                        ? null
                        : () => onVerify(true),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.check_rounded, size: 18),
                    label: Text(
                      user.verified ? 'Already verified' : 'Approve license',
                    ),
                  );
                  final reject = OutlinedButton.icon(
                    onPressed: actionState.isLoading ? null : () => onVerify(false),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFDC2626),
                      side: const BorderSide(color: Color(0xFFFECACA)),
                    ),
                    icon: const Icon(Icons.close_rounded, size: 18),
                    label: const Text('Reject'),
                  );

                  if (stacked) {
                    return Column(
                      children: [
                        SizedBox(width: double.infinity, child: approve),
                        const SizedBox(height: 12),
                        SizedBox(width: double.infinity, child: reject),
                      ],
                    );
                  }

                  return Row(
                    children: [
                      Expanded(child: approve),
                      const SizedBox(width: 12),
                      Expanded(child: reject),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _AgentEvidenceColumn extends StatelessWidget {
  const _AgentEvidenceColumn({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        DashboardSectionCard(
          title: 'Identity verification selfie',
          child: _PreviewCard(
            source: user.verificationPhoto,
            emptyLabel: 'No verification selfie has been uploaded yet.',
            icon: Icons.camera_alt_outlined,
          ),
        ),
        const SizedBox(height: 16),
        DashboardSectionCard(
          title: 'Professional license document',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _PreviewCard(
                source: user.licenseDocument?.url,
                emptyLabel: 'No professional license document has been uploaded yet.',
                icon: Icons.badge_outlined,
              ),
              if (user.licenseDocument != null) ...[
                const SizedBox(height: 14),
                FilledButton.icon(
                  onPressed: () => context.push(
                    '/admin/document',
                    extra: {
                      'title': '${user.name} license',
                      'source': user.licenseDocument!.url,
                    },
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.open_in_new_rounded, size: 18),
                  label: const Text('Open document'),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _PreviewCard extends StatelessWidget {
  const _PreviewCard({
    required this.source,
    required this.emptyLabel,
    required this.icon,
  });

  final String? source;
  final String emptyLabel;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    if (source?.trim().isEmpty ?? true) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Text(
          emptyLabel,
          style: const TextStyle(color: AppTheme.mutedForeground),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: CachedNetworkImage(
        imageUrl: _resolveSource(source!),
        height: 280,
        width: double.infinity,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => Container(
          height: 240,
          color: const Color(0xFFF8FAFC),
          alignment: Alignment.center,
          child: Icon(icon, color: AppTheme.mutedForeground, size: 38),
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
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Text(title),
      content: TextField(
        controller: controller,
        minLines: 3,
        maxLines: 5,
        decoration: InputDecoration(
          hintText: 'Optional rejection reason',
          filled: true,
          fillColor: AppTheme.inputBackground,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppTheme.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppTheme.border),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(controller.text),
          style: FilledButton.styleFrom(
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
          ),
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

