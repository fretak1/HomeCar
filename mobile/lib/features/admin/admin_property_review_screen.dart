import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/dio_client.dart';
import '../../core/theme/app_theme.dart';
import '../dashboard/widgets/dashboard_page_scaffold.dart';
import '../dashboard/widgets/dashboard_utils.dart';
import '../dashboard/widgets/role_dashboard_scaffold.dart';
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
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            DashboardPageHeader(
              title: 'Verify Property Ownership',
              subtitle:
                  'Review the listing details, owner proof, and ownership document before approving this property.',
              onBack: () => Navigator.of(context).maybePop(),
            ),
            Expanded(
              child: propertyAsync.when(
                data: (property) => SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1100),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final stacked = constraints.maxWidth < 900;
                          final details = _DetailsColumn(
                            property: property,
                            actionState: actionState,
                            onVerify: (approved) => _verify(property, approved),
                          );
                          final evidence = _EvidenceColumn(
                            property: property,
                            isOpeningDocument: _isOpeningDocument,
                            onOpenDocument: property.ownershipDocuments.isEmpty
                                ? null
                                : () => _openDocumentPreview(property),
                          );

                          if (stacked) {
                            return Column(
                              children: [
                                details,
                                const SizedBox(height: 16),
                                evidence,
                              ],
                            );
                          }

                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: details),
                              const SizedBox(width: 16),
                              Expanded(child: evidence),
                            ],
                          );
                        },
                      ),
                    ),
                  ),
                ),
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: DashboardLoadingState(
                      label: 'Loading property review...',
                    ),
                  ),
                ),
                error: (error, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: DashboardEmptyState(
                      title: 'Property review unavailable',
                      message: error.toString().replaceFirst(
                            'Exception: ',
                            '',
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
      await ref.read(adminVerificationProvider.notifier).verifyProperty(
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

class _DetailsColumn extends StatelessWidget {
  const _DetailsColumn({
    required this.property,
    required this.actionState,
    required this.onVerify,
  });

  final PropertyModel property;
  final AdminVerificationState actionState;
  final ValueChanged<bool> onVerify;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        DashboardSectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (property.mainImage.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: CachedNetworkImage(
                    imageUrl: _resolveSource(property.mainImage),
                    height: 240,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
              if (property.mainImage.isNotEmpty) const SizedBox(height: 16),
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
                            color: AppTheme.foreground,
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          property.locationLabel,
                          style: const TextStyle(
                            color: AppTheme.mutedForeground,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  DashboardStatusPill(
                    label: property.isVerified ? 'Verified' : 'Pending review',
                    color: property.isVerified
                        ? const Color(0xFF059669)
                        : const Color(0xFFD97706),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                formatDashboardMoney(property.price),
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        DashboardSectionCard(
          title: 'Property details',
          child: Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              DashboardMetricTile(
                icon: Icons.category_outlined,
                label: property.isCar
                    ? prettyDashboardLabel(property.brand ?? 'Car')
                    : prettyDashboardLabel(property.propertyType ?? 'Property'),
              ),
              DashboardMetricTile(
                icon: Icons.apartment_outlined,
                label: prettyDashboardLabel(property.assetType),
              ),
              DashboardMetricTile(
                icon: Icons.calendar_today_outlined,
                label: property.createdAt == null
                    ? 'Unknown date'
                    : formatDashboardDate(property.createdAt),
              ),
              if (property.isHome)
                DashboardMetricTile(
                  icon: Icons.bed_outlined,
                  label: '${property.bedrooms ?? 0} bedrooms',
                ),
              if (property.isHome)
                DashboardMetricTile(
                  icon: Icons.bathtub_outlined,
                  label: '${property.bathrooms ?? 0} bathrooms',
                ),
              if (property.isHome)
                DashboardMetricTile(
                  icon: Icons.square_foot_outlined,
                  label: '${property.area?.toStringAsFixed(0) ?? '0'} m2',
                ),
              if (property.isCar)
                DashboardMetricTile(
                  icon: Icons.directions_car_outlined,
                  label: prettyDashboardLabel(property.model ?? 'Vehicle'),
                ),
              if (property.isCar)
                DashboardMetricTile(
                  icon: Icons.local_gas_station_outlined,
                  label: prettyDashboardLabel(property.fuelType ?? 'Fuel'),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        DashboardSectionCard(
          title: 'Description',
          child: Text(
            property.description.trim().isEmpty
                ? 'No description provided.'
                : property.description,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              height: 1.6,
            ),
          ),
        ),
        const SizedBox(height: 16),
        DashboardSectionCard(
          title: 'Verification decision',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Approve once the ownership proof and owner identity clearly support this listing.',
                style: TextStyle(
                  color: AppTheme.mutedForeground,
                  height: 1.5,
                ),
              ),
              if (property.rejectionReason?.trim().isNotEmpty == true) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Text(
                    property.rejectionReason!,
                    style: const TextStyle(
                      color: Color(0xFFB91C1C),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              LayoutBuilder(
                builder: (context, constraints) {
                  final stacked = constraints.maxWidth < 460;
                  final approve = FilledButton.icon(
                    onPressed:
                        actionState.isLoading || property.isVerified
                            ? null
                            : () => onVerify(true),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.check_rounded, size: 18),
                    label: Text(
                      property.isVerified ? 'Already verified' : 'Approve',
                    ),
                  );
                  final reject = OutlinedButton.icon(
                    onPressed: actionState.isLoading ? null : () => onVerify(false),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFDC2626),
                      side: const BorderSide(color: Color(0xFFFECACA)),
                    ),
                    icon: const Icon(Icons.close_rounded, size: 18),
                    label: const Text('Reject'),
                  );

                  if (stacked) {
                    return Column(
                      children: [
                        SizedBox(width: double.infinity, child: approve),
                        const SizedBox(height: 12),
                        SizedBox(width: double.infinity, child: reject),
                      ],
                    );
                  }

                  return Row(
                    children: [
                      Expanded(child: approve),
                      const SizedBox(width: 12),
                      Expanded(child: reject),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _EvidenceColumn extends StatelessWidget {
  const _EvidenceColumn({
    required this.property,
    required this.isOpeningDocument,
    required this.onOpenDocument,
  });

  final PropertyModel property;
  final bool isOpeningDocument;
  final VoidCallback? onOpenDocument;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        DashboardSectionCard(
          title: 'Owner verification',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                property.owner?.name ?? 'Unknown owner',
                style: const TextStyle(
                  color: AppTheme.foreground,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (property.owner?.role?.trim().isNotEmpty == true) ...[
                const SizedBox(height: 4),
                Text(
                  property.owner!.role!,
                  style: const TextStyle(color: AppTheme.mutedForeground),
                ),
              ],
              const SizedBox(height: 14),
              _PreviewBox(
                source: property.owner?.verificationPhoto,
                emptyLabel: 'No owner verification photo has been uploaded yet.',
                icon: Icons.person_outline_rounded,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        DashboardSectionCard(
          title: 'Ownership document',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Review the ownership proof submitted with this property before approving the listing.',
                style: TextStyle(
                  color: AppTheme.mutedForeground,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 14),
              _DocumentSummaryCard(
                hasDocument: property.ownershipDocuments.isNotEmpty,
                isOpening: isOpeningDocument,
                onOpen: onOpenDocument,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PreviewBox extends StatelessWidget {
  const _PreviewBox({
    required this.source,
    required this.emptyLabel,
    required this.icon,
  });

  final String? source;
  final String emptyLabel;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    if (source?.trim().isEmpty ?? true) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Text(
          emptyLabel,
          style: const TextStyle(color: AppTheme.mutedForeground),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: CachedNetworkImage(
        imageUrl: _resolveSource(source!),
        height: 260,
        width: double.infinity,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => Container(
          height: 220,
          color: const Color(0xFFF8FAFC),
          alignment: Alignment.center,
          child: Icon(icon, color: AppTheme.mutedForeground, size: 38),
        ),
      ),
    );
  }
}

class _DocumentSummaryCard extends StatelessWidget {
  const _DocumentSummaryCard({
    required this.hasDocument,
    required this.isOpening,
    required this.onOpen,
  });

  final bool hasDocument;
  final bool isOpening;
  final VoidCallback? onOpen;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F3EF),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.description_outlined,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  hasDocument
                      ? 'A property ownership document is ready for review.'
                      : 'No ownership document has been uploaded yet.',
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontWeight: FontWeight.w700,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
          if (hasDocument) ...[
            const SizedBox(height: 14),
            FilledButton.icon(
              onPressed: isOpening ? null : onOpen,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
              ),
              icon: isOpening
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.open_in_new_rounded, size: 18),
              label: const Text('Preview document'),
            ),
          ],
        ],
      ),
    );
  }
}

Future<String?> _askForReason(BuildContext context, String title) async {
  final controller = TextEditingController();
  final result = await showDialog<String>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Text(title),
      content: TextField(
        controller: controller,
        minLines: 3,
        maxLines: 5,
        decoration: InputDecoration(
          hintText: 'Optional rejection reason',
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
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(controller.text),
          style: FilledButton.styleFrom(
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
          ),
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

