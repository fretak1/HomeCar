import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../listings/models/property_model.dart';
import 'providers/public_profile_provider.dart';

class PublicProfileScreen extends ConsumerWidget {
  const PublicProfileScreen({Key? key, required this.userId}) : super(key: key);

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(publicUserProvider(userId));
    final listingsAsync = ref.watch(publicUserListingsProvider(userId));

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: userAsync.when(
        data: (user) {
          return CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GlassCard(
                        padding: const EdgeInsets.all(18),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 34,
                              backgroundColor: AppTheme.primary.withOpacity(
                                0.2,
                              ),
                              backgroundImage:
                                  user.profileImage != null &&
                                      user.profileImage!.isNotEmpty
                                  ? CachedNetworkImageProvider(
                                      user.profileImage!,
                                    )
                                  : null,
                              child:
                                  user.profileImage == null ||
                                      user.profileImage!.isEmpty
                                  ? Text(
                                      user.name.isNotEmpty
                                          ? user.name[0].toUpperCase()
                                          : 'U',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 24,
                                      ),
                                    )
                                  : null,
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user.name,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleLarge,
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 5,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppTheme.secondary.withOpacity(
                                            0.14,
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            999,
                                          ),
                                        ),
                                        child: Text(
                                          user.role,
                                          style: const TextStyle(
                                            color: AppTheme.secondary,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ),
                                      if (user.verified) ...[
                                        const SizedBox(width: 8),
                                        const Icon(
                                          Icons.verified,
                                          size: 18,
                                          color: AppTheme.secondary,
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    user.email,
                                    style: const TextStyle(
                                      color: Colors.white70,
                                    ),
                                  ),
                                  if (user.phoneNumber != null &&
                                      user.phoneNumber!.isNotEmpty) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      user.phoneNumber!,
                                      style: const TextStyle(
                                        color: Colors.white54,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        user.isAgent ? 'Managed Listings' : 'Listings',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                sliver: listingsAsync.when(
                  data: (listings) => listings.isEmpty
                      ? SliverToBoxAdapter(
                          child: GlassCard(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              child: Text(
                                user.isAgent
                                    ? 'No managed listings yet.'
                                    : 'No listings available yet.',
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.white54),
                              ),
                            ),
                          ),
                        )
                      : SliverList(
                          delegate: SliverChildBuilderDelegate((
                            context,
                            index,
                          ) {
                            final property = listings[index];
                            return Padding(
                              padding: EdgeInsets.only(
                                bottom: index == listings.length - 1 ? 0 : 12,
                              ),
                              child: _PublicListingCard(property: property),
                            );
                          }, childCount: listings.length),
                        ),
                  loading: () => const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  ),
                  error: (error, _) => SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Text(
                        error.toString().replaceFirst('Exception: ', ''),
                        style: const TextStyle(color: Colors.redAccent),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString().replaceFirst('Exception: ', ''),
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.redAccent),
            ),
          ),
        ),
      ),
    );
  }
}

class _PublicListingCard extends StatelessWidget {
  const _PublicListingCard({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: () => context.push('/property-detail', extra: property),
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: Colors.white10,
              image: property.images.isNotEmpty
                  ? DecorationImage(
                      image: CachedNetworkImageProvider(property.images.first),
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
                  '${property.price.toStringAsFixed(0)} ETB',
                  style: const TextStyle(
                    color: AppTheme.secondary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  property.locationLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          const Icon(Icons.chevron_right, color: Colors.white38),
        ],
      ),
    );
  }
}
