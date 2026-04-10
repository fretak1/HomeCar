import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../auth/providers/auth_provider.dart';
import '../favorites/providers/favorite_provider.dart';
import '../interactions/repositories/interaction_repository.dart';
import 'models/property_model.dart';
import 'providers/filter_provider.dart';
import 'providers/listing_provider.dart';
import 'providers/search_provider.dart';
import 'widgets/filter_sheet.dart';
import 'widgets/search_map_panel.dart';

class ListingListScreen extends ConsumerStatefulWidget {
  const ListingListScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<ListingListScreen> createState() => _ListingListScreenState();
}

class _ListingListScreenState extends ConsumerState<ListingListScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _logSearch();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final propertiesAsync = ref.watch(exploreResultsProvider);
    final currentFilter = ref.watch(assetFilterProvider);
    final activeFilters = ref.watch(filterProvider);
    final viewMode = ref.watch(exploreViewModeProvider);
    final hasActiveFilters =
        _hasActiveFilters(activeFilters) || _query.trim().isNotEmpty;

    final content = Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              children: [
                GlassCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.search, color: Colors.white54),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onChanged: (value) => setState(() => _query = value),
                          onSubmitted: (_) => _logSearch(),
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            hintText:
                                'Search by title, brand, model, or location',
                            hintStyle: const TextStyle(color: Colors.white38),
                            border: InputBorder.none,
                            isDense: true,
                            suffixIcon: _query.trim().isEmpty
                                ? null
                                : IconButton(
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() => _query = '');
                                      _logSearch();
                                    },
                                    icon: const Icon(
                                      Icons.close,
                                      color: Colors.white38,
                                    ),
                                  ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(
                          Icons.arrow_forward,
                          color: AppTheme.secondary,
                        ),
                        onPressed: _logSearch,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _assetChip('All', AssetFilter.all, currentFilter),
                          _assetChip('Homes', AssetFilter.homes, currentFilter),
                          _assetChip('Cars', AssetFilter.cars, currentFilter),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Badge(
                        isLabelVisible: hasActiveFilters,
                        smallSize: 8,
                        backgroundColor: AppTheme.secondary,
                        child: const Icon(Icons.tune_rounded),
                      ),
                      onPressed: () => _openFilters(currentFilter),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _modeChip(
                        label: 'List',
                        selected: viewMode == ExploreViewMode.list,
                        onTap: () =>
                            ref.read(exploreViewModeProvider.notifier).state =
                                ExploreViewMode.list,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _modeChip(
                        label: 'Map',
                        selected: viewMode == ExploreViewMode.map,
                        onTap: () =>
                            ref.read(exploreViewModeProvider.notifier).state =
                                ExploreViewMode.map,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          propertiesAsync.when(
            data: (properties) {
              final visibleProperties = _applyQueryFilter(properties, _query);
              return Expanded(
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      child: _ResultsSummary(
                        resultCount: visibleProperties.length,
                        query: _query,
                        filters: activeFilters,
                        onReset: () {
                          ref.read(filterProvider.notifier).reset();
                          _searchController.clear();
                          setState(() => _query = '');
                          _logSearch();
                        },
                      ),
                    ),
                    Expanded(
                      child: visibleProperties.isEmpty
                          ? _EmptyResults(
                              query: _query,
                              hasServerResults: properties.isNotEmpty,
                              onReset: () {
                                ref.read(filterProvider.notifier).reset();
                                _searchController.clear();
                                setState(() => _query = '');
                                _logSearch();
                              },
                            )
                          : RefreshIndicator(
                              onRefresh: () async {
                                ref.invalidate(exploreResultsProvider);
                                await ref.read(exploreResultsProvider.future);
                              },
                              child: viewMode == ExploreViewMode.list
                                  ? _ListingsList(properties: visibleProperties)
                                  : ListView(
                                      padding: const EdgeInsets.fromLTRB(
                                        16,
                                        0,
                                        16,
                                        24,
                                      ),
                                      children: [
                                        SizedBox(
                                          height: 320,
                                          child: SearchMapPanel(
                                            properties: visibleProperties,
                                            onMapMoved: _logMapMove,
                                          ),
                                        ),
                                        const SizedBox(height: 14),
                                        const Text(
                                          'Results in this area',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        ...visibleProperties.map(
                                          (property) => Padding(
                                            padding: const EdgeInsets.only(
                                              bottom: 12,
                                            ),
                                            child: _CompactListingCard(
                                              property: property,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                            ),
                    ),
                  ],
                ),
              );
            },
            loading: () => const Expanded(
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, _) => Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Error: $error',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.redAccent),
                  ),
                ),
              ),
            ),
          ),
        ],
      );

    if (widget.embedded) return content;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Explore',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: content,
    );
  }

  ChoiceChip _assetChip(
    String label,
    AssetFilter filter,
    AssetFilter currentFilter,
  ) {
    final isSelected = currentFilter == filter;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (!selected) return;
        ref.read(assetFilterProvider.notifier).state = filter;
        _logSearch();
      },
      selectedColor: AppTheme.primary.withOpacity(0.45),
      backgroundColor: Colors.white12,
      labelStyle: TextStyle(
        color: isSelected ? AppTheme.secondary : Colors.white,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  Widget _modeChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Ink(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary.withOpacity(0.22) : Colors.white10,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected
                ? AppTheme.secondary.withOpacity(0.6)
                : Colors.white10,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? AppTheme.secondary : Colors.white70,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  List<PropertyModel> _applyQueryFilter(
    List<PropertyModel> properties,
    String query,
  ) {
    final normalized = query.trim().toLowerCase();
    if (normalized.isEmpty) return properties;

    return properties.where((property) {
      final haystack = [
        property.title,
        property.locationLabel,
        property.brand ?? '',
        property.model ?? '',
        property.propertyType ?? '',
        property.city ?? '',
        property.subcity ?? '',
        property.region ?? '',
      ].join(' ').toLowerCase();

      return haystack.contains(normalized);
    }).toList();
  }

  Future<void> _openFilters(AssetFilter currentFilter) async {
    final assetType = currentFilter == AssetFilter.cars ? 'CAR' : 'HOME';
    await showFilterSheet(context, assetType);
    if (!mounted) return;
    await _logSearch();
  }

  Future<void> _logSearch() async {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final assetFilter = ref.read(assetFilterProvider);
    final filters = ref.read(filterProvider);
    final assetType = assetFilter == AssetFilter.cars ? 'CAR' : 'HOME';

    await ref
        .read(interactionRepositoryProvider)
        .logSearchFilter(
          userId: user.id,
          searchType: assetFilter == AssetFilter.all ? 'ALL' : assetType,
          filters: {
            ...filters.toApiParams(assetType),
            if (_query.trim().isNotEmpty) 'query': _query.trim(),
          },
        );
  }

  Future<void> _logMapMove(double lat, double lng, double zoom) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    await ref
        .read(interactionRepositoryProvider)
        .logMapInteraction(userId: user.id, lat: lat, lng: lng, zoom: zoom);
  }

  bool _hasActiveFilters(FilterState filters) {
    return filters.listingType != 'any' ||
        filters.region.trim().isNotEmpty ||
        filters.city.trim().isNotEmpty ||
        filters.subCity.trim().isNotEmpty ||
        filters.priceMin != null ||
        filters.priceMax != null ||
        filters.amenities.isNotEmpty ||
        filters.propertyType != 'any' ||
        filters.beds != 'any' ||
        filters.baths != 'any' ||
        filters.brand != 'any' ||
        filters.fuelType != 'any' ||
        filters.transmission != 'any' ||
        filters.yearMin != 1990 ||
        filters.yearMax != 2025 ||
        filters.mileageMax != null;
  }
}

