import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../models/property_model.dart';
import 'listing_card.dart';

class SectionBlock extends StatelessWidget {
  const SectionBlock({
    super.key,
    required this.title,
    required this.child,
    this.highlight,
    this.subtitle,
    this.actionLabel,
    this.onAction,
    this.plainTitle = false,
    this.gradientBand = false,
    this.borderBottom = false,
  });

  final String title;
  final String? highlight;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget child;
  final bool plainTitle;
  final bool gradientBand;
  final bool borderBottom;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: gradientBand ? const Color(0xFFF1F5F9) : Colors.white,
        gradient: null,
        border: borderBottom
            ? const Border(bottom: BorderSide(color: AppTheme.border))
            : null,
      ),
      padding: const EdgeInsets.symmetric(vertical: 64),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (plainTitle)
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                      ),
                    ),
                  )
                else
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: RichText(
                      text: TextSpan(
                        style: const TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.foreground,
                          letterSpacing: -0.8,
                        ),
                        children: [
                          TextSpan(text: '$title '),
                          if (highlight != null)
                            TextSpan(
                              text: highlight,
                              style: const TextStyle(
                                color: AppTheme.primary,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                if (actionLabel != null) ...[
                  const SizedBox(height: 6),
                  TextButton.icon(
                    onPressed: onAction,
                    icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                    label: Text(
                      actionLabel!,
                      maxLines: 1,
                      softWrap: false,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    style: TextButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 0,
                        vertical: 4,
                      ),
                    ),
                  ),
                ],
                if (subtitle != null) ...[
                  const SizedBox(height: 12),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      subtitle!,
                      style: const TextStyle(
                        fontSize: 17,
                        color: AppTheme.mutedForeground,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 40),
          child,
        ],
      ),
    );
  }
}

class ListingRail extends StatefulWidget {
  const ListingRail({
    super.key,
    required this.items,
    this.viewportFraction = 1.0,
    this.gap = 0.0,
  });

  final List<PropertyModel> items;
  final double viewportFraction;
  final double gap;

  @override
  State<ListingRail> createState() => _ListingRailState();
}

class _ListingRailState extends State<ListingRail> {
  late PageController _controller;
  int _currentIndex = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _controller = PageController(viewportFraction: widget.viewportFraction);
    _startAutoSlide();
  }

  void _startAutoSlide() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 8), (timer) {
      if (!mounted) return;
      if (widget.items.length <= 1) return;

      final next = (_currentIndex + 1) % widget.items.length;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 1200),
        curve: Curves.easeInOutQuart,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: 408,
      child: PageView.builder(
        controller: _controller,
        padEnds: widget.viewportFraction < 1,
        clipBehavior: Clip.none,
        itemCount: widget.items.length,
        onPageChanged: (index) {
          _currentIndex = index;
        },
        itemBuilder: (context, index) {
          final isSingleCard = widget.viewportFraction == 1.0;
          return Padding(
            padding: EdgeInsets.symmetric(
              horizontal: isSingleCard ? 24 : 0,
            ).copyWith(
              right: isSingleCard ? 24 : widget.gap,
            ),
            child: ListingCard(property: widget.items[index]),
          );
        },
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    required this.message,
    required this.button,
    required this.icon,
    required this.onAction,
    this.secondaryStyle = false,
    this.outlinedAction = false,
  });

  final String title;
  final String message;
  final String button;
  final IconData icon;
  final VoidCallback onAction;
  final bool secondaryStyle;
  final bool outlinedAction;

  @override
  Widget build(BuildContext context) {
    final backgroundColor = secondaryStyle
        ? Colors.white.withOpacity(0.5)
        : AppTheme.muted.withOpacity(0.2);
    final borderColor = AppTheme.border.withOpacity(0.6);
    final iconBackground = secondaryStyle
        ? AppTheme.muted.withOpacity(0.5)
        : AppTheme.muted;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: borderColor),
        boxShadow: secondaryStyle
            ? const [
                BoxShadow(
                  color: Color(0x0F000000),
                  blurRadius: 18,
                  offset: Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: iconBackground,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppTheme.mutedForeground, size: 40),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                height: 1.6,
              ),
            ),
          ),
          const SizedBox(height: 28),
          outlinedAction
              ? OutlinedButton(
                  onPressed: onAction,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.secondary,
                    side: BorderSide(
                      color: AppTheme.secondary.withOpacity(0.2),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 28,
                      vertical: 16,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  child: Text(button),
                )
              : FilledButton(
                  onPressed: onAction,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 28,
                      vertical: 16,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  child: Text(button),
                ),
        ],
      ),
    );
  }
}

