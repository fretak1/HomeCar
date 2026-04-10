import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../listings/models/property_model.dart';
import 'models/application_model.dart';
import 'providers/application_provider.dart';

class ApplicationsScreen extends ConsumerWidget {
  const ApplicationsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final applicationsAsync = ref.watch(myApplicationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Applications'),
        actions: [
          IconButton(
            onPressed: () => ref.invalidate(myApplicationsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: applicationsAsync.when(
        data: (applications) {
          if (applications.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 80),
                _EmptyApplications(onExplore: () => context.go('/explore')),
              ],
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(myApplicationsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
              itemCount: applications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final application = applications[index];
                return _ApplicationCard(application: application);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 80),
            _EmptyApplications(
              title: 'Could not load applications',
              message: error.toString().replaceFirst('Exception: ', ''),
              actionLabel: 'Retry',
              onExplore: () => ref.invalidate(myApplicationsProvider),
            ),
          ],
        ),
      ),
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  const _ApplicationCard({required this.application});

  final PropertyApplication application;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (application.propertyImage != null &&
              application.propertyImage!.isNotEmpty)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              child: CachedNetworkImage(
                imageUrl: application.propertyImage!,
                height: 170,
                width: double.infinity,
                fit: BoxFit.cover,
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
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            application.propertyTitle,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            application.propertyLocation,
                            style: const TextStyle(color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    _StatusChip(status: application.status),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '${application.price.toStringAsFixed(0)} ETB',
                  style: const TextStyle(
                    color: AppTheme.secondary,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${application.listingLabel}${application.dateLabel != null ? ' - ${application.dateLabel}' : ''}',
                  style: const TextStyle(color: Colors.white54, fontSize: 13),
                ),
                if (application.message != null &&
                    application.message!.trim().isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    application.message!,
                    style: const TextStyle(color: Colors.white70, height: 1.4),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => context.push(
                          '/property-detail',
                          extra: _buildPropertyStub(application),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white24),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: const Text('Open Listing'),
                      ),
                    ),
                    if (application.isAccepted) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed:
                              application.managerChapaSubaccountId == null ||
                                  application.managerChapaSubaccountId!.isEmpty
                              ? null
                              : () => context.push(
                                  '/checkout',
                                  extra: {
                                    'amount': application.price,
                                    'title': application.propertyTitle,
                                    'category': application.listingLabel,
                                    'propertyId': application.propertyId,
                                    'payeeId': application.managerId,
                                    'subaccountId':
                                        application.managerChapaSubaccountId,
                                  },
                                ),
                          child: const Text('Pay Now'),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  PropertyModel _buildPropertyStub(PropertyApplication application) {
    return PropertyModel(
      id: application.propertyId,
      title: application.propertyTitle,
      description: application.message ?? '',
      price: application.price,
      assetType: application.assetType,
      images:
          application.propertyImage != null &&
              application.propertyImage!.isNotEmpty
          ? [application.propertyImage!]
          : const [],
      owner: PropertyOwner(
        id: application.managerId,
        name: application.managerName ?? 'Owner',
        profileImage: application.managerProfileImage,
        chapaSubaccountId: application.managerChapaSubaccountId,
      ),
      city: application.propertyLocation,
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toLowerCase();
    Color background;
    Color foreground;

    switch (normalized) {
      case 'accepted':
        background = const Color(0x1A10B981);
        foreground = const Color(0xFF34D399);
        break;
      case 'rejected':
        background = const Color(0x1AF43F5E);
        foreground = const Color(0xFFFB7185);
        break;
      default:
        background = const Color(0x1AF59E0B);
        foreground = const Color(0xFFFBBF24);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        normalized[0].toUpperCase() + normalized.substring(1),
        style: TextStyle(
          color: foreground,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _EmptyApplications extends StatelessWidget {
  const _EmptyApplications({
    required this.onExplore,
    this.title = 'No applications yet',
    this.message =
        'Apply to a listing and it will show up here with the latest status.',
    this.actionLabel = 'Explore Listings',
  });

  final VoidCallback onExplore;
  final String title;
  final String message;
  final String actionLabel;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.assignment_outlined,
            color: AppTheme.secondary.withOpacity(0.95),
            size: 42,
          ),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, height: 1.5),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onExplore,
              child: Text(actionLabel),
            ),
          ),
        ],
      ),
    );
  }
}
