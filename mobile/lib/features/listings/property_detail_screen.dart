import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../applications/models/application_model.dart';
import '../applications/providers/application_provider.dart';
import '../auth/providers/auth_provider.dart';
import 'providers/search_provider.dart';
import 'widgets/listing_rail.dart';
import 'providers/listing_provider.dart';
import '../chat/providers/chat_provider.dart';
import '../chat/repositories/chat_repository.dart';
import '../reviews/models/review_model.dart';
import '../reviews/providers/review_provider.dart';
import '../transactions/models/transaction_model.dart';
import '../transactions/providers/transaction_provider.dart';
import '../favorites/providers/favorite_provider.dart';
import 'models/property_model.dart';
import 'repositories/listing_repository.dart';
import 'widgets/search_map_panel.dart';

final propertyDetailProvider = FutureProvider.family<PropertyModel, String>((
  ref,
  propertyId,
) async {
  return ref.watch(listingRepositoryProvider).getPropertyById(propertyId);
});

class PropertyDetailScreen extends ConsumerWidget {
  const PropertyDetailScreen({Key? key, required this.property})
    : super(key: key);

  final PropertyModel property;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertyAsync = ref.watch(propertyDetailProvider(property.id));
    final favIds = ref.watch(favoritedIdsProvider);
    final isFav = favIds.contains(property.id);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: Icon(
                isFav ? Icons.favorite : Icons.favorite_border,
                key: ValueKey(isFav),
                color: isFav ? Colors.redAccent : Colors.white,
              ),
            ),
            onPressed: () =>
                ref.read(favoriteProvider.notifier).toggle(property),
          ),
          IconButton(
            icon: const Icon(Icons.share, color: Colors.white),
            onPressed: () async {
              final lines = [
                property.title,
                property.locationLabel,
                '${property.price.toStringAsFixed(0)} ETB',
              ].where((value) => value.trim().isNotEmpty).join('\n');
              await Clipboard.setData(ClipboardData(text: lines));
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Listing details copied to clipboard.'),
                ),
              );
            },
          ),
        ],
      ),
      body: propertyAsync.when(
        data: (details) => _PropertyDetailsView(property: details),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => _PropertyDetailsView(property: property),
      ),
    );
  }
}

