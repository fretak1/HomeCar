import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../favorites/providers/favorite_provider.dart';
import '../models/property_model.dart';

class ListingCard extends ConsumerWidget {
  const ListingCard({super.key, required this.property});

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
      shadowColor: Colors.black.withOpacity(0.06),
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
                          BadgeChip(text: _formatListingType(type)),
                        if (!property.isVerified)
                          const BadgeChip(
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
                          backgroundColor: Colors.white.withOpacity(0.92),
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
                                  '${property.brand ?? ''} ${property.model ?? ''} ${property.year ?? ''}'
                                      .trim(),
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

class BadgeChip extends StatelessWidget {
  const BadgeChip({
    super.key,
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

