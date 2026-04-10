import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/dio_client.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../listings/models/property_model.dart';
import 'providers/admin_provider.dart';

class AdminPropertyReviewScreen extends ConsumerStatefulWidget {
  const AdminPropertyReviewScreen({super.key, required this.propertyId});

  final String propertyId;

  @override
  ConsumerState<AdminPropertyReviewScreen> createState() =>
      _AdminPropertyReviewScreenState();
}

class _AdminPropertyReviewScreenState
    extends ConsumerState<AdminPropertyReviewScreen> {
  bool _isOpeningDocument = false;

  @override
  Widget build(BuildContext context) {
    final propertyAsync = ref.watch(
      adminPropertyDetailProvider(widget.propertyId),
    );
    final actionState = ref.watch(adminVerificationProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Property Verification Review')),
      body: propertyAsync.when(
        data: (property) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: [
            _PropertyHeroCard(property: property),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Listing Summary',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  _InfoRow(label: 'Asset type', value: property.assetType),
                  _InfoRow(label: 'Location', value: property.locationLabel),
                  _InfoRow(
                    label: 'Created',
                    value: property.createdAt == null
                        ? 'Unknown'
                        : '${property.createdAt!.day}/${property.createdAt!.month}/${property.createdAt!.year}',
                  ),
                  if (property.isHome) ...[
                    _InfoRow(
                      label: 'Property type',
                      value: property.propertyType ?? 'N/A',
                    ),
                    _InfoRow(
                      label: 'Bedrooms',
                      value: '${property.bedrooms ?? 0}',
                    ),
                    _InfoRow(
                      label: 'Bathrooms',
                      value: '${property.bathrooms ?? 0}',
                    ),
                    _InfoRow(
                      label: 'Area',
                      value: '${property.area?.toStringAsFixed(0) ?? '0'} m2',
                    ),
                  ] else ...[
                    _InfoRow(label: 'Brand', value: property.brand ?? 'N/A'),
                    _InfoRow(label: 'Model', value: property.model ?? 'N/A'),
                    _InfoRow(label: 'Year', value: '${property.year ?? 0}'),
                    _InfoRow(
                      label: 'Mileage',
                      value: property.mileage == null
                          ? 'N/A'
                          : '${property.mileage!.toStringAsFixed(0)} km',
                    ),
                  ],
                  if (property.amenities.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    const Text(
                      'Amenities',
                      style: TextStyle(
                        color: Colors.white70,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: property.amenities
                          .map(
                            (item) => Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: Colors.white10),
                              ),
                              child: Text(
                                item,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Description',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    property.description.trim().isEmpty
                        ? 'No description provided.'
                        : property.description,
                    style: const TextStyle(color: Colors.white70, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Owner Verification',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    property.owner?.name ?? 'Unknown owner',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  if (property.owner?.role?.trim().isNotEmpty == true) ...[
                    const SizedBox(height: 4),
                    Text(
                      property.owner!.role!,
                      style: const TextStyle(color: Colors.white70),
                    ),
                  ],
                  const SizedBox(height: 14),
                  _OwnerPhotoCard(source: property.owner?.verificationPhoto),
                  const SizedBox(height: 14),
                  _PropertyDocumentCard(
                    property: property,
                    isOpening: _isOpeningDocument,
                    onOpen: property.ownershipDocuments.isEmpty
                        ? null
                        : () => _openDocumentPreview(property),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Review Decision',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Approve once the ownership proof and owner identity clearly support this listing.',
                    style: TextStyle(color: Colors.white70, height: 1.45),
                  ),
                  if (property.rejectionReason?.trim().isNotEmpty == true) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.redAccent.withOpacity(0.25),
                        ),
                      ),
                      child: Text(
                        property.rejectionReason!,
                        style: const TextStyle(color: Colors.redAccent),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed:
                              actionState.isLoading || property.isVerified
                              ? null
                              : () => _verify(property, true),
                          child: Text(
                            property.isVerified
                                ? 'Already Verified'
                                : 'Approve',
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: actionState.isLoading
                              ? null
                              : () => _verify(property, false),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.redAccent,
                          ),
                          child: const Text('Reject'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString().replaceFirst('Exception: ', ''),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openDocumentPreview(PropertyModel property) async {
    final document = property.ownershipDocuments.first;
    setState(() => _isOpeningDocument = true);
    try {
      final dataUri = await ref.read(
        propertyDocumentDataUriProvider(document.id).future,
      );
      if (!mounted) {
        return;
      }
      context.push(
        '/admin/document',
        extra: {'title': '${property.title} document', 'source': dataUri},
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isOpeningDocument = false);
      }
    }
  }

  Future<void> _verify(PropertyModel property, bool approved) async {
    String? reason;
    if (!approved) {
      reason = await _askForReason(
        context,
        'Why are you rejecting this property?',
      );
      if (!mounted || reason == null) {
        return;
      }
    }

    try {
      await ref
          .read(adminVerificationProvider.notifier)
          .verifyProperty(
            propertyId: property.id,
            isVerified: approved,
            rejectionReason: reason,
          );
      ref.invalidate(pendingPropertiesProvider);
      ref.invalidate(adminPropertyDetailProvider(property.id));
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Property ${approved ? 'approved' : 'rejected'}'),
        ),
      );
      context.pop();
    } catch (error) {
      if (!mounted) {
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

class _PropertyHeroCard extends StatelessWidget {
  const _PropertyHeroCard({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (property.mainImage.isNotEmpty)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              child: CachedNetworkImage(
                imageUrl: _resolveSource(property.mainImage),
                height: 220,
                width: double.infinity,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => Container(
                  height: 220,
                  color: Colors.white.withOpacity(0.04),
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.image_not_supported_outlined,
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        property.title,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    const SizedBox(width: 12),
                    _Pill(
                      label: property.isVerified ? 'Verified' : 'Pending',
                      color: property.isVerified
                          ? const Color(0xFF34D399)
                          : const Color(0xFFFBBF24),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  property.locationLabel,
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 10),
                Text(
                  '${property.price.toStringAsFixed(0)} ETB',
                  style: const TextStyle(
                    color: AppTheme.secondary,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
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

class _OwnerPhotoCard extends StatelessWidget {
  const _OwnerPhotoCard({this.source});

  final String? source;

  @override
  Widget build(BuildContext context) {
    if (source?.trim().isEmpty ?? true) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.04),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white10),
        ),
        child: const Text(
          'No owner verification photo has been uploaded yet.',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: CachedNetworkImage(
        imageUrl: _resolveSource(source!),
        height: 220,
        width: double.infinity,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => Container(
          height: 220,
          color: Colors.white.withOpacity(0.04),
          alignment: Alignment.center,
          child: const Icon(
            Icons.person_outline,
            color: Colors.white54,
            size: 42,
          ),
        ),
      ),
    );
  }
}

class _PropertyDocumentCard extends StatelessWidget {
  const _PropertyDocumentCard({
    required this.property,
    required this.isOpening,
    required this.onOpen,
  });

  final PropertyModel property;
  final bool isOpening;
  final VoidCallback? onOpen;

  @override
  Widget build(BuildContext context) {
    final hasDocument = property.ownershipDocuments.isNotEmpty;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.description_outlined, color: AppTheme.secondary),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Ownership Document',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            hasDocument
                ? 'A secure preview is available for the document submitted with this listing.'
                : 'No ownership document has been uploaded yet.',
            style: const TextStyle(color: Colors.white70, height: 1.4),
          ),
          if (hasDocument) ...[
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: isOpening ? null : onOpen,
              icon: isOpening
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.open_in_new),
              label: const Text('Preview Document'),
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(color: Colors.white54)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.16),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

Future<String?> _askForReason(BuildContext context, String title) async {
  final controller = TextEditingController();
  final result = await showDialog<String>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: const Color(0xFF1E293B),
      title: Text(title),
      content: TextField(
        controller: controller,
        minLines: 3,
        maxLines: 5,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: 'Optional rejection reason',
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
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(dialogContext).pop(controller.text),
          child: const Text('Submit'),
        ),
      ],
    ),
  );
  controller.dispose();
  return result;
}

String _resolveSource(String source) {
  if (source.startsWith('http') || source.startsWith('data:')) {
    return source;
  }
  return '${DioClient.baseUrl}$source';
}
