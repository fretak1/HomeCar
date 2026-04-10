import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../applications/models/application_model.dart';
import '../applications/providers/application_provider.dart';
import '../auth/providers/auth_provider.dart';
import '../chat/providers/chat_provider.dart';
import '../chat/repositories/chat_repository.dart';
import '../reviews/models/review_model.dart';
import '../reviews/providers/review_provider.dart';
import '../../shared/widgets/glass_card.dart';
import '../favorites/providers/favorite_provider.dart';
import 'models/property_model.dart';
import 'repositories/listing_repository.dart';

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
    final isCustomer = currentUser?.role.toUpperCase() == 'CUSTOMER';
    final isOwnListing =
        currentUser != null &&
        property.owner != null &&
        currentUser.id == property.owner!.id;
    final canApply = isCustomer && !isOwnListing && property.owner != null;
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

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 350,
            width: double.infinity,
            child: property.images.isNotEmpty
                ? PageView.builder(
                    itemCount: property.images.length,
                    itemBuilder: (context, index) {
                      return CachedNetworkImage(
                        imageUrl: property.images[index],
                        fit: BoxFit.cover,
                        placeholder: (_, __) =>
                            const Center(child: CircularProgressIndicator()),
                        errorWidget: (_, __, ___) =>
                            const Icon(Icons.error, color: Colors.white54),
                      );
                    },
                  )
                : Container(
                    color: Colors.white12,
                    child: const Center(
                      child: Icon(
                        Icons.image_not_supported,
                        color: Colors.white54,
                        size: 60,
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        property.title,
                        style: Theme.of(
                          context,
                        ).textTheme.displayLarge?.copyWith(fontSize: 28),
                      ),
                    ),
                    if (property.isVerified)
                      const Padding(
                        padding: EdgeInsets.only(top: 8, left: 8),
                        child: Icon(
                          Icons.verified,
                          color: AppTheme.secondary,
                          size: 28,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${property.price.toStringAsFixed(0)} ETB',
                  style: const TextStyle(
                    color: AppTheme.secondary,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  property.locationLabel,
                  style: const TextStyle(color: Colors.white60),
                ),
                if (property.reviewCount > 0) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 18, color: Colors.amber),
                      const SizedBox(width: 6),
                      Text(
                        '${property.rating.toStringAsFixed(1)} (${property.reviewCount} reviews)',
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 20),
                if (specs.isNotEmpty) ...[
                  Text(
                    'Highlights',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: specs
                        .map(
                          (entry) => GlassCard(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  entry.key,
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 11,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  entry.value,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 24),
                ],
                if (property.owner != null) ...[
                  Text(
                    'Owner / Lister',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  GlassCard(
                    onTap: property.owner!.id.isEmpty
                        ? null
                        : () => context.push(
                            '/profile/view/${property.owner!.id}',
                          ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundImage: property.owner!.profileImage != null
                              ? CachedNetworkImageProvider(
                                  property.owner!.profileImage!,
                                )
                              : null,
                          child: property.owner!.profileImage == null
                              ? Text(
                                  property.owner!.name.characters.first
                                      .toUpperCase(),
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
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (property.owner!.role != null)
                                Text(
                                  property.owner!.role!,
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                Text(
                  'Description',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  property.description,
                  style: const TextStyle(color: Colors.white70, height: 1.5),
                ),
                if (property.amenities.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Text(
                    'Features',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: property.amenities
                        .map(
                          (amenity) => Chip(
                            label: Text(amenity),
                            backgroundColor: Colors.white10,
                            labelStyle: const TextStyle(color: Colors.white),
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: 24),
                Text('Reviews', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
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
                        if (currentUser != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                onPressed: reviewActionState.isLoading
                                    ? null
                                    : () => _showReviewDialog(
                                        context,
                                        ref,
                                        existingReview: myReview,
                                      ),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.white,
                                  side: const BorderSide(color: Colors.white24),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                ),
                                icon: Icon(
                                  myReview == null
                                      ? Icons.rate_review_outlined
                                      : Icons.edit_outlined,
                                ),
                                label: Text(
                                  myReview == null
                                      ? 'Write a Review'
                                      : 'Update Your Review',
                                ),
                              ),
                            ),
                          ),
                        if (reviews.isEmpty)
                          const GlassCard(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 18),
                              child: Center(
                                child: Text(
                                  'No reviews yet. Completed customers can leave one after payment.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.white54),
                                ),
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
                                      canDelete:
                                          currentUser?.id == review.reviewerId,
                                      onDelete: reviewActionState.isLoading
                                          ? null
                                          : () => _deleteReview(
                                              context,
                                              ref,
                                              review.id,
                                            ),
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
                const SizedBox(height: 32),
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
                  child: ElevatedButton.icon(
                    onPressed: _buildPrimaryAction(
                      context: context,
                      ref: ref,
                      isAuthenticated: currentUser != null,
                      isCheckingApplications: applicationsAsync.isLoading,
                      canApply: canApply,
                      canPayForListing: canPayForListing,
                      existingApplication: existingApplication,
                      isSubmitting: submissionState.isSubmitting,
                    ),
                    icon: Icon(
                      canPayForListing
                          ? Icons.lock_outline
                          : existingApplication == null
                          ? Icons.assignment_turned_in_outlined
                          : Icons.schedule,
                    ),
                    label: Text(
                      _buildPrimaryLabel(
                        property: property,
                        existingApplication: existingApplication,
                        isSubmitting: submissionState.isSubmitting,
                        canPayForListing: canPayForListing,
                        isAuthenticated: currentUser != null,
                        canApply: canApply,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: property.owner == null || isOwnListing
                        ? null
                        : () => _openConversation(
                            context,
                            ref,
                            existingApplication != null
                                ? 'Hello, I am following up on my application for ${property.title}.'
                                : property.isHome
                                ? 'Hello, I would like to arrange a viewing for ${property.title}.'
                                : 'Hello, I would like more details about ${property.title}.',
                          ),
                    style: TextButton.styleFrom(
                      side: const BorderSide(color: AppTheme.primary),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      existingApplication != null
                          ? 'Message Owner'
                          : property.isHome
                          ? 'Book Viewing'
                          : 'Ask About Vehicle',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
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
          backgroundColor: const Color(0xFF1E293B),
          title: const Text('Send Application'),
          content: TextField(
            controller: controller,
            minLines: 4,
            maxLines: 6,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText:
                  'Tell the owner why you are interested in this listing.',
              hintStyle: const TextStyle(color: Colors.white38),
              filled: true,
              fillColor: Colors.white.withOpacity(0.06),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
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
              backgroundColor: const Color(0xFF1E293B),
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
                      style: TextStyle(color: Colors.white70),
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
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'What stood out about this property?',
                        hintStyle: const TextStyle(color: Colors.white38),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.06),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
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
        backgroundColor: const Color(0xFF1E293B),
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
        border: Border.all(color: accentColor.withOpacity(0.35)),
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
                  style: const TextStyle(color: Colors.white70, height: 1.4),
                ),
              ],
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
    return GlassCard(
      padding: const EdgeInsets.all(14),
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
                backgroundColor: Colors.white12,
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
                      style: const TextStyle(fontWeight: FontWeight.bold),
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
              style: const TextStyle(color: Colors.white70, height: 1.45),
            ),
          ],
          if (createdAt != null) ...[
            const SizedBox(height: 10),
            Text(
              '${createdAt.day}/${createdAt.month}/${createdAt.year}',
              style: const TextStyle(color: Colors.white54, fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }
}
