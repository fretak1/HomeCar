import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../auth/providers/auth_provider.dart';

class AgentVerificationScreen extends ConsumerStatefulWidget {
  const AgentVerificationScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<AgentVerificationScreen> createState() =>
      _AgentVerificationScreenState();
}

class _AgentVerificationScreenState
    extends ConsumerState<AgentVerificationScreen> {
  String? _licensePath;
  String? _selfiePath;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    if (user == null || !user.isAgent) {
      return const Scaffold(
        body: Center(child: Text('Only agents can access verification.')),
      );
    }

    final statusLabel = user.verified
        ? 'Verified'
        : user.isAgentVerificationRejected
        ? 'Rejected'
        : user.isAgentVerificationPending
        ? 'Pending Review'
        : 'Not Submitted';

    return Scaffold(
      appBar: AppBar(title: const Text('Agent Verification')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    user.verified
                        ? Icons.verified_user_outlined
                        : Icons.shield_outlined,
                    color: user.verified
                        ? const Color(0xFF34D399)
                        : AppTheme.secondary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Status: $statusLabel',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          user.verified
                              ? 'Your agent identity has been verified.'
                              : user.isAgentVerificationRejected
                              ? 'Your previous submission was rejected. Update the files below and resubmit.'
                              : 'Upload your license and a clear selfie so admins can review your account.',
                          style: const TextStyle(
                            color: Colors.white70,
                            height: 1.45,
                          ),
                        ),
                        if (user.isAgentVerificationRejected) ...[
                          const SizedBox(height: 8),
                          Text(
                            user.rejectionReason!,
                            style: const TextStyle(color: Colors.redAccent),
                          ),
                        ],
                      ],
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
                    'Required Files',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  _UploadTile(
                    title: 'Professional license',
                    subtitle: _licensePath == null
                        ? 'PDF, JPG, or PNG'
                        : _fileName(_licensePath!),
                    icon: Icons.badge_outlined,
                    onTap: _pickLicense,
                  ),
                  const SizedBox(height: 14),
                  _UploadTile(
                    title: 'Selfie',
                    subtitle: _selfiePath == null
                        ? 'Take a clear selfie photo'
                        : _fileName(_selfiePath!),
                    icon: Icons.camera_alt_outlined,
                    onTap: _pickSelfie,
                  ),
                  if (_selfiePath != null) ...[
                    const SizedBox(height: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Image.file(
                        File(_selfiePath!),
                        height: 180,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (authState.error != null && authState.error!.isNotEmpty) ...[
              const SizedBox(height: 14),
              Text(
                authState.error!.replaceFirst('Exception: ', ''),
                style: const TextStyle(color: Colors.redAccent),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: authState.isLoading || user.verified
                    ? null
                    : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.secondary,
                  foregroundColor: AppTheme.darkBackground,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: authState.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        user.verified
                            ? 'Already Verified'
                            : 'Submit Verification',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickLicense() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'jpg', 'jpeg', 'png'],
    );
    if (result == null ||
        result.files.isEmpty ||
        result.files.first.path == null) {
      return;
    }
    setState(() => _licensePath = result.files.first.path!);
  }

  Future<void> _pickSelfie() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85,
    );
    if (file == null) return;
    setState(() => _selfiePath = file.path);
  }

  Future<void> _submit() async {
    if (_licensePath == null || _selfiePath == null) {
      _showMessage('Upload both your license and your selfie first.');
      return;
    }

    try {
      await ref
          .read(authProvider.notifier)
          .submitAgentVerification(
            licensePath: _licensePath!,
            selfiePath: _selfiePath!,
          );
      await ref.read(authProvider.notifier).refreshCurrentUser();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verification submitted successfully.')),
      );
    } catch (error) {
      if (!mounted) return;
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  String _fileName(String path) => path.split(Platform.pathSeparator).last;

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _UploadTile extends StatelessWidget {
  const _UploadTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Ink(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white10),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppTheme.secondary),
            const SizedBox(width: 12),
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
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white38),
          ],
        ),
      ),
    );
  }
}