class _ResultsSummary extends StatelessWidget {
  const _ResultsSummary({
    required this.resultCount,
    required this.query,
    required this.filters,
    required this.onReset,
  });

  final int resultCount;
  final String query;
  final FilterState filters;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final chips = <String>[
      if (query.trim().isNotEmpty) 'Query: ${query.trim()}',
      if (filters.city.trim().isNotEmpty) filters.city.trim(),
      if (filters.subCity.trim().isNotEmpty) filters.subCity.trim(),
      if (filters.region.trim().isNotEmpty) filters.region.trim(),
      if (filters.listingType != 'any') filters.listingType.toUpperCase(),
      if (filters.propertyType != 'any') filters.propertyType,
      if (filters.brand != 'any') filters.brand,
      if (filters.amenities.isNotEmpty) '${filters.amenities.length} features',
    ];

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$resultCount result${resultCount == 1 ? '' : 's'}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              if (chips.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: chips
                      .map(
                        (chip) => Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white10,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            chip,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ],
          ),
        ),
        if (chips.isNotEmpty)
          TextButton(
            onPressed: onReset,
            child: const Text(
              'Reset',
              style: TextStyle(color: AppTheme.secondary),
            ),
          ),
      ],
    );
  }
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults({
    required this.query,
    required this.hasServerResults,
    required this.onReset,
  });

  final String query;
  final bool hasServerResults;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final message = hasServerResults && query.trim().isNotEmpty
        ? 'No listings match "$query".'
        : 'No listings match your current search.';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off, size: 60, color: Colors.white24),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: onReset,
              child: const Text(
                'Reset Search',
                style: TextStyle(color: AppTheme.secondary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ListingsList extends ConsumerWidget {
  const _ListingsList({required this.properties});

  final List<PropertyModel> properties;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      itemCount: properties.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _ListingCard(property: properties[index]),
        );
      },
    );
  }
}

