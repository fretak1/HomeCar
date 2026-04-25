import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/widgets/glass_card.dart';
import '../applications/providers/application_provider.dart';
import '../auth/models/user_model.dart';
import '../auth/providers/auth_provider.dart';
import '../auth/widgets/web_auth_widgets.dart';
import '../favorites/providers/favorite_provider.dart';
import '../leases/providers/lease_provider.dart';
import '../maintenance/providers/maintenance_provider.dart';
import '../notifications/providers/notification_provider.dart';
import '../transactions/providers/transaction_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  late final TextEditingController _kidsController;
  String? _selectedMarriageStatus;
  String? _selectedGender;
  String? _selectedEmploymentStatus;
  
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
   final _confirmPasswordController = TextEditingController();
  String? _profileImagePath;
  bool _isInitializedWithUser = false;

  @override
  void initState() {
    super.initState();
    _initControllers();
  }

  void _initControllers() {
    final user = ref.read(authProvider).user;
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
    _kidsController = TextEditingController();
    _updateControllersFromUser(user);
  }

  void _updateControllersFromUser(UserModel? user) {
    if (user == null) return;
    _nameController.text = user.name;
    _emailController.text = user.email;
    _phoneController.text = user.phoneNumber ?? '';
    _kidsController.text = user.kids?.toString() ?? '';
    
    // Normalize dropdown values to match items
    if (user.marriageStatus != null) {
      final status = user.marriageStatus!.toLowerCase();
      if (status == 'married') _selectedMarriageStatus = 'Married';
      else if (status == 'unmarried') _selectedMarriageStatus = 'Unmarried';
    }
    
    if (user.gender != null) {
      final g = user.gender!.toLowerCase();
      if (g == 'male') _selectedGender = 'Male';
      else if (g == 'female') _selectedGender = 'Female';
    }

    if (user.employmentStatus != null) {
      final e = user.employmentStatus!.toLowerCase();
      const options = ['Student', 'Employee', 'Self-employed', 'Unemployed'];
      for (final opt in options) {
        if (opt.toLowerCase() == e) {
          _selectedEmploymentStatus = opt;
          break;
        }
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _kidsController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final authState = ref.watch(authProvider);
    final user = authState.user;

    // Listen for user updates to refresh controllers
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (previous?.user != next.user && next.user != null) {
        setState(() => _updateControllersFromUser(next.user));
      }
    });

    if (user == null) {
      _isInitializedWithUser = false; // Reset if they log out
      return _NotLoggedInView(embedded: widget.embedded);
    }

    // One-time initialization when user becomes available
    if (!_isInitializedWithUser) {
      _updateControllersFromUser(user);
      _isInitializedWithUser = true;
    }

    final body = Container(
      color: const Color(0xFFF8FAFC),
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        children: [
          // Header Summary Card (Optional, keeping it brief to match web overview)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: AppTheme.primary,
                        shape: BoxShape.circle,
                      ),
                      child: CircleAvatar(
                        radius: 36,
                        backgroundColor: Colors.white,
                        backgroundImage: user.profileImage != null
                            ? CachedNetworkImageProvider(user.profileImage!)
                            : null,
                        child: user.profileImage == null
                            ? Text(
                                user.name.isNotEmpty
                                    ? user.name[0].toUpperCase()
                                    : 'U',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.primary,
                                ),
                              )
                            : null,
                      ),
                    ),
                    GestureDetector(
                      onTap: _pickImage,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: AppTheme.primary,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black26,
                              blurRadius: 4,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.camera_alt_rounded,
                          size: 14,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.name,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.foreground,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user.email,
                        style: const TextStyle(
                          color: AppTheme.mutedForeground,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text(
                          user.role.toUpperCase(),
                          style: const TextStyle(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.w900,
                            fontSize: 9,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.logout_rounded, color: Colors.redAccent, size: 20),
                  onPressed: () async {
                    await ref.read(authProvider.notifier).logout();
                    if (context.mounted) context.go('/home');
                  },
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),

          // Main Personal Information Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Personal Information',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Update your public profile and login email.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.mutedForeground,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 24),
                
                AuthFieldLabelLight('FULL NAME'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _nameController,
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.foreground),
                  decoration: authInputDecoration(
                    hintText: 'Your Name',
                    prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                  ),
                ),
                const SizedBox(height: 20),
                
                AuthFieldLabelLight('EMAIL ADDRESS'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.foreground),
                  decoration: authInputDecoration(
                    hintText: 'your@email.com',
                    prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Note: Changing your email will update your login credentials.',
                  style: TextStyle(
                    color: Color(0xFF9A6D1F),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 20),
                
                AuthFieldLabelLight('PHONE NUMBER'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.foreground),
                  decoration: authInputDecoration(hintText: '+251...'),
                ),
                const SizedBox(height: 20),

                AuthFieldLabelLight('GENDER'),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedGender,
                  hint: const Text('Gender', style: TextStyle(fontSize: 14, color: AppTheme.mutedForeground, fontWeight: FontWeight.w500)),
                  items: ['Male', 'Female']
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedGender = v),
                  decoration: authInputDecoration(),
                  style: const TextStyle(color: AppTheme.foreground, fontWeight: FontWeight.w700),
                  dropdownColor: Colors.white,
                  icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 20),
                  isExpanded: true,
                ),
                const SizedBox(height: 20),

                AuthFieldLabelLight('MARRIAGE STATUS'),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedMarriageStatus,
                  hint: const Text('Status', style: TextStyle(fontSize: 14, color: AppTheme.mutedForeground, fontWeight: FontWeight.w500)),
                  items: ['Unmarried', 'Married']
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedMarriageStatus = v),
                  decoration: authInputDecoration(),
                  style: const TextStyle(color: AppTheme.foreground, fontWeight: FontWeight.w700),
                  dropdownColor: Colors.white,
                  icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 20),
                  isExpanded: true,
                ),
                const SizedBox(height: 20),

                AuthFieldLabelLight('KIDS'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _kidsController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.foreground),
                  decoration: authInputDecoration(hintText: '0'),
                ),
                const SizedBox(height: 20),
                
                AuthFieldLabelLight('EMPLOYMENT STATUS'),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedEmploymentStatus,
                  hint: const Text('Employment', style: TextStyle(fontSize: 14, color: AppTheme.mutedForeground, fontWeight: FontWeight.w500)),
                  items: ['Student', 'Employee', 'Self-employed', 'Unemployed']
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedEmploymentStatus = v),
                  decoration: authInputDecoration(),
                  style: const TextStyle(color: AppTheme.foreground, fontWeight: FontWeight.w700),
                  dropdownColor: Colors.white,
                  icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 20),
                  isExpanded: true,
                ),
                
                const SizedBox(height: 32),
                const Divider(height: 1, color: AppTheme.border),
                const SizedBox(height: 32),
                
                AuthFieldLabelLight('CURRENT PASSWORD'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _currentPasswordController,
                  obscureText: true,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                  decoration: authInputDecoration(
                    hintText: '••••••••',
                    prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                  ),
                ),
                const SizedBox(height: 20),
                
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: AuthFieldLabelLight('NEW PASSWORD'),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _newPasswordController,
                            obscureText: true,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                            decoration: authInputDecoration(
                              hintText: '••••••••',
                              prefixIcon: const Icon(Icons.shield_outlined, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: AuthFieldLabelLight('CONFIRM NEW PASSWORD'),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _confirmPasswordController,
                            obscureText: true,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                            decoration: authInputDecoration(
                              hintText: '••••••••',
                              prefixIcon: const Icon(Icons.shield_outlined, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 32),
                
                Align(
                  alignment: Alignment.centerRight,
                  child: SizedBox(
                    height: 50,
                    child: FilledButton.icon(
                      onPressed: authState.isLoading ? null : _save,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                      ),
                      icon: authState.isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.save_as_rounded, size: 18, color: Colors.white),
                      label: const Text(
                        'Save Changes',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Colors.white),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          if (authState.error != null && authState.error!.isNotEmpty) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.red.withOpacity(0.1)),
              ),
              child: Text(
                authState.error!.replaceFirst('Exception: ', ''),
                style: const TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
          ],
          
          const SizedBox(height: 60),
        ],
      ),
    );

    if (widget.embedded) return body;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        centerTitle: true,
        title: const Text(
          'My Profile',
          style: TextStyle(
            color: AppTheme.foreground,
            fontWeight: FontWeight.w900,
            fontSize: 18,
          ),
        ),
      ),
      body: body,
    );
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    setState(() => _profileImagePath = file.path);
  }

  Future<void> _save() async {
    final newPassword = _newPasswordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();
    if (newPassword.isNotEmpty && newPassword != confirmPassword) {
      _showMessage('The new password and confirmation do not match.');
      return;
    }

    try {
      final user = ref.read(authProvider).user;
      final currentEmail = user?.email ?? '';
      final newEmail = _emailController.text.trim();

      await ref.read(authProvider.notifier).updateProfile(
            name: _nameController.text.trim(),
            email: newEmail != currentEmail ? newEmail : null,
            phoneNumber: _phoneController.text.trim(),
            marriageStatus: _selectedMarriageStatus,
            kids: int.tryParse(_kidsController.text.trim()),
            gender: _selectedGender,
            employmentStatus: _selectedEmploymentStatus,
            currentPassword: _currentPasswordController.text.trim(),
            newPassword: newPassword,
            profileImagePath: _profileImagePath,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Profile updated successfully.'),
          backgroundColor: AppTheme.primary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}

class _NotLoggedInView extends ConsumerWidget {
  const _NotLoggedInView({required this.embedded});

  final bool embedded;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;

    final content = Container(
      color: const Color(0xFFF8FAFC),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    height: 80,
                    width: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: const Icon(
                      Icons.person_rounded,
                      size: 40,
                      color: AppTheme.primary,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    l10n.profile,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.foreground,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Access your professional real estate portal. Sign in to manage listings, leases, and AI insights.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.6,
                      color: AppTheme.mutedForeground,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: FilledButton(
                      onPressed: () => context.go('/login'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        l10n.login.toUpperCase(),
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton(
                      onPressed: () => context.go('/signup'),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: AppTheme.primary.withOpacity(0.2),
                          width: 2,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        l10n.signup.toUpperCase(),
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    if (embedded) return content;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        title: Text(
          l10n.profile,
          style: const TextStyle(
            color: AppTheme.foreground,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
      body: content,
    );
  }
}

