import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../dashboard/widgets/dashboard_page_scaffold.dart';
import '../../dashboard/widgets/dashboard_utils.dart';
import '../../dashboard/widgets/role_dashboard_scaffold.dart';
import '../../listings/models/property_model.dart';
import '../../listings/repositories/listing_repository.dart';

class MyListingsScreen extends ConsumerStatefulWidget {
  const MyListingsScreen({super.key});

  @override
  ConsumerState<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends ConsumerState<MyListingsScreen> {
  String _query = '';
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final listingsAsync = ref.watch(myListingsProvider);
    final isAgent = user?.isAgent ?? false;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            DashboardPageHeader(
              title: isAgent ? 'Managed Listings' : 'My Properties',
              subtitle: isAgent
                  ? 'Review, update, and monitor every listing you manage for owners.'
                  : 'Oversee your portfolio, review listing status, and jump into edits quickly.',
              onBack: () => Navigator.of(context).maybePop(),
              action: FilledButton.icon(
                onPressed: () async {
                  await context.push('/add-listing');
                  ref.invalidate(myListingsProvider);
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                ),
                icon: const Icon(Icons.add_home_work_outlined, size: 18),
                label: const Text('Add Property'),
              ),
            ),
            Expanded(
              child: listingsAsync.when(
                data: (listings) {
                  final filtered = listings.where((item) {
                    final matchesQuery =
                        _query.trim().isEmpty ||
                        item.title.toLowerCase().contains(
                              _query.trim().toLowerCase(),
                            ) ||
                        item.locationLabel.toLowerCase().contains(
                              _query.trim().toLowerCase(),
                            );

                    final matchesFilter = switch (_filter) {
                      'verified' => item.isVerified,
                      'pending' => !item.isVerified,
                      'homes' => item.isHome,
                      'cars' => item.isCar,
                      _ => true,
                    };

                    return matchesQuery && matchesFilter;
                  }).toList(growable: false);

                  final verifiedCount =
                      listings.where((item) => item.isVerified).length;

                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(myListingsProvider);
                      await ref.read(myListingsProvider.future);
                    },
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
                      children: [
                        Center(
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 1200),
                            child: Column(
                              children: [
                                DashboardSectionCard(
                                  title: isAgent
                                      ? 'Listing management'
                                      : 'Portfolio overview',
                                  trailing: TextButton.icon(
                                    onPressed: () =>
                                        context.push('/manage-applications'),
                                    icon: const Icon(
                                      Icons.assignment_outlined,
                                      size: 16,
                                    ),
                                    label: const Text('Applications'),
                                  ),
                                  child: Column(
                                    children: [
                                      LayoutBuilder(
                                        builder: (context, constraints) {
                                          final stacked =
                                              constraints.maxWidth < 720;

                                          return stacked
                                              ? Column(
                                                  children: [
                                                    _ListingsSearchField(
                                                      initialValue: _query,
                                                      onChanged: (value) =>
                                                          setState(
                                                            () => _query = value,
                                                          ),
                                                    ),
                                                    const SizedBox(height: 14),
                                                    _ListingsFilterWrap(
                                                      selected: _filter,
                                                      onChanged: (value) =>
                                                          setState(
                                                            () =>
                                                                _filter = value,
                                                          ),
                                                    ),
                                                  ],
                                                )
                                              : Row(
                                                  children: [
                                                    Expanded(
                                                      child: _ListingsSearchField(
                                                        initialValue: _query,
                                                        onChanged: (value) =>
                                                            setState(
                                                              () =>
                                                                  _query = value,
                                                            ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 16),
                                                    Expanded(
                                                      child: Align(
                                                        alignment: Alignment
                                                            .centerRight,
                                                        child:
                                                            _ListingsFilterWrap(
                                                          selected: _filter,
                                                          onChanged: (value) =>
                                                              setState(
                                                                () => _filter =
                                                                    value,
                                                              ),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                );
                                        },
                                      ),
                                      const SizedBox(height: 16),
                                      Wrap(
                                        spacing: 12,
                                        runSpacing: 12,
                                        children: [
                                          DashboardMetricTile(
                                            icon:
                                                Icons.inventory_2_outlined,
                                            label:
                                                '${listings.length} listings total',
                                          ),
                                          DashboardMetricTile(
                                            icon: Icons.check_circle_outline,
                                            label: '$verifiedCount verified',
                                          ),
                                          DashboardMetricTile(
                                            icon: Icons.approval_outlined,
                                            label:
                                                '${listings.length - verifiedCount} pending',
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                                if (listings.isEmpty)
                                  DashboardEmptyState(
                                    title: 'No listings yet',
                                    message: isAgent
                                        ? 'Assigned or created agent listings will appear here once they are available.'
                                        : 'Create your first listing to start receiving applications and lease interest.',
                                    actionLabel: 'Add Property',
                                    onAction: () => context.push('/add-listing'),
                                  )
                                else if (filtered.isEmpty)
                                  const DashboardEmptyState(
                                    title: 'No listings match this filter',
                                    message:
                                        'Try a different search term or switch the listing filter.',
                                  )
                                else
                                  ...filtered.map(
                                    (item) => Padding(
                                      padding: const EdgeInsets.only(
                                        bottom: 14,
                                      ),
                                      child: _ListingCard(property: item),
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
                loading: () => Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: 1200),
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: DashboardLoadingState(
                        label: 'Loading listings...',
                      ),
                    ),
                  ),
                ),
                error: (error, _) => Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1200),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: DashboardEmptyState(
                        title: 'Listings unavailable',
                        message: error.toString().replaceFirst(
                              'Exception: ',
                              '',
                            ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ListingsSearchField extends StatelessWidget {
  const _ListingsSearchField({
    required this.initialValue,
    required this.onChanged,
  });

  final String initialValue;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      initialValue: initialValue,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: 'Search by title or location',
        prefixIcon: const Icon(Icons.search_rounded),
        filled: true,
        fillColor: AppTheme.inputBackground,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppTheme.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppTheme.border),
        ),
      ),
    );
  }
}

class _ListingsFilterWrap extends StatelessWidget {
  const _ListingsFilterWrap({
    required this.selected,
    required this.onChanged,
  });

  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        DashboardFilterChip(
          label: 'All',
          selected: selected == 'all',
          onTap: () => onChanged('all'),
        ),
        DashboardFilterChip(
          label: 'Verified',
          selected: selected == 'verified',
          onTap: () => onChanged('verified'),
        ),
        DashboardFilterChip(
          label: 'Pending',
          selected: selected == 'pending',
          onTap: () => onChanged('pending'),
        ),
        DashboardFilterChip(
          label: 'Homes',
          selected: selected == 'homes',
          onTap: () => onChanged('homes'),
        ),
        DashboardFilterChip(
          label: 'Cars',
          selected: selected == 'cars',
          onTap: () => onChanged('cars'),
        ),
      ],
    );
  }
}

class _ListingCard extends ConsumerWidget {
  const _ListingCard({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DashboardEntityCard(
      title: property.title,
      subtitle: property.locationLabel,
      imageUrl: property.mainImage,
      imageIcon: property.isCar
          ? Icons.directions_car_outlined
          : Icons.home_work_outlined,
      status: DashboardStatusPill(
        label: property.isVerified ? 'Verified' : 'Pending review',
        color: property.isVerified
            ? const Color(0xFF059669)
            : const Color(0xFFD97706),
      ),
      body: Text(
        property.description.trim().isEmpty
            ? 'No description provided for this listing yet.'
            : property.description,
        maxLines: 3,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: AppTheme.mutedForeground,
          height: 1.45,
        ),
      ),
      metrics: [
        DashboardMetricTile(
          icon: Icons.sell_outlined,
          label: formatDashboardMoney(property.price),
        ),
        DashboardMetricTile(
          icon: property.isCar
              ? Icons.local_gas_station_outlined
              : Icons.king_bed_outlined,
          label: property.isCar
              ? prettyDashboardLabel(property.fuelType ?? 'Vehicle')
              : '${property.bedrooms ?? 0} bedrooms',
        ),
        DashboardMetricTile(
          icon: Icons.category_outlined,
          label: property.isCar
              ? prettyDashboardLabel(property.brand ?? 'Car')
              : prettyDashboardLabel(property.propertyType ?? 'Property'),
        ),
      ],
      actions: [
        FilledButton.icon(
          onPressed: () => context.push('/property-detail', extra: property),
          icon: const Icon(Icons.visibility_outlined, size: 18),
          label: const Text('View detail'),
        ),
        OutlinedButton.icon(
          onPressed: () async {
            await context.push('/edit-listing', extra: property);
            ref.invalidate(myListingsProvider);
          },
          icon: const Icon(Icons.edit_outlined, size: 18),
          label: const Text('Edit'),
        ),
        OutlinedButton.icon(
          onPressed: () => _confirmDelete(context, ref),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFFDC2626),
            side: const BorderSide(color: Color(0xFFFECACA)),
          ),
          icon: const Icon(Icons.delete_outline, size: 18),
          label: const Text('Delete'),
        ),
      ],
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: const Text('Delete listing?'),
          content: Text(
            'This will permanently remove "${property.title}" from your marketplace listings.',
            style: const TextStyle(color: AppTheme.mutedForeground),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
              ),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    await ref.read(listingRepositoryProvider).deleteListing(property.id);
    ref.invalidate(myListingsProvider);
  }
}

final myListingsProvider = FutureProvider<List<PropertyModel>>((ref) async {
  final user = ref.watch(authProvider).user;
  if (user == null || !user.isOwnerOrAgent) {
    return const <PropertyModel>[];
  }

  final repo = ref.watch(listingRepositoryProvider);
  if (user.role.toUpperCase() == 'AGENT') {
    return repo.getManagedListings(user.id);
  }
  return repo.getPropertiesByOwnerId(user.id);
});

