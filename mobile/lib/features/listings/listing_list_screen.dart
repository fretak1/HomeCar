import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
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
  String _query = '';
  String _sortBy = 'newest';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(assetFilterProvider) == AssetFilter.all) {
        ref.read(assetFilterProvider.notifier).state = AssetFilter.homes;
      }
      _logSearch();
    });
  }

  @override
  Widget build(BuildContext context) {
    final propertiesAsync = ref.watch(exploreResultsProvider);
    final currentFilter = ref.watch(assetFilterProvider);
    final filters = ref.watch(filterProvider);
    final viewMode = ref.watch(exploreViewModeProvider);
    final locationLabel = _locationLabel(filters);
    final hasLocation = filters.region.trim().isNotEmpty ||
        filters.city.trim().isNotEmpty ||
        filters.subCity.trim().isNotEmpty;

    final content = RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(exploreResultsProvider);
        await ref.read(exploreResultsProvider.future);
      },
      child: Container(
        color: Colors.white,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            children: [
              _ListingsHero(embedded: widget.embedded),
              _PageWidth(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
                  child: Column(
                    children: [
                      _ListingControls(
                        currentFilter: currentFilter,
                        listingType: filters.listingType,
                        locationLabel: locationLabel,
                        hasLocation: hasLocation,
                        onAssetChanged: (filter) {
                          ref.read(assetFilterProvider.notifier).state = filter;
                          _logSearch();
                        },
                        onListingTypeChanged: (value) {
                          ref
                              .read(filterProvider.notifier)
                              .update((state) => state.copyWith(listingType: value));
                          _logSearch();
                        },
                        onLocationTap: _openLocationPicker,
                        onFilterTap: () => _openFilters(currentFilter),
                      ),
                      const SizedBox(height: 18),
                      propertiesAsync.when(
                        data: (properties) {
                          final visibleProperties = _sortProperties(
                            _applyQueryFilter(properties, _query),
                          );

                          return Column(
                            children: [
                              _ResultsSummary(
                                resultCount: visibleProperties.length,
                                assetLabel: currentFilter == AssetFilter.cars
                                    ? 'cars'
                                    : 'homes',
                                filterLabels: _activeFilterLabels(filters),
                                sortBy: _sortBy,
                                onSortChanged: (value) {
                                  setState(() => _sortBy = value);
                                },
                                onReset: () {
                                  ref.read(filterProvider.notifier).reset();
                                  setState(() => _query = '');
                                  _logSearch();
                                },
                              ),
                              const SizedBox(height: 12),
                              if (visibleProperties.isEmpty)
                                _EmptyResults(
                                  onReset: () {
                                    ref.read(filterProvider.notifier).reset();
                                    setState(() => _query = '');
                                    _logSearch();
                                  },
                                )
                              else if (viewMode == ExploreViewMode.list)
                                _ListingsList(
                                  properties: visibleProperties,
                                  shrinkWrap: true,
                                  physics:
                                      const NeverScrollableScrollPhysics(),
                                )
                              else
                                _ExploreMapWorkspace(
                                  properties: visibleProperties,
                                  onMapMoved: _logMapMove,
                                ),
                            ],
                          );
                        },
                        loading: () => Column(
                          children: [
                            _ResultsSummary(
                              resultCount: 0,
                              assetLabel: currentFilter == AssetFilter.cars
                                  ? 'cars'
                                  : 'homes',
                              filterLabels: _activeFilterLabels(filters),
                              sortBy: _sortBy,
                              onSortChanged: (value) {
                                setState(() => _sortBy = value);
                              },
                              onReset: () {
                                ref.read(filterProvider.notifier).reset();
                                setState(() => _query = '');
                                _logSearch();
                              },
                            ),
                            const SizedBox(height: 12),
                            LayoutBuilder(
                              builder: (context, constraints) {
                                final crossAxisCount = constraints.maxWidth >= 1180
                                    ? 3
                                    : constraints.maxWidth >= 760
                                        ? 2
                                        : 1;

                                return GridView.builder(
                                  shrinkWrap: true,
                                  physics:
                                      const NeverScrollableScrollPhysics(),
                                  padding: const EdgeInsets.only(bottom: 24),
                                  gridDelegate:
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: crossAxisCount,
                                    crossAxisSpacing: 20,
                                    mainAxisSpacing: 20,
                                    childAspectRatio:
                                        crossAxisCount == 1 ? 0.84 : 0.76,
                                  ),
                                  itemCount: crossAxisCount == 1 ? 3 : 6,
                                  itemBuilder: (context, index) {
                                    return Container(
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius:
                                            BorderRadius.circular(24),
                                        border: Border.all(
                                          color: AppTheme.border,
                                        ),
                                        boxShadow: const [
                                          BoxShadow(
                                            color: Color(0x12000000),
                                            blurRadius: 26,
                                            offset: Offset(0, 14),
                                          ),
                                        ],
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            height: 224,
                                            decoration: const BoxDecoration(
                                              color: Color(0xFFF3F4F6),
                                              borderRadius: BorderRadius.vertical(
                                                top: Radius.circular(24),
                                              ),
                                            ),
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.all(18),
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Container(
                                                  height: 18,
                                                  width: double.infinity,
                                                  decoration: BoxDecoration(
                                                    color:
                                                        const Color(0xFFF3F4F6),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                      999,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(height: 10),
                                                Container(
                                                  height: 14,
                                                  width: 180,
                                                  decoration: BoxDecoration(
                                                    color:
                                                        const Color(0xFFF3F4F6),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                      999,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(height: 16),
                                                Wrap(
                                                  spacing: 10,
                                                  runSpacing: 10,
                                                  children: List.generate(
                                                    3,
                                                    (_) => Container(
                                                      width: 74,
                                                      height: 14,
                                                      decoration: BoxDecoration(
                                                        color: const Color(
                                                          0xFFF3F4F6,
                                                        ),
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(999),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(height: 18),
                                                Container(
                                                  height: 24,
                                                  width: 150,
                                                  decoration: BoxDecoration(
                                                    color:
                                                        const Color(0xFFE8F3EF),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                      999,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
                          ],
                        ),
                        error: (error, _) => Center(
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
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
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

  List<PropertyModel> _sortProperties(List<PropertyModel> properties) {
    final sorted = [...properties];
    switch (_sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price.compareTo(a.price));
        break;
      case 'newest':
      default:
        sorted.sort(
          (a, b) => (b.createdAt?.millisecondsSinceEpoch ?? 0)
              .compareTo(a.createdAt?.millisecondsSinceEpoch ?? 0),
        );
        break;
    }
    return sorted;
  }

  String _locationLabel(FilterState filters) {
    final parts = [filters.region, filters.city, filters.subCity]
        .where((value) => value.trim().isNotEmpty)
        .toList();
    return parts.isEmpty ? 'Location' : parts.join(', ');
  }

  List<String> _activeFilterLabels(FilterState filters) {
    return [
      if (filters.region.trim().isNotEmpty) filters.region.trim(),
      if (filters.city.trim().isNotEmpty) filters.city.trim(),
      if (filters.subCity.trim().isNotEmpty) filters.subCity.trim(),
      if (filters.listingType != 'any')
        filters.listingType == 'rent' ? 'For Rent' : 'For Sale',
      if (filters.propertyType != 'any') filters.propertyType,
      if (filters.brand != 'any') filters.brand,
      if (filters.beds != 'any') '${filters.beds} beds',
      if (filters.baths != 'any') '${filters.baths} baths',
      if (filters.priceMin != null || filters.priceMax != null) 'Price',
      if (filters.amenities.isNotEmpty) '${filters.amenities.length} features',
    ];
  }

  Future<void> _openLocationPicker() async {
    final current = ref.read(filterProvider);
    final regionController = TextEditingController(text: current.region);
    final cityController = TextEditingController(text: current.city);
    final subCityController = TextEditingController(text: current.subCity);

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final bottomInset = MediaQuery.of(context).viewInsets.bottom;

        return Padding(
          padding: EdgeInsets.only(bottom: bottomInset),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 42,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppTheme.border,
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Choose location',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Refine listings by region, city, and sub city.',
                      style: TextStyle(
                        color: AppTheme.mutedForeground,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 18),
                    _LocationField(
                      label: 'Region',
                      controller: regionController,
                    ),
                    const SizedBox(height: 12),
                    _LocationField(label: 'City', controller: cityController),
                    const SizedBox(height: 12),
                    _LocationField(
                      label: 'Sub City',
                      controller: subCityController,
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              ref.read(filterProvider.notifier).update(
                                    (state) => state.copyWith(
                                      region: '',
                                      city: '',
                                      subCity: '',
                                    ),
                                  );
                              Navigator.of(context).pop();
                              _logSearch();
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.foreground,
                              side: const BorderSide(color: AppTheme.border),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: const Text('Clear'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton(
                            onPressed: () {
                              ref.read(filterProvider.notifier).update(
                                    (state) => state.copyWith(
                                      region: regionController.text.trim(),
                                      city: cityController.text.trim(),
                                      subCity: subCityController.text.trim(),
                                    ),
                                  );
                              Navigator.of(context).pop();
                              _logSearch();
                            },
                            style: FilledButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: const Text('Apply'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );

    regionController.dispose();
    cityController.dispose();
    subCityController.dispose();
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

}

class _ResultsSummary extends StatelessWidget {
  const _ResultsSummary({
    required this.resultCount,
    required this.assetLabel,
    required this.filterLabels,
    required this.sortBy,
    required this.onSortChanged,
    required this.onReset,
  });

  final int resultCount;
  final String assetLabel;
  final List<String> filterLabels;
  final String sortBy;
  final ValueChanged<String> onSortChanged;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        LayoutBuilder(
          builder: (context, constraints) {
            final sortWidget = Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (constraints.maxWidth >= 420)
                  const Padding(
                    padding: EdgeInsets.only(right: 8),
                    child: Text(
                      'Sort By',
                      style: TextStyle(
                        color: AppTheme.mutedForeground,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                SizedBox(
                  width: 150,
                  child: _SortPill(
                    value: sortBy,
                    onChanged: onSortChanged,
                  ),
                ),
              ],
            );

            final titleWidget = Text.rich(
              TextSpan(
                style: const TextStyle(
                  color: AppTheme.mutedForeground,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
                children: [
                  const TextSpan(text: 'Showing '),
                  TextSpan(
                    text: '$resultCount',
                    style: const TextStyle(
                      color: AppTheme.foreground,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  TextSpan(text: ' $assetLabel'),
                ],
              ),
            );

            if (constraints.maxWidth >= 760) {
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: titleWidget),
                  sortWidget,
                ],
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                titleWidget,
                const SizedBox(height: 12),
                Align(alignment: Alignment.centerLeft, child: sortWidget),
              ],
            );
          },
        ),
        if (filterLabels.isNotEmpty) ...[
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: filterLabels
                      .map(
                        (label) => Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF5F7F8),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Text(
                            label,
                            style: const TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
              const SizedBox(width: 12),
              TextButton(
                onPressed: onReset,
                child: const Text(
                  'Reset',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults({required this.onReset});

  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.search_off_rounded,
                color: AppTheme.mutedForeground,
                size: 30,
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'No items match your filters',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppTheme.foreground,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Try adjusting your filters or resetting them to find what you are looking for.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.mutedForeground,
                height: 1.55,
              ),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onReset,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Reset All Filters'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ListingsList extends ConsumerWidget {
  const _ListingsList({
    required this.properties,
    this.shrinkWrap = false,
    this.physics,
  });

  final List<PropertyModel> properties;
  final bool shrinkWrap;
  final ScrollPhysics? physics;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth >= 1180
            ? 3
            : constraints.maxWidth >= 760
                ? 2
                : 1;

        final childAspectRatio = constraints.maxWidth >= 1180
            ? 0.74
            : constraints.maxWidth >= 760
                ? 0.76
                : 0.83;

        return GridView.builder(
          shrinkWrap: shrinkWrap,
          physics: physics,
          padding: const EdgeInsets.only(bottom: 24),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 20,
            mainAxisSpacing: 20,
            childAspectRatio: childAspectRatio,
          ),
          itemCount: properties.length,
          itemBuilder: (context, index) {
            return _ListingCard(property: properties[index]);
          },
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
    final listingType = property.listingTypes.isNotEmpty
        ? _listingTypeLabel(property.listingTypes.first)
        : (property.isHome ? 'For Sale' : 'Buy');
    final isCompactWidth = MediaQuery.of(context).size.width < 420;

    return InkWell(
      onTap: () => context.push('/property-detail', extra: property),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppTheme.border),
          boxShadow: const [
            BoxShadow(
              color: Color(0x12000000),
              blurRadius: 26,
              offset: Offset(0, 14),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(24)),
                  child: property.images.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: property.mainImage,
                          height: 224,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                            height: 224,
                            color: const Color(0xFFF3F4F6),
                            child: const Center(
                              child: CircularProgressIndicator(
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                          errorWidget: (_, __, ___) => Container(
                            height: 224,
                            color: const Color(0xFFF3F4F6),
                            child: const Icon(
                              Icons.broken_image_outlined,
                              color: AppTheme.mutedForeground,
                              size: 30,
                            ),
                          ),
                        )
                      : Container(
                          height: 224,
                          color: const Color(0xFFF3F4F6),
                          child: const Center(
                            child: Icon(
                              Icons.image_not_supported_outlined,
                              color: AppTheme.mutedForeground,
                              size: 30,
                            ),
                          ),
                        ),
                ),
                Positioned(
                  top: 14,
                  left: 14,
                  right: 14,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            _ImageBadge(label: listingType),
                            if (!property.isVerified)
                              const _ImageBadge(
                                label: 'Pending Verification',
                                backgroundColor: Color(0xFFFEF3C7),
                                foregroundColor: Color(0xFFB45309),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Material(
                        color: const Color(0xE6FFFFFF),
                        shape: const CircleBorder(),
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () =>
                              ref.read(favoriteProvider.notifier).toggle(property),
                          child: SizedBox(
                            width: 34,
                            height: 34,
                            child: AnimatedSwitcher(
                              duration: const Duration(milliseconds: 220),
                              child: Icon(
                                isFav ? Icons.favorite : Icons.favorite_border,
                                key: ValueKey(isFav),
                                color: isFav
                                    ? const Color(0xFFE11D48)
                                    : const Color(0xFF6B7280),
                                size: 18,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            property.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.foreground,
                              height: 1.2,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.star_rounded,
                              color: Color(0xFFFACC15),
                              size: 17,
                            ),
                            const SizedBox(width: 3),
                            Text(
                              property.rating == 0
                                  ? '0'
                                  : property.rating.toStringAsFixed(1),
                              style: const TextStyle(
                                color: AppTheme.foreground,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    if (property.isCar &&
                        (property.brand != null ||
                            property.model != null ||
                            property.year != null)) ...[
                      const SizedBox(height: 4),
                      Text(
                        [
                          property.brand,
                          property.model,
                          if (property.year != null) '${property.year}',
                        ].whereType<String>().join(' '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.mutedForeground,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          color: AppTheme.primary,
                          size: 16,
                        ),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            property.locationLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 14,
                      runSpacing: 10,
                      children: property.isHome
                          ? [
                              _SpecItem(
                                icon: Icons.bed_outlined,
                                label: '${property.bedrooms ?? 0}',
                              ),
                              _SpecItem(
                                icon: Icons.bathtub_outlined,
                                label: '${property.bathrooms ?? 0}',
                              ),
                              _SpecItem(
                                icon: Icons.square_foot_outlined,
                                label:
                                    '${(property.area ?? 0).toStringAsFixed(0)} sq m',
                              ),
                            ]
                          : [
                              _SpecItem(
                                icon: Icons.speed_outlined,
                                label:
                                    '${(property.mileage ?? 0).toStringAsFixed(0)} km',
                              ),
                              _SpecItem(
                                icon: Icons.local_gas_station_outlined,
                                label: property.fuelType ?? 'Fuel',
                              ),
                              _SpecItem(
                                icon: Icons.settings_outlined,
                                label: property.transmission ?? 'Transmission',
                                compact: isCompactWidth,
                              ),
                            ],
                    ),
                    const Spacer(),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: RichText(
                            text: TextSpan(
                              children: [
                                const TextSpan(
                                  text: 'ETB ',
                                  style: TextStyle(
                                    color: AppTheme.primary,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.4,
                                  ),
                                ),
                                TextSpan(
                                  text: _formatCompactNumber(property.price),
                                  style: const TextStyle(
                                    color: AppTheme.primary,
                                    fontSize: 25,
                                    fontWeight: FontWeight.w900,
                                    height: 1,
                                  ),
                                ),
                                if (property.listingTypes.any(
                                  (type) => type.toUpperCase().contains('RENT'),
                                ))
                                  const TextSpan(
                                    text: ' /mo',
                                    style: TextStyle(
                                      color: AppTheme.mutedForeground,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                        if (property.isVerified)
                          const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.verified_rounded,
                                color: AppTheme.primary,
                                size: 17,
                              ),
                              SizedBox(width: 4),
                              Text(
                                'Verified',
                                style: TextStyle(
                                  color: AppTheme.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
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
}

class _CompactListingCard extends StatelessWidget {
  const _CompactListingCard({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/property-detail', extra: property),
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            Container(
              width: 98,
              height: 98,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: const Color(0xFFF3F4F6),
                image: property.images.isNotEmpty
                    ? DecorationImage(
                        image: CachedNetworkImageProvider(property.mainImage),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: property.images.isEmpty
                  ? const Icon(
                      Icons.image_outlined,
                      color: AppTheme.mutedForeground,
                    )
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
                    style: const TextStyle(
                      color: AppTheme.foreground,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        color: AppTheme.primary,
                        size: 15,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          property.locationLabel,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppTheme.mutedForeground,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'ETB ${_formatCompactNumber(property.price)}',
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppTheme.mutedForeground,
            ),
          ],
        ),
      ),
    );
  }
}

class _ImageBadge extends StatelessWidget {
  const _ImageBadge({
    required this.label,
    this.backgroundColor = const Color(0xE6FFFFFF),
    this.foregroundColor = AppTheme.primary,
  });

  final String label;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foregroundColor,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class _SpecItem extends StatelessWidget {
  const _SpecItem({
    required this.icon,
    required this.label,
    this.compact = false,
  });

  final IconData icon;
  final String label;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppTheme.primary),
        const SizedBox(width: 5),
        ConstrainedBox(
          constraints: BoxConstraints(maxWidth: compact ? 82 : 110),
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

String _listingTypeLabel(String value) {
  final normalized = value.replaceAll('_', ' ').toUpperCase();
  switch (normalized) {
    case 'RENT':
      return 'For Rent';
    case 'BUY':
      return 'For Sale';
    case 'LEASE':
      return 'Lease';
    default:
      return normalized
          .toLowerCase()
          .split(' ')
          .map(
            (part) => part.isEmpty
                ? part
                : '${part[0].toUpperCase()}${part.substring(1)}',
          )
          .join(' ');
  }
}

String _formatCompactNumber(double value) {
  final whole = value.round().toString();
  final buffer = StringBuffer();

  for (var i = 0; i < whole.length; i++) {
    final indexFromEnd = whole.length - i;
    buffer.write(whole[i]);
    if (indexFromEnd > 1 && indexFromEnd % 3 == 1) {
      buffer.write(',');
    }
  }

  return buffer.toString();
}

class _ListingsHero extends StatelessWidget {
  const _ListingsHero({required this.embedded});

  final bool embedded;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primary,
            AppTheme.primary.withValues(alpha: 0.94),
            AppTheme.secondary,
          ],
        ),
      ),
      child: _PageWidth(
        child: Padding(
          padding: EdgeInsets.fromLTRB(16, embedded ? 28 : 36, 16, 28),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Browse Listings',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.w900,
                  height: 1.05,
                ),
              ),
              SizedBox(height: 10),
              Text(
                'Find your dream home or vehicle in Ethiopia with HomeCar.',
                style: TextStyle(
                  color: Color(0xE6FFFFFF),
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  height: 1.45,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ListingControls extends StatelessWidget {
  const _ListingControls({
    required this.currentFilter,
    required this.listingType,
    required this.locationLabel,
    required this.hasLocation,
    required this.onAssetChanged,
    required this.onListingTypeChanged,
    required this.onLocationTap,
    required this.onFilterTap,
  });

  final AssetFilter currentFilter;
  final String listingType;
  final String locationLabel;
  final bool hasLocation;
  final ValueChanged<AssetFilter> onAssetChanged;
  final ValueChanged<String> onListingTypeChanged;
  final VoidCallback onLocationTap;
  final VoidCallback onFilterTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _SegmentedTabs(
          labels: const ['Homes', 'Cars'],
          selectedIndex: currentFilter == AssetFilter.cars ? 1 : 0,
          onChanged: (index) {
            onAssetChanged(
              index == 1 ? AssetFilter.cars : AssetFilter.homes,
            );
          },
        ),
        const SizedBox(height: 14),
        LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth >= 760;
            final locationPill = _FilterPillButton(
              label: locationLabel,
              icon: Icons.location_on_outlined,
              active: hasLocation,
              expanded: true,
              onTap: onLocationTap,
            );
            final listingTypePill = _ListingTypePill(
              value: listingType,
              onChanged: onListingTypeChanged,
            );
            final filterButton = _IconRoundButton(
              icon: Icons.tune_rounded,
              active: true,
              onTap: onFilterTap,
            );

            if (isWide) {
              return Row(
                children: [
                  Expanded(flex: 6, child: locationPill),
                  const SizedBox(width: 12),
                  SizedBox(width: 148, child: listingTypePill),
                  const SizedBox(width: 12),
                  filterButton,
                ],
              );
            }

            return Row(
              children: [
                Expanded(child: locationPill),
                const SizedBox(width: 10),
                SizedBox(width: 132, child: listingTypePill),
                const SizedBox(width: 10),
                filterButton,
              ],
            );
          },
        ),
      ],
    );
  }
}

class _ExploreMapWorkspace extends StatelessWidget {
  const _ExploreMapWorkspace({
    required this.properties,
    required this.onMapMoved,
  });

  final List<PropertyModel> properties;
  final Future<void> Function(double lat, double lng, double zoom)? onMapMoved;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth >= 1080;
        final isTablet = constraints.maxWidth >= 760;

        if (isDesktop) {
          return SizedBox(
            height: 680,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 8,
                  child: _MapSurface(
                    properties: properties,
                    onMapMoved: onMapMoved,
                    height: double.infinity,
                  ),
                ),
                const SizedBox(width: 18),
                Expanded(
                  flex: 5,
                  child: _MapResultsRail(properties: properties),
                ),
              ],
            ),
          );
        }

        if (isTablet) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _MapSurface(
                properties: properties,
                onMapMoved: onMapMoved,
                height: 420,
              ),
              const SizedBox(height: 18),
              _MapResultsRail(properties: properties),
            ],
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _MapSurface(
              properties: properties,
              onMapMoved: onMapMoved,
              height: 340,
            ),
            const SizedBox(height: 16),
            _MapResultsRail(properties: properties),
          ],
        );
      },
    );
  }
}

class _MapSurface extends StatelessWidget {
  const _MapSurface({
    required this.properties,
    required this.height,
    this.onMapMoved,
  });

  final List<PropertyModel> properties;
  final double height;
  final Future<void> Function(double lat, double lng, double zoom)? onMapMoved;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 30,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(6, 4, 6, 12),
              child: Row(
                children: [
                  Icon(Icons.map_outlined, color: AppTheme.primary, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Search on map',
                    style: TextStyle(
                      color: AppTheme.foreground,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SearchMapPanel(
                properties: properties,
                onMapMoved: onMapMoved,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MapResultsRail extends StatelessWidget {
  const _MapResultsRail({required this.properties});

  final List<PropertyModel> properties;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final hasBoundedHeight = constraints.maxHeight.isFinite;

        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x12000000),
                blurRadius: 30,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Results in this area',
                        style: const TextStyle(
                          color: AppTheme.foreground,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    Text(
                      '${properties.length}',
                      style: const TextStyle(
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: AppTheme.border),
              if (hasBoundedHeight)
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(14),
                    itemCount: properties.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      return _CompactListingCard(property: properties[index]);
                    },
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(14),
                  itemCount: properties.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    return _CompactListingCard(property: properties[index]);
                  },
                ),
            ],
          ),
        );
      },
    );
  }
}

class _PageWidth extends StatelessWidget {
  const _PageWidth({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1280),
        child: child,
      ),
    );
  }
}

class _LocationField extends StatelessWidget {
  const _LocationField({
    required this.label,
    required this.controller,
  });

  final String label;
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      style: const TextStyle(
        color: AppTheme.foreground,
        fontWeight: FontWeight.w600,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: AppTheme.mutedForeground),
        filled: true,
        fillColor: const Color(0xFFF7F7F8),
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
          borderSide: const BorderSide(color: AppTheme.primary),
        ),
      ),
    );
  }
}

class _SegmentedTabs extends StatelessWidget {
  const _SegmentedTabs({
    required this.labels,
    required this.selectedIndex,
    required this.onChanged,
    this.compact = false,
  });

  final List<String> labels;
  final int selectedIndex;
  final ValueChanged<int> onChanged;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: compact ? MainAxisSize.min : MainAxisSize.max,
        children: List.generate(labels.length, (index) {
          final isSelected = index == selectedIndex;
          return Expanded(
            flex: compact ? 0 : 1,
            child: InkWell(
              onTap: () => onChanged(index),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: compact ? 18 : 20,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: isSelected
                      ? const [
                          BoxShadow(
                            color: Color(0x12000000),
                            blurRadius: 12,
                            offset: Offset(0, 4),
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  labels[index],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: isSelected
                        ? AppTheme.foreground
                        : AppTheme.mutedForeground,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _FilterPillButton extends StatelessWidget {
  const _FilterPillButton({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
    this.expanded = false,
  });

  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    final borderColor = active
        ? AppTheme.primary.withValues(alpha: 0.25)
        : AppTheme.border;
    final backgroundColor = active
        ? AppTheme.primary.withValues(alpha: 0.05)
        : Colors.white;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Ink(
        height: 46,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: borderColor),
          boxShadow: const [
            BoxShadow(
              color: Color(0x08000000),
              blurRadius: 10,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(
            mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 18,
                color: active ? AppTheme.primary : AppTheme.mutedForeground,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: active ? AppTheme.primary : AppTheme.foreground,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Icon(
                Icons.keyboard_arrow_down_rounded,
                color: active ? AppTheme.primary : AppTheme.mutedForeground,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ListingTypePill extends StatelessWidget {
  const _ListingTypePill({
    required this.value,
    required this.onChanged,
  });

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 46,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: value,
            isExpanded: true,
            icon: const Icon(
              Icons.keyboard_arrow_down_rounded,
              color: AppTheme.mutedForeground,
            ),
            style: const TextStyle(
              color: AppTheme.foreground,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
            borderRadius: BorderRadius.circular(16),
            dropdownColor: Colors.white,
            items: const [
              DropdownMenuItem(value: 'any', child: Text('All')),
              DropdownMenuItem(value: 'rent', child: Text('For Rent')),
              DropdownMenuItem(value: 'buy', child: Text('For Sale')),
            ],
            onChanged: (value) {
              if (value != null) {
                onChanged(value);
              }
            },
          ),
        ),
      ),
    );
  }
}

class _SortPill extends StatelessWidget {
  const _SortPill({
    required this.value,
    required this.onChanged,
  });

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppTheme.border),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: value,
            isExpanded: true,
            icon: const Icon(
              Icons.keyboard_arrow_down_rounded,
              color: AppTheme.mutedForeground,
            ),
            style: const TextStyle(
              color: AppTheme.foreground,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
            borderRadius: BorderRadius.circular(16),
            dropdownColor: Colors.white,
            items: const [
              DropdownMenuItem(value: 'newest', child: Text('Newest First')),
              DropdownMenuItem(value: 'price-low', child: Text('Price: Low to High')),
              DropdownMenuItem(value: 'price-high', child: Text('Price: High to Low')),
            ],
            onChanged: (value) {
              if (value != null) {
                onChanged(value);
              }
            },
          ),
        ),
      ),
    );
  }
}

class _IconRoundButton extends StatelessWidget {
  const _IconRoundButton({
    required this.icon,
    required this.onTap,
    this.active = false,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Ink(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: active
              ? AppTheme.primary.withValues(alpha: 0.08)
              : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: active
                ? AppTheme.primary.withValues(alpha: 0.18)
                : AppTheme.border,
          ),
        ),
        child: Icon(
          icon,
          size: 20,
          color: active ? AppTheme.primary : AppTheme.foreground,
        ),
      ),
    );
  }
}

class _ListingsLoadingState extends StatelessWidget {
  const _ListingsLoadingState();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const _ResultsSummary(
          resultCount: 0,
          assetLabel: 'homes',
          filterLabels: [],
          sortBy: 'newest',
          onSortChanged: _noopString,
          onReset: _noop,
        ),
        const SizedBox(height: 12),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.only(bottom: 24),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 1,
              mainAxisSpacing: 20,
              childAspectRatio: 0.98,
            ),
            itemCount: 4,
            itemBuilder: (context, index) {
              return Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  children: [
                    Container(
                      height: 224,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.vertical(
                          top: Radius.circular(20),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              height: 18,
                              width: 180,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Container(
                              height: 14,
                              width: 120,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF5F5F6),
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            const SizedBox(height: 18),
                            Row(
                              children: List.generate(
                                3,
                                (index) => Padding(
                                  padding: EdgeInsets.only(
                                    right: index == 2 ? 0 : 10,
                                  ),
                                  child: Container(
                                    height: 14,
                                    width: 56,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF5F5F6),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const Spacer(),
                            Container(
                              height: 24,
                              width: 140,
                              decoration: BoxDecoration(
                                color: const Color(0xFFE8F4EF),
                                borderRadius: BorderRadius.circular(999),
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
          ),
        ),
      ],
    );
  }

  static void _noop() {}

  static void _noopString(String _) {}
}
