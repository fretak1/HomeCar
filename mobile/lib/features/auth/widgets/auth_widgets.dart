import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import 'web_auth_widgets.dart';

/// HomeCar logo with icon + wordmark – used on all auth screens
class AuthLogo extends StatelessWidget {
  const AuthLogo({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const BrandLogo(height: 48);
  }
}

/// Small uppercase label used above each text field
class AuthFieldLabel extends StatelessWidget {
  final String text;
  const AuthFieldLabel(this.text, {Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        color: Colors.white54,
        fontSize: 10,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
    );
  }
}

