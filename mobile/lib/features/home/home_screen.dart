import 'dart:async';
import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../ai/providers/recommendation_provider.dart';
import '../auth/providers/auth_provider.dart';
import '../favorites/providers/favorite_provider.dart';
import '../listings/models/property_model.dart';
import '../listings/providers/filter_provider.dart';
import '../listings/providers/listing_provider.dart';
import '../listings/providers/search_provider.dart';
import '../listings/repositories/listing_repository.dart';

final homeListingsProvider = FutureProvider<List<PropertyModel>>((ref) async {
  final repository = ref.watch(listingRepositoryProvider);
  final results = await Future.wait([
    repository.getProperties(
      assetType: 'HOME',
      extraParams: {'limit': 9},
    ),
    repository.getProperties(
      assetType: 'CAR',
      extraParams: {'limit': 9},
    ),
  ]);

  return [...results[0], ...results[1]];
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _locationController = TextEditingController();
  bool _showCars = false;
  String _listingType = 'rent';
  String _priceRange = 'all';

  static const _heroImage =
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2070';

  @override
  void dispose() {
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(homeListingsProvider);
    ref.invalidate(recommendationProvider);
    await Future.wait([
      ref.read(homeListingsProvider.future),
      ref.read(recommendationProvider.future),
    ]);
  }

  void _search() {
    final city = _locationController.text.trim();
    final bounds = _parsePriceRange(_priceRange);
    ref.read(assetFilterProvider.notifier).state =
        _showCars ? AssetFilter.cars : AssetFilter.homes;
    ref.read(exploreViewModeProvider.notifier).state = ExploreViewMode.list;
    ref.read(filterProvider.notifier).update(
      (_) => FilterState(
        city: city,
        listingType: _listingType,
        priceMin: bounds.$1,
        priceMax: bounds.$2,
      ),
    );
    context.go('/explore');
  }

  (double?, double?) _parsePriceRange(String value) {
    if (value.isEmpty || value == 'all') return (null, null);
    double parseUnit(String raw) {
      final lower = raw.toLowerCase();
      final number = double.tryParse(lower.replaceAll(RegExp(r'[^0-9.]'), ''));
      if (number == null) return 0;
      if (lower.contains('m')) return number * 1000000;
      if (lower.contains('k')) return number * 1000;
      return number;
    }
    if (value.contains('+')) return (parseUnit(value), null);
    final parts = value.split('-');
    if (parts.length != 2) return (null, null);
    return (parseUnit(parts[0]), parseUnit(parts[1]));
  }

  @override
  Widget build(BuildContext context) {
    final recommendationsAsync = ref.watch(recommendationProvider);
    final listingsAsync = ref.watch(homeListingsProvider);
    final currentUser = ref.watch(currentUserProvider);

    final body = SafeArea(
      top: !widget.embedded,
      bottom: false,
      child: RefreshIndicator(
        onRefresh: _refresh,
        color: AppTheme.primary,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 760),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: CachedNetworkImage(
                      imageUrl: _heroImage,
                      fit: BoxFit.cover,
                      placeholder: (context, url) =>
                          Container(color: Colors.black87),
                      errorWidget: (context, url, error) =>
                          Container(color: Colors.black87),
                    ),
                  ),
                  Positioned.fill(
                    child: ColoredBox(
                      color: Colors.black.withValues(alpha: 0.5),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 40, 20, 40),
                    child: Column(
                      children: [
                        const SizedBox(height: 40),
                        const Text(
                          'Find Your Perfect Home or Car',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 40,
                            fontWeight: FontWeight.w900,
                            height: 1.08,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'The AI-powered platform for renting and purchasing properties and vehicles with absolute confidence.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w500,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 28),
                        _HomeSearchCard(
                          showCars: _showCars,
                          listingType: _listingType,
                          priceRange: _priceRange,
                          controller: _locationController,
                          onTabChange: (showCars) => setState(() {
                            _showCars = showCars;
                            _listingType = 'rent';
                            _priceRange = 'all';
                          }),
                          onListingTypeChanged: (value) =>
                              setState(() => _listingType = value),
                          onPriceRangeChanged: (value) =>
                              setState(() => _priceRange = value),
                          onSearch: _search,
                        ),
                        const SizedBox(height: 28),
                        const _FeatureCard(
                          icon: Icons.smart_toy_outlined,
                          color: AppTheme.primary,
                          title: 'AI-Powered Matching',
                          message:
                              'Smart recommendations based on your preferences and behavior',
                        ),
                        const SizedBox(height: 14),
                        const _FeatureCard(
                          icon: Icons.trending_up_rounded,
                          color: AppTheme.secondary,
                          title: 'Price Predictions',
                          message:
                              'AI-powered price predictions to help you make informed decisions',
                        ),
                        const SizedBox(height: 14),
                        const _FeatureCard(
                          icon: Icons.verified_user_outlined,
                          color: AppTheme.accent,
                          title: 'Verified Listings',
                          message:
                              'Safe and verified listings with trusted owners and agents',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            recommendationsAsync.when(
              data: (items) {
                if (items.isEmpty) return const SizedBox.shrink();
                return _SectionBlock(
                  title: 'Recommended for You',
                  subtitle: currentUser != null
                      ? 'Based on your activity and local neighborhood trends.'
                      : 'Discover our top-rated properties and vehicles near you.',
                  actionLabel: 'View All',
                  onAction: () => context.push('/recommendations'),
                  plainTitle: true,
                  gradientBand: true,
                  borderBottom: true,
                  child: _CardRail(items: items),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, stackTrace) => const SizedBox.shrink(),
            ),
            listingsAsync.when(
              data: (items) {
                final homes = items
                    .where((item) => item.isHome)
                    .toList();
                final cars = items
                    .where((item) => item.isCar)
                    .toList();
                return Column(
                  children: [
                    _SectionBlock(
                      title: 'Featured',
                      highlight: 'Homes',
                      subtitle:
                          'Discover our most exceptional residential listings',
                      actionLabel: 'View All Homes',
                      onAction: () {
                        ref.read(assetFilterProvider.notifier).state =
                            AssetFilter.homes;
                        ref.read(exploreViewModeProvider.notifier).state =
                            ExploreViewMode.list;
                        context.go('/explore');
                      },
                      child: homes.isEmpty
                          ? _EmptyState(
                              title: 'No New Properties Yet',
                              message:
                                  "We're constantly adding new verified homes. Check back soon or explore our existing listings.",
                              button: 'Browse All Properties',
                              icon: Icons.home_outlined,
                              onAction: () {
                                ref.read(assetFilterProvider.notifier).state =
                                    AssetFilter.homes;
                                ref.read(exploreViewModeProvider.notifier)
                                    .state = ExploreViewMode.list;
                                context.go('/explore');
                              },
                            )
                          : _CardRail(items: homes),
                    ),
                    _SectionBlock(
                      title: 'Featured',
                      highlight: 'Cars',
                      subtitle:
                          'Premium curated vehicles for performance and style',
                      actionLabel: 'View All Cars',
                      mutedSection: true,
                      borderTop: true,
                      borderBottom: true,
                      onAction: () {
                        ref.read(assetFilterProvider.notifier).state =
                            AssetFilter.cars;
                        ref.read(exploreViewModeProvider.notifier).state =
                            ExploreViewMode.list;
                        context.go('/explore');
                      },
                      child: cars.isEmpty
                          ? _EmptyState(
                              title: 'Exclusive Arrivals Pending',
                              message:
                                  'New premium vehicles are arriving shortly. Stay tuned for the latest additions to our fleet.',
                              button: 'Explore Available Cars',
                              icon: Icons.directions_car_outlined,
                              onAction: () {
                                ref.read(assetFilterProvider.notifier).state =
                                    AssetFilter.cars;
                                ref.read(exploreViewModeProvider.notifier)
                                    .state = ExploreViewMode.list;
                                context.go('/explore');
                              },
                              secondaryStyle: true,
                              outlinedAction: true,
                            )
                          : _CardRail(items: cars),
                    ),
                  ],
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 56),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, stackTrace) => Padding(
                padding: const EdgeInsets.all(24),
                child: Text(error.toString()),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 80),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppTheme.primary,
                    AppTheme.primary.withValues(alpha: 0.92),
                    AppTheme.secondary,
                  ],
                ),
              ),
              child: _PageWidth(
                maxWidth: 896,
                child: Column(
                  children: [
                    const Text(
                      'Ready to Get Started?',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 40,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Join thousands of satisfied customers who found their perfect property or vehicle',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 20,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 32),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isWide = constraints.maxWidth >= 640;
                        final primaryButton = SizedBox(
                          width: isWide ? null : double.infinity,
                          child: FilledButton(
                            onPressed: () => context.push('/add-listing'),
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppTheme.primary,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 28,
                                vertical: 18,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text('List Your Property'),
                          ),
                        );
                        final secondaryButton = SizedBox(
                          width: isWide ? null : double.infinity,
                          child: OutlinedButton(
                            onPressed: () => context.go('/explore'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.primary,
                              side: const BorderSide(color: Colors.white),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 28,
                                vertical: 18,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text('Browse Listings'),
                          ),
                        );

                        if (isWide) {
                          return Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              primaryButton,
                              const SizedBox(width: 16),
                              secondaryButton,
                            ],
                          );
                        }

                        return Column(
                          children: [
                            primaryButton,
                            const SizedBox(height: 12),
                            secondaryButton,
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );

    if (widget.embedded) return body;
    return Scaffold(backgroundColor: AppTheme.background, body: body);
  }
}

class _HomeSearchCard extends StatelessWidget {
  const _HomeSearchCard({
    required this.showCars,
    required this.listingType,
    required this.priceRange,
    required this.controller,
    required this.onTabChange,
    required this.onListingTypeChanged,
    required this.onPriceRangeChanged,
    required this.onSearch,
  });

  final bool showCars;
  final String listingType;
  final String priceRange;
  final TextEditingController controller;
  final ValueChanged<bool> onTabChange;
  final ValueChanged<String> onListingTypeChanged;
  final ValueChanged<String> onPriceRangeChanged;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    final priceOptions = showCars
        ? const [
            ('All Prices', 'all'),
            ('ETB 0 - 500k', '0-500k'),
            ('ETB 500k - 1M', '500k-1m'),
            ('ETB 1M - 3M', '1m-3m'),
            ('ETB 3M+', '3m+'),
          ]
        : const [
            ('All Prices', 'all'),
            ('ETB 0 - 10k', '0-10k'),
            ('ETB 10k - 50k', '10k-50k'),
            ('ETB 50k - 100k', '50k-100k'),
            ('ETB 100k+', '100k+'),
          ];

    final fieldDecoration = InputDecoration(
      filled: true,
      fillColor: AppTheme.inputBackground,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      hintStyle: const TextStyle(
        color: AppTheme.mutedForeground,
        fontSize: 15,
        fontWeight: FontWeight.w500,
      ),
      prefixIconColor: AppTheme.mutedForeground,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppTheme.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppTheme.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppTheme.primary, width: 1.4),
      ),
    );

    const fieldTextStyle = TextStyle(
      color: AppTheme.foreground,
      fontSize: 15,
      fontWeight: FontWeight.w600,
    );

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 30,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(
          canvasColor: Colors.white,
          splashColor: Colors.transparent,
          highlightColor: Colors.transparent,
          textTheme: Theme.of(context).textTheme.apply(
            bodyColor: AppTheme.foreground,
            displayColor: AppTheme.foreground,
          ),
        ),
        child: Column(
          children: [
            Align(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 360),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppTheme.muted,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.all(4),
                  child: Row(
                    children: [
                      Expanded(
                        child: _HeroSearchTab(
                          label: 'Properties',
                          selected: !showCars,
                          onTap: () => onTabChange(false),
                        ),
                      ),
                      Expanded(
                        child: _HeroSearchTab(
                          label: 'Cars',
                          selected: showCars,
                          onTap: () => onTabChange(true),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth >= 960;

                final cityField = TextField(
                  controller: controller,
                  style: fieldTextStyle,
                  cursorColor: AppTheme.primary,
                  decoration: fieldDecoration.copyWith(
                    hintText: 'City',
                    prefixIcon: const Icon(Icons.location_on_outlined),
                  ),
                );

                final listingField = DropdownButtonFormField<String>(
                  initialValue: listingType,
                  style: fieldTextStyle,
                  iconEnabledColor: AppTheme.mutedForeground,
                  dropdownColor: Colors.white,
                  menuMaxHeight: 280,
                  decoration: fieldDecoration.copyWith(
                    prefixIcon: Icon(
                      showCars
                          ? Icons.directions_car_outlined
                          : Icons.home_outlined,
                    ),
                  ),
                  items: [
                    DropdownMenuItem(
                      value: 'rent',
                      child: Text(
                        'For Rent',
                        style: fieldTextStyle,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'buy',
                      child: Text(
                        'For Sale',
                        style: fieldTextStyle,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) onListingTypeChanged(value);
                  },
                );

                final priceField = DropdownButtonFormField<String>(
                  initialValue: priceRange,
                  style: fieldTextStyle,
                  iconEnabledColor: AppTheme.mutedForeground,
                  dropdownColor: Colors.white,
                  menuMaxHeight: 320,
                  decoration: fieldDecoration.copyWith(
                    prefixIcon: const Icon(Icons.candlestick_chart),
                  ),
                  items: priceOptions
                      .map(
                        (option) => DropdownMenuItem(
                          value: option.$2,
                          child: Text(
                            option.$1,
                            style: fieldTextStyle,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value != null) onPriceRangeChanged(value);
                  },
                );

                final searchButton = SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton.icon(
                    onPressed: onSearch,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      textStyle: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    icon: const Icon(Icons.search),
                    label: const Text('Search'),
                  ),
                );

                if (isWide) {
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: cityField),
                      const SizedBox(width: 16),
                      Expanded(child: listingField),
                      const SizedBox(width: 16),
                      Expanded(child: priceField),
                      const SizedBox(width: 16),
                      Expanded(child: searchButton),
                    ],
                  );
                }

                return Column(
                  children: [
                    cityField,
                    const SizedBox(height: 12),
                    listingField,
                    const SizedBox(height: 12),
                    priceField,
                    const SizedBox(height: 14),
                    searchButton,
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroSearchTab extends StatelessWidget {
  const _HeroSearchTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? Colors.white : Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? AppTheme.foreground : AppTheme.mutedForeground,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withValues(alpha: 0.20)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x26000000),
                blurRadius: 28,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                width: 62,
                height: 62,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Icon(icon, color: Colors.white, size: 28),
              ),
              const SizedBox(height: 14),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.75),
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionBlock extends StatelessWidget {
  const _SectionBlock({
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
    required this.child,
    this.highlight,
    this.plainTitle = false,
    this.gradientBand = false,
    this.mutedSection = false,
    this.borderTop = false,
    this.borderBottom = false,
  });

  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;
  final Widget child;
  final String? highlight;
  final bool plainTitle;
  final bool gradientBand;
  final bool mutedSection;
  final bool borderTop;
  final bool borderBottom;

  @override
  Widget build(BuildContext context) {
    final backgroundColor = gradientBand
        ? null
        : mutedSection
        ? const Color(0xFFF7F7F8)
        : Colors.white;

    final backgroundGradient = gradientBand
        ? const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFF3FAF9),
              Color(0xFFF4F5FB),
            ],
          )
        : null;

    return ClipRect(
      child: Container(
        decoration: BoxDecoration(
          color: backgroundColor,
          gradient: backgroundGradient,
          border: Border(
            top: borderTop
                ? BorderSide(color: AppTheme.border.withValues(alpha: 0.4))
                : BorderSide.none,
            bottom: borderBottom
                ? BorderSide(color: AppTheme.border.withValues(alpha: 0.7))
                : BorderSide.none,
          ),
        ),
        child: Stack(
          children: [
            if (gradientBand)
              Positioned(
                top: -190,
                right: -190,
                child: ImageFiltered(
                  imageFilter: ImageFilter.blur(sigmaX: 48, sigmaY: 48),
                  child: Container(
                    width: 384,
                    height: 384,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0xFFF3F7F6),
                    ),
                  ),
                ),
              ),
            _PageWidth(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: gradientBand ? 64 : 96),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isWide = constraints.maxWidth >= 860;
                        final titleWidget = plainTitle || highlight == null
                            ? Text(
                                title,
                                style: const TextStyle(
                                  fontSize: 38,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.foreground,
                                  height: 1.1,
                                ),
                              )
                            : RichText(
                                text: TextSpan(
                                  style: const TextStyle(
                                    fontSize: 38,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.foreground,
                                    height: 1.1,
                                  ),
                                  children: [
                                    TextSpan(text: '$title '),
                                    TextSpan(
                                      text: highlight,
                                      style: const TextStyle(
                                        color: AppTheme.primary,
                                        fontStyle: FontStyle.italic,
                                      ),
                                    ),
                                  ],
                                ),
                              );

                        final action = TextButton.icon(
                          onPressed: onAction,
                          style: TextButton.styleFrom(
                            foregroundColor: AppTheme.foreground,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 18,
                              vertical: 14,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          iconAlignment: IconAlignment.end,
                          icon: const Icon(Icons.arrow_forward, size: 16),
                          label: Text(
                            actionLabel,
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                        );

                        final textColumn = Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            titleWidget,
                            const SizedBox(height: 10),
                            Text(
                              subtitle,
                              style: const TextStyle(
                                color: AppTheme.mutedForeground,
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        );

                        if (isWide) {
                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Expanded(child: textColumn),
                              const SizedBox(width: 20),
                              action,
                            ],
                          );
                        }

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            textColumn,
                            const SizedBox(height: 18),
                            action,
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 48),
                    child,
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PageWidth extends StatelessWidget {
  const _PageWidth({
    required this.child,
    this.maxWidth = 1280,
  });

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: child,
        ),
      ),
    );
  }
}

class _CardRail extends StatelessWidget {
  const _CardRail({required this.items});

  final List<PropertyModel> items;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportFraction = constraints.maxWidth <= 430
            ? 1.0
            : constraints.maxWidth >= 1200
            ? 0.34
            : constraints.maxWidth >= 760
            ? 0.52
            : 0.88;
        final gap = constraints.maxWidth <= 430 ? 0.0 : 24.0;

        return _AutoSlidingRail(
          items: items,
          viewportFraction: viewportFraction,
          gap: gap,
        );
      },
    );
  }
}

class _AutoSlidingRail extends StatefulWidget {
  const _AutoSlidingRail({
    required this.items,
    required this.viewportFraction,
    required this.gap,
  });

  final List<PropertyModel> items;
  final double viewportFraction;
  final double gap;

  @override
  State<_AutoSlidingRail> createState() => _AutoSlidingRailState();
}

class _AutoSlidingRailState extends State<_AutoSlidingRail> {
  late PageController _controller;
  Timer? _timer;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _controller = PageController(viewportFraction: widget.viewportFraction);
    _startAutoSlide();
  }

  @override
  void didUpdateWidget(covariant _AutoSlidingRail oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.viewportFraction != widget.viewportFraction) {
      final initialPage = widget.items.isEmpty
          ? 0
          : (_currentIndex >= widget.items.length ? 0 : _currentIndex);
      _controller.dispose();
      _controller = PageController(
        initialPage: initialPage,
        viewportFraction: widget.viewportFraction,
      );
      _startAutoSlide();
    }

    if (oldWidget.items.length != widget.items.length) {
      if (_currentIndex >= widget.items.length) {
        _currentIndex = 0;
      }
      _startAutoSlide();
    }
  }

  void _startAutoSlide() {
    _timer?.cancel();

    if (widget.items.length <= 1) {
      return;
    }

    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || !_controller.hasClients) {
        return;
      }

      final nextIndex = (_currentIndex + 1) % widget.items.length;
      _controller.animateToPage(
        nextIndex,
        duration: const Duration(milliseconds: 550),
        curve: Curves.easeInOut,
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
            padding: EdgeInsets.only(
              right: isSingleCard ? 0 : widget.gap,
            ),
            child: _HomeCard(property: widget.items[index]),
          );
        },
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
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
        ? Colors.white.withValues(alpha: 0.5)
        : AppTheme.muted.withValues(alpha: 0.2);
    final borderColor = AppTheme.border.withValues(alpha: 0.6);
    final iconBackground = secondaryStyle
        ? AppTheme.muted.withValues(alpha: 0.5)
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
                      color: AppTheme.secondary.withValues(alpha: 0.2),
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

class _HomeCard extends ConsumerWidget {
  const _HomeCard({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    final favoritedIds = ref.watch(favoritedIdsProvider);
    final isFavorited = favoritedIds.contains(property.id);
    final canFavorite = currentUser?.id != property.owner?.id;
    final isRental = property.listingTypes.any(
      (item) => item.toLowerCase().contains('rent'),
    );

    return Card(
      clipBehavior: Clip.antiAlias,
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: AppTheme.border),
      ),
      child: InkWell(
        onTap: () => context.push('/property-detail', extra: property),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 224,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  property.mainImage.isEmpty
                      ? Container(
                          color: AppTheme.muted,
                          child: Icon(
                            property.isHome
                                ? Icons.home_outlined
                                : Icons.directions_car_outlined,
                            size: 48,
                            color: AppTheme.mutedForeground,
                          ),
                        )
                      : CachedNetworkImage(
                          imageUrl: property.mainImage,
                          fit: BoxFit.cover,
                          placeholder: (context, url) =>
                              Container(color: AppTheme.muted),
                          errorWidget: (context, url, error) =>
                              Container(color: AppTheme.muted),
                        ),
                  Positioned(
                    top: 14,
                    left: 14,
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        for (final type in property.listingTypes.take(2))
                          _BadgeChip(text: _formatListingType(type)),
                        if (!property.isVerified)
                          const _BadgeChip(
                            text: 'Pending Verification',
                            background: Color(0xFFFFF3C4),
                            foreground: Color(0xFFB45309),
                          ),
                      ],
                    ),
                  ),
                  if (canFavorite)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: IconButton.filledTonal(
                        onPressed: () {
                          if (currentUser == null) {
                            context.push('/login');
                            return;
                          }
                          ref.read(favoriteProvider.notifier).toggle(property);
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white.withValues(alpha: 0.92),
                        ),
                        icon: Icon(
                          isFavorited ? Icons.favorite : Icons.favorite_border,
                          color: isFavorited
                              ? Colors.redAccent
                              : AppTheme.mutedForeground,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                property.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.foreground,
                                ),
                              ),
                              if (property.isCar)
                                Text(
                                  '${property.brand ?? ''} ${property.model ?? ''} ${property.year ?? ''}'.trim(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: AppTheme.mutedForeground,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Row(
                          children: [
                            const Icon(
                              Icons.star_rounded,
                              color: Color(0xFFFACC15),
                              size: 18,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              property.rating.toStringAsFixed(1),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppTheme.foreground,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 16,
                          color: AppTheme.primary,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            property.locationLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 12,
                      runSpacing: 8,
                      children: property.isHome
                          ? [
                              _spec(Icons.bed_outlined, '${property.bedrooms ?? 0}'),
                              _spec(Icons.bathtub_outlined, '${property.bathrooms ?? 0}'),
                              _spec(
                                Icons.square_foot_outlined,
                                '${(property.area ?? 0).toStringAsFixed(0)} sq ft',
                              ),
                            ]
                          : [
                              _spec(
                                Icons.speed_outlined,
                                '${(property.mileage ?? 0).toStringAsFixed(0)} km',
                              ),
                              _spec(
                                Icons.local_gas_station_outlined,
                                property.fuelType ?? 'N/A',
                              ),
                              _spec(
                                Icons.settings_outlined,
                                property.transmission ?? 'N/A',
                              ),
                            ],
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        const Text(
                          'ETB',
                          style: TextStyle(
                            color: AppTheme.primary,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _formatPrice(property.price),
                          style: const TextStyle(
                            color: AppTheme.primary,
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            height: 1,
                          ),
                        ),
                        if (isRental)
                          Text(
                            property.isHome ? ' /mo' : ' /day',
                            style: const TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 13,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _spec(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppTheme.primary),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(
            color: AppTheme.mutedForeground,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  static String _formatListingType(String raw) {
    return raw
        .replaceAll('_', ' ')
        .split(' ')
        .where((part) => part.isNotEmpty)
        .map(
          (part) => '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}',
        )
        .join(' ');
  }

  static String _formatPrice(double value) {
    final raw = value.toStringAsFixed(0);
    final chars = raw.split('').reversed.toList();
    final buffer = StringBuffer();
    for (var index = 0; index < chars.length; index++) {
      if (index > 0 && index % 3 == 0) buffer.write(',');
      buffer.write(chars[index]);
    }
    return buffer.toString().split('').reversed.join();
  }
}

class _BadgeChip extends StatelessWidget {
  const _BadgeChip({
    required this.text,
    this.background = const Color(0xEFFFFFFF),
    this.foreground = AppTheme.primary,
  });

  final String text;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          color: foreground,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
