import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../chat/providers/chat_provider.dart';
import '../chat/repositories/chat_repository.dart';
import 'models/application_model.dart';
import 'providers/application_provider.dart';

class ManagedApplicationsScreen extends ConsumerWidget {
  const ManagedApplicationsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final applicationsAsync = ref.watch(managedApplicationsProvider);
    final updateState = ref.watch(applicationStatusUpdateProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Listing Applications'),
        actions: [
          IconButton(
            onPressed: () => ref.invalidate(managedApplicationsProvider),
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
              children: const [
                SizedBox(height: 80),
                _EmptyManagedApplications(),
              ],
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(managedApplicationsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
              itemCount: applications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final application = applications[index];
                return _ManagedApplicationCard(
                  application: application,
                  isUpdating: updateState.isLoading,
                );
              },
            ),
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

class _ManagedApplicationCard extends ConsumerWidget {
  const _ManagedApplicationCard({
    required this.application,
    required this.isUpdating,
  });

  final PropertyApplication application;
  final bool isUpdating;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Avatar(
                name: application.customerName ?? 'C',
                imageUrl: application.customerProfileImage,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      application.customerName ?? 'Customer',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      application.propertyTitle,
                      style: const TextStyle(color: Colors.white70),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${application.listingLabel} - ${application.price.toStringAsFixed(0)} ETB',
                      style: const TextStyle(color: AppTheme.secondary),
                    ),
                  ],
                ),
              ),
              _ManagerStatusChip(status: application.status),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            application.propertyLocation,
            style: const TextStyle(color: Colors.white54, fontSize: 13),
          ),
          if (application.message != null &&
              application.message!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              application.message!,
              style: const TextStyle(color: Colors.white70, height: 1.5),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _messageCustomer(context, ref),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white24),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Message'),
                ),
              ),
              if (application.isAccepted) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      final created = await context.push(
                        '/leases/create',
                        extra: {'application': application},
                      );
                      if (created == true) {
                        ref.invalidate(managedApplicationsProvider);
                      }
                    },
                    child: const Text('Create Lease'),
                  ),
                ),
              ],
              if (application.isPending) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: isUpdating
                        ? null
                        : () => _updateStatus(context, ref, 'accepted'),
                    child: const Text('Accept'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: isUpdating
                        ? null
                        : () => _updateStatus(context, ref, 'rejected'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.redAccent,
                    ),
                    child: const Text('Reject'),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _updateStatus(
    BuildContext context,
    WidgetRef ref,
    String status,
  ) async {
    try {
      await ref
          .read(applicationStatusUpdateProvider.notifier)
          .updateStatus(applicationId: application.id, status: status);
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Application ${status == 'accepted' ? 'accepted' : 'rejected'}',
          ),
        ),
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
    }
  }

  Future<void> _messageCustomer(BuildContext context, WidgetRef ref) async {
    if (application.customerId.isEmpty) {
      return;
    }

    try {
      await ref
          .read(chatRepositoryProvider)
          .initiateChat(
            receiverId: application.customerId,
            content:
                'Hello, I am following up on your application for ${application.propertyTitle}.',
          );
      ref.invalidate(chatConversationsProvider);
      if (!context.mounted) {
        return;
      }

      context.push(
        '/inbox/thread/${application.customerId}',
        extra: {
          'name': application.customerName,
          'image': application.customerProfileImage,
        },
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
    }
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.name, this.imageUrl});

  final String name;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final trimmedImage = imageUrl?.trim();
    return CircleAvatar(
      radius: 24,
      backgroundColor: Colors.white12,
      backgroundImage: trimmedImage != null && trimmedImage.isNotEmpty
          ? CachedNetworkImageProvider(trimmedImage)
          : null,
      child: trimmedImage == null || trimmedImage.isEmpty
          ? Text(
              name.isEmpty ? '?' : name.characters.first.toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            )
          : null,
    );
  }
}

class _ManagerStatusChip extends StatelessWidget {
  const _ManagerStatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toLowerCase();
    final background = normalized == 'accepted'
        ? const Color(0x1A10B981)
        : normalized == 'rejected'
        ? const Color(0x1AF43F5E)
        : const Color(0x1AF59E0B);
    final foreground = normalized == 'accepted'
        ? const Color(0xFF34D399)
        : normalized == 'rejected'
        ? const Color(0xFFFB7185)
        : const Color(0xFFFBBF24);

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
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _EmptyManagedApplications extends StatelessWidget {
  const _EmptyManagedApplications();

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.inbox_outlined,
            color: AppTheme.secondary.withOpacity(0.95),
            size: 42,
          ),
          const SizedBox(height: 16),
          Text(
            'No applications yet',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          const Text(
            'Customer applications for your listings will show up here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white70, height: 1.5),
          ),
        ],
      ),
    );
  }
}