class _ListingCard extends ConsumerWidget {
  const _ListingCard({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFav = ref.watch(favoritedIdsProvider).contains(property.id);

    return GlassCard(
      padding: EdgeInsets.zero,
      onTap: () => context.push('/property-detail', extra: property),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: property.images.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: property.mainImage,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(
                      height: 200,
                      color: Colors.white12,
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (_, __, ___) => Container(
                      height: 200,
                      color: Colors.white12,
                      child: const Icon(Icons.error, color: Colors.white54),
                    ),
                  )
                : Container(
                    height: 200,
                    color: Colors.white12,
                    child: const Center(
                      child: Icon(
                        Icons.image_not_supported,
                        color: Colors.white54,
                      ),
                    ),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        property.title,
                        style: Theme.of(context).textTheme.titleLarge,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (property.isVerified)
                      const Icon(
                        Icons.verified,
                        color: AppTheme.secondary,
                        size: 20,
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  property.locationLabel,
                  style: const TextStyle(color: Colors.white54),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${property.price.toStringAsFixed(0)} ETB',
                      style: const TextStyle(
                        color: AppTheme.secondary,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    GestureDetector(
                      onTap: () =>
                          ref.read(favoriteProvider.notifier).toggle(property),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        child: Icon(
                          isFav ? Icons.favorite : Icons.favorite_border,
                          key: ValueKey(isFav),
                          color: isFav ? Colors.redAccent : Colors.white38,
                          size: 22,
                        ),
                      ),
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

class _CompactListingCard extends StatelessWidget {
  const _CompactListingCard({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: () => context.push('/property-detail', extra: property),
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            width: 94,
            height: 94,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: Colors.white10,
              image: property.images.isNotEmpty
                  ? DecorationImage(
                      image: CachedNetworkImageProvider(property.mainImage),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: property.images.isEmpty
                ? const Icon(Icons.image_outlined, color: Colors.white24)
                : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  property.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text(
                  property.locationLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
                const SizedBox(height: 8),
                Text(
                  '${property.price.toStringAsFixed(0)} ETB',
                  style: const TextStyle(
                    color: AppTheme.secondary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right, color: Colors.white38),
        ],
      ),
    );
  }
}
