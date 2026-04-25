import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class AuthPageScaffold extends StatelessWidget {
  const AuthPageScaffold({
    super.key,
    required this.formCard,
    required this.imageUrl,
    required this.badgeText,
    required this.headline,
    required this.description,
    this.points = const [],
    this.imageOnLeft = true,
    this.maxWidth = 1100,
  });

  final Widget formCard;
  final String imageUrl;
  final String badgeText;
  final String headline;
  final String description;
  final List<String> points;
  final bool imageOnLeft;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppTheme.muted.withOpacity(0.3),
              AppTheme.background,
              AppTheme.muted.withOpacity(0.2),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: maxWidth),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final wide = constraints.maxWidth >= 1024;
                    final imagePanel = _AuthImagePanel(
                      imageUrl: imageUrl,
                      badgeText: badgeText,
                      headline: headline,
                      description: description,
                      points: points,
                    );

                    if (!wide) {
                      return formCard;
                    }

                    final children = imageOnLeft
                        ? <Widget>[
                            Expanded(child: imagePanel),
                            const SizedBox(width: 32),
                            Flexible(flex: 9, child: formCard),
                          ]
                        : <Widget>[
                            Flexible(flex: 11, child: formCard),
                            const SizedBox(width: 24),
                            Expanded(child: imagePanel),
                          ];

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: children,
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AuthFormCard extends StatelessWidget {
  const AuthFormCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(32),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x18000000),
            blurRadius: 30,
            offset: Offset(0, 18),
          ),
        ],
      ),
      child: child,
    );
  }
}

class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.height = 48});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/brand/e.png',
      height: height,
      fit: BoxFit.contain,
    );
  }
}

class AuthFieldLabelLight extends StatelessWidget {
  const AuthFieldLabelLight(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        color: AppTheme.mutedForeground,
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.2,
      ),
    );
  }
}

InputDecoration authInputDecoration({
  String hintText = '',
  Widget? prefixIcon,
  Widget? suffixIcon,
}) {
  return InputDecoration(
    hintText: hintText,
    hintStyle: const TextStyle(
      color: AppTheme.mutedForeground,
      fontSize: 14,
      fontWeight: FontWeight.w500,
    ),
    prefixIcon: prefixIcon,
    suffixIcon: suffixIcon,
    prefixIconColor: AppTheme.mutedForeground,
    suffixIconColor: AppTheme.mutedForeground,
    filled: true,
    fillColor: AppTheme.muted.withOpacity(0.2),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: AppTheme.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: AppTheme.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: AppTheme.primary, width: 1.2),
    ),
    errorStyle: const TextStyle(color: Colors.redAccent),
  );
}

class AuthSocialDivider extends StatelessWidget {
  const AuthSocialDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppTheme.border)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'OR CONTINUE WITH',
            style: TextStyle(
              color: AppTheme.mutedForeground.withOpacity(0.9),
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
          ),
        ),
        const Expanded(child: Divider(color: AppTheme.border)),
      ],
    );
  }
}

class ContinueWithGoogleButton extends StatelessWidget {
  const ContinueWithGoogleButton({
    super.key,
    required this.onPressed,
  });

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 46,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppTheme.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        icon: const _GoogleBadge(),
        label: const Text(
          'Continue with Google',
          style: TextStyle(
            color: AppTheme.foreground,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _GoogleBadge extends StatelessWidget {
  const _GoogleBadge();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(
        painter: _GoogleLogoPainter(),
      ),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  static const _pi = 3.14159265358979;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2;

    // 1) White background
    canvas.drawCircle(center, r, Paint()..color = Colors.white);

    // Ring geometry: outer=95%, inner=45% of radius
    final outerR = r * 0.95;
    final innerR = r * 0.45;
    final midR = (outerR + innerR) / 2;
    final strokeW = outerR - innerR;
    final arcRect = Rect.fromCircle(center: center, radius: midR);

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.butt;

    // Angles (Flutter canvas: 0=right/3-o'clock, clockwise positive)
    // Red  : top-left, from -150° to -30°  (span 120°)
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(arcRect, -5 * _pi / 6, 2 * _pi / 3, false, paint);

    // Blue : top-right/right, from -30° to 15°  (span 45°)
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(arcRect, -_pi / 6, _pi / 4, false, paint);

    // Green: bottom-right, from 15° to 150°  (span 135°)
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(arcRect, _pi / 12, 3 * _pi / 4, false, paint);

    // Yellow: bottom-left, from 150° to 210°  (span 60°)
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(arcRect, 5 * _pi / 6, _pi / 3, false, paint);

    // 2) White gap: carve out the G opening on the right (15° to -30°)
    //    We punch a white rect over the right-center gap area
    final gapHalf = strokeW / 2 + 0.5;
    canvas.drawRect(
      Rect.fromLTRB(center.dx, center.dy - gapHalf, size.width + 1, center.dy + gapHalf),
      Paint()..color = Colors.white,
    );

    // 3) Blue horizontal G-bar from center to right
    final barHalf = strokeW * 0.38;
    canvas.drawRect(
      Rect.fromLTRB(center.dx, center.dy - barHalf, size.width * 0.91, center.dy + barHalf),
      Paint()
        ..color = const Color(0xFF4285F4)
        ..style = PaintingStyle.fill,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}



class _AuthImagePanel extends StatelessWidget {
  const _AuthImagePanel({
    required this.imageUrl,
    required this.badgeText,
    required this.headline,
    required this.description,
    required this.points,
  });

  final String imageUrl;
  final String badgeText;
  final String headline;
  final String description;
  final List<String> points;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: Stack(
        fit: StackFit.expand,
        children: [
          CachedNetworkImage(
            imageUrl: imageUrl,
            fit: BoxFit.cover,
            placeholder: (context, url) =>
                Container(color: AppTheme.muted.withOpacity(0.6)),
            errorWidget: (context, url, error) =>
                Container(color: AppTheme.muted.withOpacity(0.6)),
          ),
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0x00065F46),
                  Color(0x66065F46),
                  Color(0xE5065F46),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.auto_awesome_rounded,
                      size: 22,
                      color: AppTheme.accent,
                    ),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.accent.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        badgeText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  headline,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    height: 1.15,
                  ),
                ),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    description,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      height: 1.5,
                    ),
                  ),
                ],
                if (points.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  for (final point in points) ...[
                    Row(
                      children: [
                        const Icon(
                          Icons.check_circle_rounded,
                          size: 18,
                          color: AppTheme.accent,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          point,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.92),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