class _PropertyDetailsView extends ConsumerWidget {
  const _PropertyDetailsView({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(authProvider).user;
    final applicationsAsync = ref.watch(myApplicationsProvider);
    final submissionState = ref.watch(applicationSubmissionProvider);
    final existingApplication = ref.watch(
      propertyApplicationProvider(property.id),
    );
    final reviewsAsync = ref.watch(propertyReviewsProvider(property.id));
    final reviewActionState = ref.watch(reviewActionProvider);
    final transactions = ref.watch(transactionsProvider).valueOrNull ??
        const <TransactionModel>[];
    final isCustomer = currentUser?.role.toUpperCase() == 'CUSTOMER';
    final isOwnListing =
        currentUser != null &&
        property.owner != null &&
        currentUser.id == property.owner!.id;
    final canApply = isCustomer && !isOwnListing && property.owner != null;
    final canReview = isCustomer &&
        transactions.any(
          (transaction) =>
              transaction.propertyId == property.id && transaction.isCompleted,
        );
    final canPayForListing =
        existingApplication?.isAccepted == true &&
        property.owner?.chapaSubaccountId != null &&
        property.owner!.chapaSubaccountId!.isNotEmpty;
    final specs = <MapEntry<String, String>>[];
    if (property.isHome) {
      if (property.propertyType != null)
        specs.add(MapEntry('Type', property.propertyType!));
      if (property.bedrooms != null)
        specs.add(MapEntry('Bedrooms', '${property.bedrooms}'));
      if (property.bathrooms != null)
        specs.add(MapEntry('Bathrooms', '${property.bathrooms}'));
      if (property.area != null)
        specs.add(MapEntry('Area', '${property.area} m2'));
    } else {
      if (property.brand != null) specs.add(MapEntry('Brand', property.brand!));
      if (property.model != null) specs.add(MapEntry('Model', property.model!));
      if (property.year != null)
        specs.add(MapEntry('Year', '${property.year}'));
      if (property.transmission != null) {
        specs.add(MapEntry('Transmission', property.transmission!));
      }
      if (property.fuelType != null)
        specs.add(MapEntry('Fuel', property.fuelType!));
      if (property.mileage != null)
        specs.add(MapEntry('Mileage', '${property.mileage} km'));
    }

    return _buildWebDetailLayout(
      context: context,
      ref: ref,
      currentUser: currentUser,
      applicationsAsync: applicationsAsync,
      submissionState: submissionState,
      existingApplication: existingApplication,
      reviewsAsync: reviewsAsync,
      reviewActionState: reviewActionState,
      specs: specs,
      canApply: canApply,
      canReview: canReview,
      isOwnListing: isOwnListing,
      canPayForListing: canPayForListing,
    );
  }

  String _formatListingTypeLabel(String value) {
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

  Widget _buildSectionCard({
    required Widget child,
    EdgeInsets padding = const EdgeInsets.all(24),
  }) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 28,
            offset: Offset(0, 14),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildWebDetailLayout({
    required BuildContext context,
    required WidgetRef ref,
    required dynamic currentUser,
    required AsyncValue<List<PropertyApplication>> applicationsAsync,
    required ApplicationSubmissionState submissionState,
    required PropertyApplication? existingApplication,
    required AsyncValue<List<ReviewModel>> reviewsAsync,
    required ReviewActionState reviewActionState,
    required List<MapEntry<String, String>> specs,
    required bool canApply,
    required bool canReview,
    required bool isOwnListing,
    required bool canPayForListing,
  }) {
    final listingTypeLabels = property.listingTypes.isEmpty
        ? <String>[property.isHome ? 'For Sale' : 'Buy']
        : property.listingTypes.map(_formatListingTypeLabel).toList();

    return Container(
      color: const Color(0xFFF8FAFC),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1180),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back, size: 18),
                  label: const Text(
                    'Back to Listings',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.mutedForeground,
                    padding: EdgeInsets.zero,
                  ),
                ),
                const SizedBox(height: 12),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isWide = constraints.maxWidth >= 980;
                    if (!isWide) {
                      return Column(
                        children: [
                          _buildGalleryCard(),
                          const SizedBox(height: 20),
                          _buildBookingCard(
                            context: context,
                            ref: ref,
                            currentUser: currentUser,
                            applicationsAsync: applicationsAsync,
                            submissionState: submissionState,
                            existingApplication: existingApplication,
                            canApply: canApply,
                            isOwnListing: isOwnListing,
                            canPayForListing: canPayForListing,
                          ),
                        ],
                      );
                    }

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(flex: 2, child: _buildGalleryCard()),
                        const SizedBox(width: 24),
                        Expanded(
                          child: _buildBookingCard(
                            context: context,
                            ref: ref,
                            currentUser: currentUser,
                            applicationsAsync: applicationsAsync,
                            submissionState: submissionState,
                            existingApplication: existingApplication,
                            canApply: canApply,
                            isOwnListing: isOwnListing,
                            canPayForListing: canPayForListing,
                          ),
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 24),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isWide = constraints.maxWidth >= 980;
                    final mainColumn = Column(
                      children: [
                        _buildInfoCard(specs: specs),
                        const SizedBox(height: 20),
                        if (property.amenities.isNotEmpty) ...[
                          _buildAmenitiesCard(),
                          const SizedBox(height: 20),
                        ],
                        _buildReviewsCard(
                          ref: ref,
                          currentUser: currentUser,
                          reviewsAsync: reviewsAsync,
                          reviewActionState: reviewActionState,
                          canReview: canReview,
                        ),
                      ],
                    );
                    final sideColumn = Column(
                      children: [
                        _buildMapCard(),
                        const SizedBox(height: 20),
                        _buildAvailabilityCard(
                          listingTypeLabels: listingTypeLabels,
                        ),
                      ],
                    );

                    if (!isWide) {
                      return Column(
                        children: [
                          mainColumn,
                          const SizedBox(height: 20),
                          sideColumn,
                        ],
                      );
                    }

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(flex: 2, child: mainColumn),
                        const SizedBox(width: 24),
                        Expanded(child: sideColumn),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 24),
                Consumer(
                  builder: (context, ref, child) {
                    final similarAsync =
                        ref.watch(similarListingsProvider(property.id));
                    return similarAsync.when(
                      data: (items) {
                        if (items.isEmpty) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(top: 40),
                          child: SectionBlock(
                            title: 'Similar',
                            highlight:
                                property.isHome ? 'Properties' : 'Vehicles',
                            subtitle: 'More options like this in our inventory',
                            gradientBand: true,
                            child: ListingRail(items: items),
                          ),
                        );
                      },
                      loading: () => const Padding(
                        padding: EdgeInsets.symmetric(vertical: 40),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                      error: (_, __) => const SizedBox.shrink(),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGalleryCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 30,
            offset: Offset(0, 14),
          ),
        ],
      ),
      child: Column(
        children: [
          SizedBox(
            height: 420,
            width: double.infinity,
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(28),
              ),
              child: property.images.isNotEmpty
                  ? PageView.builder(
                      itemCount: property.images.length,
                      itemBuilder: (context, index) {
                        return CachedNetworkImage(
                          imageUrl: property.images[index],
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                            color: const Color(0xFFF3F4F6),
                            child: const Center(
                              child: CircularProgressIndicator(
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                          errorWidget: (_, __, ___) => const Center(
                            child: Icon(
                              Icons.broken_image_outlined,
                              color: AppTheme.mutedForeground,
                            ),
                          ),
                        );
                      },
                    )
                  : Container(
                      color: const Color(0xFFF3F4F6),
                      child: const Center(
                        child: Icon(
                          Icons.image_not_supported_outlined,
                          color: AppTheme.mutedForeground,
                          size: 60,
                        ),
                      ),
                    ),
            ),
          ),
          if (property.images.length > 1)
            Padding(
              padding: const EdgeInsets.all(14),
              child: SizedBox(
                height: 88,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: property.images.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    return ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: CachedNetworkImage(
                        imageUrl: property.images[index],
                        width: 110,
                        height: 88,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(
                          width: 110,
                          height: 88,
                          color: const Color(0xFFF3F4F6),
                        ),
                        errorWidget: (_, __, ___) => Container(
                          width: 110,
                          height: 88,
                          color: const Color(0xFFF3F4F6),
                          child: const Icon(
                            Icons.image_outlined,
                            color: AppTheme.mutedForeground,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBookingCard({
    required BuildContext context,
    required WidgetRef ref,
    required dynamic currentUser,
    required AsyncValue<List<PropertyApplication>> applicationsAsync,
    required ApplicationSubmissionState submissionState,
    required PropertyApplication? existingApplication,
    required bool canApply,
    required bool isOwnListing,
    required bool canPayForListing,
  }) {
    final primaryAction = _buildPrimaryAction(
      context: context,
      ref: ref,
      isAuthenticated: currentUser != null,
      isCheckingApplications: applicationsAsync.isLoading,
      canApply: canApply,
      canPayForListing: canPayForListing,
      existingApplication: existingApplication,
      isSubmitting: submissionState.isSubmitting,
    );
    final primaryLabel = _buildPrimaryLabel(
      property: property,
      existingApplication: existingApplication,
      isSubmitting: submissionState.isSubmitting,
      canPayForListing: canPayForListing,
      isAuthenticated: currentUser != null,
      canApply: canApply,
    );
    final ownerRoleLabel = property.owner?.role?.isNotEmpty == true
        ? property.owner!.role!
        : 'Property Owner';
    final messageLabel = existingApplication != null
        ? 'Message Owner'
        : property.isHome
        ? 'Book Viewing'
        : 'Ask About Vehicle';

    return _buildSectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ETB ${property.price.toStringAsFixed(0)}',
            style: const TextStyle(
              color: AppTheme.primary,
              fontSize: 32,
              fontWeight: FontWeight.w900,
            ),
          ),
          if (property.listingTypes.any((type) => type.toUpperCase() == 'RENT'))
            const Padding(
              padding: EdgeInsets.only(top: 4),
              child: Text(
                '/month',
                style: TextStyle(
                  color: AppTheme.mutedForeground,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          const SizedBox(height: 20),
          if (canApply && applicationsAsync.isLoading) ...[
            const LinearProgressIndicator(minHeight: 2),
            const SizedBox(height: 16),
          ],
          if (existingApplication != null) ...[
            _ApplicationStatusBanner(
              application: existingApplication,
              canPayForListing: canPayForListing,
            ),
            const SizedBox(height: 16),
          ],
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: primaryAction,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              icon: Icon(
                canPayForListing
                    ? Icons.lock_outline
                    : existingApplication == null
                    ? Icons.calendar_today_outlined
                    : Icons.schedule_outlined,
              ),
              label: Text(
                primaryLabel,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (property.owner != null) ...[
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.only(top: 20),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppTheme.border)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: AppTheme.primary.withOpacity(0.1),
                        backgroundImage: property.owner!.profileImage != null
                            ? CachedNetworkImageProvider(
                                property.owner!.profileImage!,
                              )
                            : null,
                        child: property.owner!.profileImage == null
                            ? Text(
                                property.owner!.name.characters.first
                                    .toUpperCase(),
                                style: const TextStyle(
                                  color: AppTheme.primary,
                                  fontWeight: FontWeight.w800,
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              property.owner!.name,
                              style: const TextStyle(
                                color: AppTheme.foreground,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text(
                              ownerRoleLabel,
                              style: const TextStyle(
                                color: AppTheme.mutedForeground,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: property.owner!.id.isEmpty
                          ? null
                          : () => context.push(
                                '/profile/view/${property.owner!.id}',
                              ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.primary,
                        side: BorderSide(
                          color: AppTheme.primary.withOpacity(0.2),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      icon: const Icon(Icons.person_outline_rounded),
                      label: Text(
                        property.owner!.role == 'AGENT'
                            ? 'See Agent Profile'
                            : 'See Owner Profile',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoCard({required List<MapEntry<String, String>> specs}) {
    final status = (property.status ?? 'AVAILABLE').toUpperCase();
    final statusBackground = status == 'AVAILABLE'
        ? const Color(0xFFDCFCE7)
        : status == 'SOLD' || status == 'RENTED'
        ? const Color(0xFFFFE4E6)
        : const Color(0xFFFEF3C7);
    final statusForeground = status == 'AVAILABLE'
        ? const Color(0xFF166534)
        : status == 'SOLD' || status == 'RENTED'
        ? const Color(0xFFBE123C)
        : const Color(0xFF92400E);

    return _buildSectionCard(
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
                      style: const TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.foreground,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 18,
                          color: AppTheme.primary,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            property.locationLabel,
                            style: const TextStyle(
                              color: AppTheme.mutedForeground,
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          color: Colors.amber,
                          size: 18,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${property.rating.toStringAsFixed(1)} (${property.reviewCount} reviews)',
                          style: const TextStyle(
                            color: AppTheme.mutedForeground,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: statusBackground,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  status.toLowerCase(),
                  style: TextStyle(
                    color: statusForeground,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.border),
            ),
            child: Wrap(
              spacing: 24,
              runSpacing: 16,
              children: property.isHome
                  ? [
                      _InlineStat(
                        icon: Icons.bed_outlined,
                        label: '${property.bedrooms ?? 0} Bedrooms',
                      ),
                      _InlineStat(
                        icon: Icons.bathtub_outlined,
                        label: '${property.bathrooms ?? 0} Bathrooms',
                      ),
                      _InlineStat(
                        icon: Icons.square_foot_outlined,
                        label:
                            '${(property.area ?? 0).toStringAsFixed(0)} sq m',
                      ),
                    ]
                  : [
                      _InlineStat(
                        icon: Icons.directions_car_outlined,
                        label: property.brand ?? 'Vehicle',
                      ),
                      _InlineStat(
                        icon: Icons.calendar_month_outlined,
                        label: '${property.year ?? '-'}',
                      ),
                      _InlineStat(
                        icon: Icons.settings_outlined,
                        label: property.transmission ?? 'Transmission',
                      ),
                    ],
            ),
          ),
          const SizedBox(height: 24),
          const SizedBox(height: 24),
          const Text(
            'Description',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppTheme.foreground,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            property.description,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              height: 1.65,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmenitiesCard() {
    return _buildSectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            property.isHome ? 'Amenities' : 'Features',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppTheme.foreground,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 18,
            runSpacing: 16,
            children: property.amenities
                .map(
                  (amenity) => SizedBox(
                    width: 180,
                    child: Row(
                      children: [
                        const Icon(
                          Icons.check_circle_rounded,
                          color: AppTheme.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            amenity,
                            style: const TextStyle(
                              color: AppTheme.foreground,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewsCard({
    required WidgetRef ref,
    required dynamic currentUser,
    required AsyncValue<List<ReviewModel>> reviewsAsync,
    required ReviewActionState reviewActionState,
    required bool canReview,
  }) {
    return _buildSectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Reviews',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppTheme.foreground,
            ),
          ),
          const SizedBox(height: 16),
          reviewsAsync.when(
            data: (reviews) {
              ReviewModel? myReview;
              if (currentUser != null) {
                for (final review in reviews) {
                  if (review.reviewerId == currentUser.id) {
                    myReview = review;
                    break;
                  }
                }
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (canReview)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: _ReviewComposerCard(
                        existingReview: myReview,
                        isSubmitting: reviewActionState.isLoading,
                        onSubmit: (rating, comment) async {
                          await ref
                              .read(reviewActionProvider.notifier)
                              .submitReview(
                                propertyId: property.id,
                                rating: rating,
                                comment: comment,
                              );
                          ref.invalidate(propertyDetailProvider(property.id));
                        },
                      ),
                    ),
                  if (reviews.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 20,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: const Text(
                        'No reviews yet. Completed customers can leave one after payment.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppTheme.mutedForeground,
                          height: 1.5,
                        ),
                      ),
                    )
                  else
                    Column(
                      children: reviews
                          .map(
                            (review) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _ReviewCard(
                                review: review,
                                canDelete: false,
                              ),
                            ),
                          )
                          .toList(),
                    ),
                ],
              );
            },
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, _) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                error.toString().replaceFirst('Exception: ', ''),
                style: const TextStyle(color: Colors.redAccent),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMapCard() {
    return _buildSectionCard(
      padding: const EdgeInsets.all(0),
      child: SizedBox(
        height: 300,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: SearchMapPanel(properties: [property]),
        ),
      ),
    );
  }

  Widget _buildAvailabilityCard({required List<String> listingTypeLabels}) {
    return _buildSectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Available For',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppTheme.foreground,
            ),
          ),
          const SizedBox(height: 16),
          Column(
            children: listingTypeLabels
                .map(
                  (label) => Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppTheme.primary.withOpacity(0.25),
                      ),
                      color: AppTheme.primary.withOpacity(0.04),
                    ),
                    child: Text(
                      label,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  VoidCallback? _buildPrimaryAction({
    required BuildContext context,
    required WidgetRef ref,
    required bool isAuthenticated,
    required bool isCheckingApplications,
    required bool canApply,
    required bool canPayForListing,
    required PropertyApplication? existingApplication,
    required bool isSubmitting,
  }) {
    if (isSubmitting || isCheckingApplications) {
      return null;
    }

    if (canPayForListing) {
      return () => _startCheckout(context);
    }

    if (!isAuthenticated) {
      return () => context.push('/login');
    }

    if (existingApplication == null && canApply) {
      return () => _showApplyDialog(context, ref);
    }

    if (existingApplication?.isAccepted == true) {
      return null;
    }

    if (existingApplication?.isPending == true ||
        existingApplication?.isRejected == true) {
      return () => context.push('/applications');
    }

    if (!canApply) {
      return null;
    }

    return () => _showApplyDialog(context, ref);
  }

  String _buildPrimaryLabel({
    required PropertyModel property,
    required PropertyApplication? existingApplication,
    required bool isSubmitting,
    required bool canPayForListing,
    required bool isAuthenticated,
    required bool canApply,
  }) {
    if (isSubmitting) {
      return 'Submitting...';
    }

    if (!isAuthenticated) {
      return 'Sign In to Apply';
    }

    if (canPayForListing) {
      return 'Pay & Secure Listing';
    }

    if (existingApplication?.isAccepted == true) {
      return 'Accepted - Awaiting Payout Setup';
    }

    if (existingApplication?.isPending == true) {
      return 'Application Pending';
    }

    if (existingApplication?.isRejected == true) {
      return 'View Application Status';
    }

    if (!canApply) {
      return 'Unavailable';
    }

    return property.listingTypes.isNotEmpty
        ? 'Apply for ${property.listingTypes.first.replaceAll('_', ' ')}'
        : property.isHome
        ? 'Apply for Listing'
        : 'Ask About Vehicle';
  }

  Future<void> _showApplyDialog(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    final submitted = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: Colors.white,
          title: const Text('Send Application'),
          content: TextField(
            controller: controller,
            minLines: 4,
            maxLines: 6,
            style: const TextStyle(color: AppTheme.foreground),
            decoration: InputDecoration(
              hintText:
                  'Tell the owner why you are interested in this listing.',
              hintStyle: const TextStyle(color: AppTheme.mutedForeground),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.border),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Submit'),
            ),
          ],
        );
      },
    );

    if (submitted != true) {
      controller.dispose();
      return;
    }

    try {
      await ref
          .read(applicationSubmissionProvider.notifier)
          .submit(propertyId: property.id, message: controller.text);
      controller.dispose();
      if (!context.mounted) {
        return;
      }

      _showMessage(context, 'Application submitted successfully.');
    } catch (error) {
      controller.dispose();
      if (!context.mounted) {
        return;
      }

      _showMessage(context, error.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _startCheckout(BuildContext context) {
    final owner = property.owner;
    if (owner == null ||
        owner.id.isEmpty ||
        owner.chapaSubaccountId == null ||
        owner.chapaSubaccountId!.isEmpty) {
      _showMessage(context, 'The owner has not configured payouts yet.');
      return;
    }

    context.push(
      '/checkout',
      extra: {
        'amount': property.price,
        'title': property.title,
        'category': property.listingTypes.isNotEmpty
            ? property.listingTypes.first.replaceAll('_', ' ')
            : 'Property payment',
        'propertyId': property.id,
        'payeeId': owner.id,
        'subaccountId': owner.chapaSubaccountId,
      },
    );
  }

  Future<void> _openConversation(
    BuildContext context,
    WidgetRef ref,
    String openingMessage,
  ) async {
    final owner = property.owner;
    if (owner == null || owner.id.isEmpty) {
      _showMessage(context, 'This listing has no chat target yet.');
      return;
    }

    final currentUser = ref.read(authProvider).user;
    if (currentUser == null) {
      context.push('/login');
      return;
    }

    if (currentUser.id == owner.id) {
      _showMessage(context, 'This is your own listing.');
      return;
    }

    try {
      await ref
          .read(chatRepositoryProvider)
          .initiateChat(receiverId: owner.id, content: openingMessage);
      ref.invalidate(chatConversationsProvider);
      if (!context.mounted) {
        return;
      }

      context.push(
        '/inbox/thread/${owner.id}',
        extra: {'name': owner.name, 'image': owner.profileImage},
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }

      _showMessage(context, error.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _showReviewDialog(
    BuildContext context,
    WidgetRef ref, {
    ReviewModel? existingReview,
  }) async {
    var rating = existingReview?.rating ?? 0;
    final controller = TextEditingController(
      text: existingReview?.comment ?? '',
    );

    final submitted = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: Colors.white,
              title: Text(
                existingReview == null ? 'Write a Review' : 'Update Review',
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Your rating',
                      style: TextStyle(color: AppTheme.mutedForeground),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        final star = index + 1;
                        return IconButton(
                          onPressed: () => setState(() => rating = star),
                          icon: Icon(
                            star <= rating ? Icons.star : Icons.star_border,
                            color: Colors.amber,
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: controller,
                      minLines: 4,
                      maxLines: 6,
                      style: const TextStyle(color: AppTheme.foreground),
                      decoration: InputDecoration(
                        hintText: 'What stood out about this property?',
                        hintStyle: const TextStyle(
                          color: AppTheme.mutedForeground,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppTheme.border),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: rating == 0
                      ? null
                      : () => Navigator.of(dialogContext).pop(true),
                  child: Text(existingReview == null ? 'Submit' : 'Update'),
                ),
              ],
            );
          },
        );
      },
    );

    if (submitted != true) {
      controller.dispose();
      return;
    }

    try {
      await ref
          .read(reviewActionProvider.notifier)
          .submitReview(
            propertyId: property.id,
            rating: rating,
            comment: controller.text.trim(),
          );
      controller.dispose();
      if (!context.mounted) return;
      _showMessage(context, 'Review saved successfully.');
      ref.invalidate(propertyDetailProvider(property.id));
    } catch (error) {
      controller.dispose();
      if (!context.mounted) return;
      _showMessage(context, error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _deleteReview(
    BuildContext context,
    WidgetRef ref,
    String reviewId,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('Delete Review'),
        content: const Text('This will remove your review from the property.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text(
              'Delete',
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    try {
      await ref
          .read(reviewActionProvider.notifier)
          .deleteReview(propertyId: property.id, reviewId: reviewId);
      if (!context.mounted) return;
      _showMessage(context, 'Review deleted.');
      ref.invalidate(propertyDetailProvider(property.id));
    } catch (error) {
      if (!context.mounted) return;
      _showMessage(context, error.toString().replaceFirst('Exception: ', ''));
    }
  }
}

class _InlineStat extends StatelessWidget {
  const _InlineStat({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: AppTheme.primary),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.foreground,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _ApplicationStatusBanner extends StatelessWidget {
  const _ApplicationStatusBanner({
    required this.application,
    required this.canPayForListing,
  });

  final PropertyApplication application;
  final bool canPayForListing;

  @override
  Widget build(BuildContext context) {
    final isAccepted = application.isAccepted;
    final isRejected = application.isRejected;

    final backgroundColor = isAccepted
        ? const Color(0x1A10B981)
        : isRejected
        ? const Color(0x1AF43F5E)
        : const Color(0x1AF59E0B);
    final accentColor = isAccepted
        ? const Color(0xFF34D399)
        : isRejected
        ? const Color(0xFFFB7185)
        : const Color(0xFFFBBF24);

    final message = isAccepted
        ? canPayForListing
              ? 'Your application has been accepted. You can secure the listing now.'
              : 'Your application has been accepted, but payout setup is still incomplete.'
        : isRejected
        ? 'This application was rejected. You can review it from your applications list.'
        : 'Your application is pending review by the owner or agent.';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: accentColor.withOpacity(0.22)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isAccepted
                ? Icons.check_circle_outline
                : isRejected
                ? Icons.cancel_outlined
                : Icons.pending_outlined,
            color: accentColor,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  application.status[0].toUpperCase() +
                      application.status.substring(1),
                  style: TextStyle(
                    color: accentColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  message,
                  style: const TextStyle(
                    color: AppTheme.mutedForeground,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewComposerCard extends ConsumerStatefulWidget {
  const _ReviewComposerCard({
    required this.isSubmitting,
    required this.onSubmit,
    this.existingReview,
  });

  final ReviewModel? existingReview;
  final bool isSubmitting;
  final Future<void> Function(int rating, String comment) onSubmit;

  @override
  ConsumerState<_ReviewComposerCard> createState() =>
      _ReviewComposerCardState();
}

class _ReviewComposerCardState extends ConsumerState<_ReviewComposerCard> {
  late final TextEditingController _controller;
  int _rating = 0;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: widget.existingReview?.comment ?? '',
    );
    _rating = widget.existingReview?.rating ?? 0;
  }

  @override
  void didUpdateWidget(covariant _ReviewComposerCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.existingReview?.id != widget.existingReview?.id) {
      _controller.text = widget.existingReview?.comment ?? '';
      _rating = widget.existingReview?.rating ?? 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existingReview != null;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.primary.withOpacity(0.18),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isEditing ? Icons.edit_outlined : Icons.star_rounded,
                color: isEditing ? AppTheme.primary : Colors.amber,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  isEditing ? 'Update Your Review' : 'Write a Review',
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            isEditing
                ? 'You have already reviewed this property. Update your rating or comment below.'
                : 'Share your experience with this property to help other customers.',
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.72),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.primary.withOpacity(0.1)),
            ),
            child: Column(
              children: [
                const Text(
                  'Your Rating',
                  style: TextStyle(
                    color: AppTheme.mutedForeground,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final star = index + 1;
                    return IconButton(
                      onPressed: widget.isSubmitting
                          ? null
                          : () => setState(() => _rating = star),
                      icon: Icon(
                        star <= _rating ? Icons.star : Icons.star_border,
                        color: Colors.amber,
                        size: 30,
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _controller,
            minLines: 4,
            maxLines: 6,
            enabled: !widget.isSubmitting,
            style: const TextStyle(color: AppTheme.foreground),
            decoration: InputDecoration(
              hintText: 'What did you like or dislike about this property?',
              hintStyle: const TextStyle(color: AppTheme.mutedForeground),
              filled: true,
              fillColor: Colors.white,
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
                borderSide: const BorderSide(color: AppTheme.primary),
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: widget.isSubmitting || _rating == 0
                  ? null
                  : () async {
                      await widget.onSubmit(_rating, _controller.text.trim());
                    },
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              icon: widget.isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.send_rounded, size: 18),
              label: Text(isEditing ? 'Update Review' : 'Submit Review'),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({
    required this.review,
    required this.canDelete,
    this.onDelete,
  });

  final ReviewModel review;
  final bool canDelete;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final author = review.author;
    final createdAt = review.createdAt;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 20,
                backgroundImage:
                    author?.profileImage != null &&
                        author!.profileImage!.isNotEmpty
                    ? CachedNetworkImageProvider(author.profileImage!)
                    : null,
                backgroundColor: const Color(0xFFE8F3EF),
                child:
                    author == null ||
                        author.profileImage == null ||
                        author.profileImage!.isEmpty
                    ? Text(
                        author?.name.isNotEmpty == true
                            ? author!.name.characters.first.toUpperCase()
                            : 'U',
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      author?.name ?? 'Customer',
                      style: const TextStyle(
                        color: AppTheme.foreground,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: List.generate(
                        5,
                        (index) => Icon(
                          index < review.rating
                              ? Icons.star
                              : Icons.star_border,
                          color: Colors.amber,
                          size: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (canDelete)
                IconButton(
                  onPressed: onDelete,
                  icon: const Icon(
                    Icons.delete_outline,
                    color: Colors.redAccent,
                  ),
                ),
            ],
          ),
          if (review.comment != null && review.comment!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              review.comment!,
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                height: 1.55,
              ),
            ),
          ],
          if (createdAt != null) ...[
            const SizedBox(height: 10),
            Text(
              '${createdAt.day}/${createdAt.month}/${createdAt.year}',
              style: const TextStyle(
                color: AppTheme.mutedForeground,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

