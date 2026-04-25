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
import '../listings/widgets/listing_rail.dart';
import '../../core/constants/ethiopia_locations.dart';

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
  String _city = 'any';
  String _listingType = 'rent';
  String _priceRange = 'all';
  bool _showCars = false;

  static const _heroImage =
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2070';

  @override
  void dispose() {
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
    final bounds = _parsePriceRange(_priceRange);
    ref.read(assetFilterProvider.notifier).state =
        _showCars ? AssetFilter.cars : AssetFilter.homes;
    ref.read(exploreViewModeProvider.notifier).state = ExploreViewMode.list;
    ref.read(filterProvider.notifier).update(
      (_) => FilterState(
        city: _city == 'any' ? '' : _city,
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
                      color: Colors.black.withOpacity(0.5),
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
                          city: _city,
                          onTabChange: (showCars) => setState(() {
                            _showCars = showCars;
                            _listingType = 'rent';
                            _priceRange = 'all';
                          }),
                          onListingTypeChanged: (value) =>
                              setState(() => _listingType = value),
                          onPriceRangeChanged: (value) =>
                              setState(() => _priceRange = value),
                          onCityChanged: (value) =>
                              setState(() => _city = value),
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
                return SectionBlock(
                  title: 'Recommended',
                  highlight: 'Just For You',
                  actionLabel: 'View All',
                  onAction: () => context.push('/recommendations'),
                  plainTitle: false,
                  gradientBand: true,
                  borderBottom: true,
                  child: ListingRail(items: items),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, stackTrace) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Recommendations unavailable: ${error.toString()}',
                          style: const TextStyle(color: Colors.red, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
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
                    SectionBlock(
                      title: 'Featured',
                      highlight: 'Homes',
                      actionLabel: 'View All',
                      onAction: () {
                        ref.read(assetFilterProvider.notifier).state =
                            AssetFilter.homes;
                        ref.read(exploreViewModeProvider.notifier).state =
                            ExploreViewMode.list;
                        context.go('/explore');
                      },
                      child: homes.isEmpty
                          ? EmptyState(
                              title: 'No Homes Yet',
                              message:
                                  'Be the first to list a beautiful home in our community.',
                              button: 'Post Your Home',
                              icon: Icons.home_work_outlined,
                              onAction: _search,
                            )
                          : ListingRail(items: homes),
                    ),
                    SectionBlock(
                      title: 'Featured',
                      highlight: 'Cars',
                      actionLabel: 'View All',
                      onAction: () {
                        ref.read(assetFilterProvider.notifier).state =
                            AssetFilter.cars;
                        ref.read(exploreViewModeProvider.notifier).state =
                            ExploreViewMode.list;
                        context.go('/explore');
                      },
                      gradientBand: true,
                      child: cars.isEmpty
                          ? EmptyState(
                              title: 'No Cars Available',
                              message:
                                  'Wait for our verified sellers to list premium vehicles.',
                              button: 'Search Again',
                              icon: Icons.car_crash_outlined,
                              onAction: _search,
                              secondaryStyle: true,
                              outlinedAction: true,
                            )
                          : ListingRail(items: cars),
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
                    AppTheme.primary.withOpacity(0.92),
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
                        color: Colors.white.withOpacity(0.9),
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
                          child: FilledButton(
                            onPressed: () => context.go('/explore'),
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
    required this.city,
    required this.onTabChange,
    required this.onListingTypeChanged,
    required this.onPriceRangeChanged,
    required this.onCityChanged,
    required this.onSearch,
  });

  final bool showCars;
  final String listingType;
  final String priceRange;
  final String city;
  final ValueChanged<bool> onTabChange;
  final ValueChanged<String> onListingTypeChanged;
  final ValueChanged<String> onPriceRangeChanged;
  final ValueChanged<String> onCityChanged;
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

                final allCities = ethiopiaLocations.values
                    .expand((regionMap) => regionMap.keys)
                    .toSet()
                    .toList()
                    ..sort();

                final cityField = DropdownButtonFormField<String>(
                  value: allCities.contains(city) ? city : 'any',
                  style: fieldTextStyle,
                  iconEnabledColor: AppTheme.mutedForeground,
                  dropdownColor: Colors.white,
                  menuMaxHeight: 280,
                  decoration: fieldDecoration.copyWith(
                    hintText: 'City',
                    prefixIcon: const Icon(Icons.location_on_outlined),
                  ),
                  items: [
                    const DropdownMenuItem(
                      value: 'any',
                      child: Text('All Cities'),
                    ),
                    ...allCities.map(
                      (c) => DropdownMenuItem(value: c, child: Text(c)),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) onCityChanged(value);
                  },
                );

                final listingField = DropdownButtonFormField<String>(
                  value: listingType,
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
                  value: priceRange,
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
            color: Colors.white.withOpacity(0.10),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withOpacity(0.20)),
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
                  color: Colors.white.withOpacity(0.75),
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

