import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/foundation.dart'; // For kIsWeb
import 'package:url_launcher/url_launcher.dart';

import '../../core/utils/web_utils_stub.dart'
    if (dart.library.html) '../../core/utils/web_utils_web.dart';

import '../../core/api/dio_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'widgets/web_auth_widgets.dart';
import 'google_auth_webview.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  static final _strongPasswordRegex =
      RegExp(r'^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$');

  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();

  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _submitting = false;
  String _role = '';

  bool get _has8Characters => _passwordCtrl.text.length >= 8;
  bool get _hasUppercase => RegExp(r'[A-Z]').hasMatch(_passwordCtrl.text);
  bool get _hasNumber => RegExp(r'\d').hasMatch(_passwordCtrl.text);
  bool get _hasSpecial =>
      RegExp(r'[^a-zA-Z0-9]').hasMatch(_passwordCtrl.text);

  @override
  void initState() {
    super.initState();
    _passwordCtrl.addListener(_refresh);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.removeListener(_refresh);
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  void _refresh() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (!_strongPasswordRegex.hasMatch(_passwordCtrl.text)) {
      _showMessage('Password does not meet strength requirements.');
      return;
    }

    if (_passwordCtrl.text != _confirmPasswordCtrl.text) {
      _showMessage('Passwords do not match');
      return;
    }

    if (_role.isEmpty) {
      _showMessage('Please select an account type.');
      return;
    }

    setState(() => _submitting = true);
    try {
      await ref.read(authProvider.notifier).register(
            name: _nameCtrl.text.trim(),
            email: _emailCtrl.text.trim(),
            password: _passwordCtrl.text,
            role: _role,
          );
      if (mounted) {
        _showMessage(
          'Account created! Please enter the verification code sent to your email.',
          success: true,
        );
        // Using a microtask to ensure navigation happens after state propagation
        Future.microtask(() {
          if (mounted) context.go('/verify-email');
        });
      }
    } catch (error) {
      if (mounted) {
        final message = error.toString().toLowerCase();
        if (message.contains('already') || message.contains('exists')) {
          _showMessage('This email is already registered. Please go to Login.');
        } else {
          // Show a dialog for unexpected errors so they are clearly visible
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Registration Error'),
              content: Text(error.toString()),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('OK'),
                ),
              ],
            ),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  void _showMessage(String message, {bool success = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: success ? AppTheme.primary : Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() => _submitting = true);
    try {
      final dio = ref.read(dioClientProvider).dio;
      final callbackPrefix = kIsWeb ? Uri.base.origin : '${DioClient.baseUrl}/';
      
      final response = await dio.post(
        '${ApiPaths.auth}/sign-in/social',
        data: {
          'provider': 'google',
          'callbackURL': callbackPrefix,
        },
      );
      
      final url = response.data['url'] as String?;
      if (url == null) throw Exception('Failed to get Google auth URL');

      if (!mounted) return;
      setState(() => _submitting = false);

      if (kIsWeb) {
        // On Web, force same-tab navigation
        navigateToUrl(url);
      } else if (defaultTargetPlatform == TargetPlatform.windows || defaultTargetPlatform == TargetPlatform.linux || defaultTargetPlatform == TargetPlatform.macOS) {
        // On Desktop, open in browser
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          throw Exception('Could not launch auth URL');
        }
      } else {
        // On Mobile (Android/iOS), use WebView
        final result = await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (context) => GoogleAuthWebviewScreen(
              authUrl: url,
              callbackPrefix: callbackPrefix,
            ),
          ),
        );

        if (result == true && mounted) {
          context.go('/home');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        _showMessage(e.toString().replaceAll('Exception: ', ''));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthPageScaffold(
      imageOnLeft: false,
      maxWidth: 1180,
      imageUrl:
          'https://images.unsplash.com/photo-1609465397944-be1ce3ebda61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvciUyMGRhc2hib2FyZHxlbnwxfHx8fDE3NzAwMDI0NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      badgeText: 'AI-POWERED EXPERIENCE',
      headline: 'Start Your Journey\nToday',
      description: '',
      points: const ['Smart AI recommendations', 'Verified listings'],
      formCard: AuthFormCard(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Center(child: BrandLogo(height: 48)),
            const SizedBox(height: 20),
            const Text(
              'Create Account',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.foreground,
                fontSize: 28,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Join our HomeCar community',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.mutedForeground,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            Form(
              key: _formKey,
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final twoColumns = constraints.maxWidth >= 620;

                  final nameField = _LabeledField(
                    label: 'Full Name',
                    child: TextFormField(
                      controller: _nameCtrl,
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontWeight: FontWeight.w600,
                      ),
                      decoration: authInputDecoration(
                        hintText: 'Enter Your Name',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Name required';
                        }
                        return null;
                      },
                    ),
                  );

                  final emailField = _LabeledField(
                    label: 'Email',
                    child: TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontWeight: FontWeight.w600,
                      ),
                      decoration: authInputDecoration(
                        hintText: 'Enter Your Email',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Email required';
                        }
                        if (!value.contains('@')) {
                          return 'Invalid email';
                        }
                        return null;
                      },
                    ),
                  );

                  final passwordField = _LabeledField(
                    label: 'Password',
                    child: TextFormField(
                      controller: _passwordCtrl,
                      obscureText: !_showPassword,
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontWeight: FontWeight.w600,
                      ),
                      decoration: authInputDecoration(
                        hintText: 'Enter Your Password',
                        suffixIcon: IconButton(
                          onPressed: () {
                            setState(() => _showPassword = !_showPassword);
                          },
                          icon: Icon(
                            _showPassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Password required';
                        }
                        return null;
                      },
                    ),
                  );

                  final confirmField = _LabeledField(
                    label: 'Confirm',
                    child: TextFormField(
                      controller: _confirmPasswordCtrl,
                      obscureText: !_showConfirmPassword,
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontWeight: FontWeight.w600,
                      ),
                      decoration: authInputDecoration(
                        hintText: 'Enter Your Password',
                        suffixIcon: IconButton(
                          onPressed: () {
                            setState(() {
                              _showConfirmPassword = !_showConfirmPassword;
                            });
                          },
                          icon: Icon(
                            _showConfirmPassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Confirmation required';
                        }
                        return null;
                      },
                    ),
                  );

                  final topGrid = twoColumns
                      ? Column(
                          children: [
                            Row(
                              children: [
                                Expanded(child: nameField),
                                const SizedBox(width: 12),
                                Expanded(child: emailField),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(child: passwordField),
                                const SizedBox(width: 12),
                                Expanded(child: confirmField),
                              ],
                            ),
                          ],
                        )
                      : Column(
                          children: [
                            nameField,
                            const SizedBox(height: 12),
                            emailField,
                            const SizedBox(height: 12),
                            passwordField,
                            const SizedBox(height: 12),
                            confirmField,
                          ],
                        );

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      topGrid,
                      if (_passwordCtrl.text.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 12,
                          runSpacing: 6,
                          children: [
                            _PasswordRequirement(
                              label: '8+ Characters',
                              met: _has8Characters,
                            ),
                            _PasswordRequirement(
                              label: 'Uppercase',
                              met: _hasUppercase,
                            ),
                            _PasswordRequirement(
                              label: 'Number',
                              met: _hasNumber,
                            ),
                            _PasswordRequirement(
                              label: 'Special',
                              met: _hasSpecial,
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 14),
                      _LabeledField(
                        label: 'Account Type',
                        child: DropdownButtonFormField<String>(
                          value: _role.isEmpty ? null : _role,
                          dropdownColor: Colors.white,
                          style: const TextStyle(
                            color: AppTheme.foreground,
                            fontWeight: FontWeight.w600,
                          ),
                          decoration: authInputDecoration(
                            hintText: '', // handled by hint widget below
                          ),
                          hint: const Text(
                            'What describes you?',
                            style: TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'CUSTOMER',
                              child: Text('Customer'),
                            ),
                            DropdownMenuItem(
                              value: 'OWNER',
                              child: Text('Owner'),
                            ),
                            DropdownMenuItem(
                              value: 'AGENT',
                              child: Text('Agent'),
                            ),
                          ],
                          onChanged: (value) {
                            setState(() => _role = value ?? '');
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: FilledButton(
                          onPressed:
                              (_submitting ||
                                      !_strongPasswordRegex
                                          .hasMatch(_passwordCtrl.text) ||
                                      _role.isEmpty)
                                  ? null
                                  : _submit,
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor:
                                AppTheme.primary.withOpacity(0.35),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: _submitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text(
                                  'Create Account',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 20),
            const AuthSocialDivider(),
            const SizedBox(height: 14),
            ContinueWithGoogleButton(
              onPressed: _submitting ? () {} : _handleGoogleSignIn,
            ),
            const SizedBox(height: 18),
            RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                style: const TextStyle(
                  color: AppTheme.mutedForeground,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.5,
                ),
                children: [
                  const TextSpan(text: 'ALREADY A MEMBER? '),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.middle,
                    child: GestureDetector(
                      onTap: () => context.go('/login'),
                      child: const Text(
                        'LOG IN',
                        style: TextStyle(
                          color: AppTheme.primary,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.4,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LabeledField extends StatelessWidget {
  const _LabeledField({
    required this.label,
    required this.child,
  });

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AuthFieldLabelLight(label),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}

class _PasswordRequirement extends StatelessWidget {
  const _PasswordRequirement({
    required this.label,
    required this.met,
  });

  final String label;
  final bool met;

  @override
  Widget build(BuildContext context) {
    final color = met ? const Color(0xFF10B981) : const Color(0xFFDC2626);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          met ? Icons.check : Icons.close,
          size: 12,
          color: color,
        ),
        const SizedBox(width: 4),
        Text(
          label.toUpperCase(),
          style: TextStyle(
            color: color,
            fontSize: 9,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.7,
          ),
        ),
      ],
    );
  }
}

