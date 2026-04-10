import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_card.dart';
import '../../dashboard/screens/my_listings_screen.dart';
import '../providers/add_listing_provider.dart';
import '../models/property_model.dart';
import '../../../l10n/app_localizations.dart';

class AddListingScreen extends ConsumerStatefulWidget {
  const AddListingScreen({Key? key, this.initialProperty}) : super(key: key);

  final PropertyModel? initialProperty;

  @override
  ConsumerState<AddListingScreen> createState() => _AddListingScreenState();
}

class _AddListingScreenState extends ConsumerState<AddListingScreen> {
  final _formKey = GlobalKey<FormState>();

  final List<Map<String, dynamic>> _propertyAmenities = [
    {'id': 'wifi', 'label': 'WiFi', 'icon': Icons.wifi},
    {'id': 'parking', 'label': 'Parking', 'icon': Icons.local_parking},
    {'id': 'pool', 'label': 'Pool', 'icon': Icons.pool},
    {'id': 'ac', 'label': 'AC', 'icon': Icons.ac_unit},
    {'id': 'kitchen', 'label': 'Kitchen', 'icon': Icons.kitchen},
    {
      'id': 'furnished',
      'label': 'Furnished',
      'icon': Icons.check_circle_outline,
    },
  ];

  final List<Map<String, dynamic>> _vehicleAmenities = [
    {'id': 'bluetooth', 'label': 'Bluetooth', 'icon': Icons.bluetooth},
    {'id': 'ac', 'label': 'Climate', 'icon': Icons.air},
    {'id': 'camera', 'label': 'Backup Cam', 'icon': Icons.camera_rear},
    {'id': 'leather', 'label': 'Leather', 'icon': Icons.event_seat},
    {'id': 'gps', 'label': 'GPS', 'icon': Icons.map},
    {'id': 'sunroof', 'label': 'Sunroof', 'icon': Icons.wb_sunny_outlined},
  ];

  @override
  void initState() {
    super.initState();
    final notifier = ref.read(addListingProvider.notifier);
    final property = widget.initialProperty;
    if (property != null) {
      notifier.loadFromProperty(property);
    } else {
      notifier.reset();
    }
  }

  @override
  void dispose() {
    ref.read(addListingProvider.notifier).reset();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(addListingProvider);
    final notifier = ref.read(addListingProvider.notifier);
    final isEditing = state.isEditing;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0F172A), Color(0xFF1E1B4B)],
          ),
        ),
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              _buildAppBar(),
              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    isEditing
                        ? _buildEditBanner(state)
                        : _buildToggle(state, notifier),
                    const SizedBox(height: 24),
                    _buildMediaSection(state, notifier),
                    const SizedBox(height: 24),
                    _buildForm(state, notifier),
                    const SizedBox(height: 100),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomAction(state, notifier),
    );
  }

  Widget _buildAppBar() {
    final l10n = AppLocalizations.of(context)!;
    final isEditing = ref.watch(addListingProvider).isEditing;
    return SliverAppBar(
      floating: true,
      backgroundColor: Colors.transparent,
      elevation: 0,
      title: Text(
        isEditing ? 'Edit Listing' : l10n.submitListing,
        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 24),
      ),
    );
  }

  Widget _buildEditBanner(AddListingState state) {
    return GlassCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            state.activeType == AssetType.HOME
                ? Icons.home_work_outlined
                : Icons.directions_car_outlined,
            color: AppTheme.secondary,
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Editing existing listing',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                SizedBox(height: 6),
                Text(
                  'Update the details, location, features, and price for this listing.',
                  style: TextStyle(color: Colors.white70, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToggle(AddListingState state, AddListingNotifier notifier) {
    final l10n = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          _toggleBtn(
            l10n.property,
            Icons.home_work_outlined,
            state.activeType == AssetType.HOME,
            () {
              notifier.setType(AssetType.HOME);
            },
          ),
          _toggleBtn(
            l10n.vehicle,
            Icons.directions_car_outlined,
            state.activeType == AssetType.CAR,
            () {
              notifier.setType(AssetType.CAR);
            },
          ),
        ],
      ),
    );
  }

  Widget _toggleBtn(
    String label,
    IconData icon,
    bool active,
    VoidCallback onTap,
  ) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: active ? AppTheme.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: active ? Colors.white : Colors.white24,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: active ? Colors.white : Colors.white24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMediaSection(
    AddListingState state,
    AddListingNotifier notifier,
  ) {
    final existingCount = state.existingImageUrls.length;
    final newCount = state.images.length;
    final totalCount = existingCount + newCount;
    final canAddMore = totalCount < 5;
    final visibleCount = totalCount + (canAddMore ? 1 : 0);

    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.image_outlined,
                color: AppTheme.secondary,
                size: 20,
              ),
              const SizedBox(width: 8),
              const Text(
                'Photos',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const Spacer(),
              Text(
                state.isEditing ? 'Current Media' : '4 Required',
                style: const TextStyle(
                  color: Colors.white38,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: visibleCount,
              itemBuilder: (context, index) {
                final isExistingImage = index < existingCount;
                final newImageIndex = index - existingCount;
                final isNewImage =
                    !isExistingImage &&
                    newImageIndex >= 0 &&
                    newImageIndex < newCount;
                final isAddTile = !isExistingImage && !isNewImage;
                return Stack(
                  children: [
                    GestureDetector(
                      onTap: isAddTile ? notifier.pickImages : null,
                      child: Container(
                        width: 100,
                        margin: const EdgeInsets.only(right: 12),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.white10),
                          borderRadius: BorderRadius.circular(12),
                          color: Colors.white.withOpacity(
                            isExistingImage || isNewImage ? 0.1 : 0.05,
                          ),
                          image: isExistingImage
                              ? DecorationImage(
                                  image: NetworkImage(
                                    _resolveMediaUrl(
                                      state.existingImageUrls[index],
                                    ),
                                  ),
                                  fit: BoxFit.cover,
                                )
                              : isNewImage
                              ? DecorationImage(
                                  image: FileImage(
                                    File(state.images[newImageIndex].path),
                                  ),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: isAddTile
                            ? const Icon(
                                Icons.add_a_photo_outlined,
                                color: Colors.white24,
                              )
                            : null,
                      ),
                    ),
                    if (isExistingImage || isNewImage)
                      Positioned(
                        top: 4,
                        right: 16,
                        child: GestureDetector(
                          onTap: () {
                            if (isExistingImage) {
                              notifier.removeExistingImage(
                                state.existingImageUrls[index],
                              );
                            } else {
                              notifier.removeImage(newImageIndex);
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              size: 12,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
          if (state.isEditing) ...[
            const SizedBox(height: 12),
            Text(
              totalCount == 0
                  ? 'No photos are currently selected. Add replacement photos before saving this listing.'
                  : 'Keep existing photos, remove the ones you do not want, and add replacement photos as needed.',
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 12,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildForm(AddListingState state, AddListingNotifier notifier) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          _buildInfoSection(state, notifier),
          const SizedBox(height: 24),
          _buildSpecsSection(state, notifier),
          const SizedBox(height: 24),
          _buildAmenitiesSection(state, notifier),
          const SizedBox(height: 24),
          _buildPriceSection(state, notifier),
          const SizedBox(height: 24),
          _buildVerificationSection(state, notifier),
        ],
      ),
    );
  }

  Widget _buildInfoSection(AddListingState state, AddListingNotifier notifier) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _input(
            'Title',
            (val) => notifier.updateField('title', val),
            hint: 'e.g. Luxury Penthouse at Bole',
            initialValue: state.fields['title']?.toString(),
          ),
          const SizedBox(height: 16),
          _input(
            'Description',
            (val) => notifier.updateField('description', val),
            hint:
                'Highlight the space, condition, location advantages, or vehicle details.',
            initialValue: state.fields['description']?.toString(),
            maxLines: 4,
          ),
          const SizedBox(height: 16),
          _input(
            'City',
            (val) => notifier.updateField('city', val),
            hint: 'Addis Ababa',
            initialValue: state.fields['city']?.toString(),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _input(
                  'Subcity',
                  (val) => notifier.updateField('subcity', val),
                  hint: 'Bole',
                  initialValue: state.fields['subcity']?.toString(),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _input(
                  'Region',
                  (val) => notifier.updateField('region', val),
                  hint: 'Addis Ababa',
                  initialValue: state.fields['region']?.toString(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _input(
            'Village / Kebele',
            (val) => notifier.updateField('village', val),
            hint: 'Bulbula',
            initialValue: state.fields['village']?.toString(),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecsSection(
    AddListingState state,
    AddListingNotifier notifier,
  ) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: state.activeType == AssetType.HOME
          ? _buildHomeSpecs(state, notifier)
          : _buildCarSpecs(state, notifier),
    );
  }

  Widget _buildHomeSpecs(AddListingState state, AddListingNotifier notifier) {
    final l10n = AppLocalizations.of(context)!;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _dropdown(
                'Listed for',
                state.fields['listingType'] ?? 'buy',
                ['buy', 'rent'],
                (val) => notifier.updateField('listingType', val),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _dropdown(
                'Type',
                state.fields['category'] ?? 'apartment',
                ['apartment', 'villa', 'condominium', 'studio', '3*3', '4*4'],
                (val) => notifier.updateField('category', val),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _input(
                l10n.bedrooms,
                (val) => notifier.updateField('bedrooms', val),
                number: true,
                icon: Icons.bed_outlined,
                initialValue: state.fields['bedrooms']?.toString(),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _input(
                l10n.bathrooms,
                (val) => notifier.updateField('bathrooms', val),
                number: true,
                icon: Icons.bathtub_outlined,
                initialValue: state.fields['bathrooms']?.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _input(
          l10n.area,
          (val) => notifier.updateField('area', val),
          number: true,
          icon: Icons.square_foot,
          initialValue: state.fields['area']?.toString(),
        ),
      ],
    );
  }

  Widget _buildCarSpecs(AddListingState state, AddListingNotifier notifier) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _input(
                'Brand',
                (val) => notifier.updateField('brand', val),
                hint: 'Toyota',
                initialValue: state.fields['brand']?.toString(),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _input(
                'Model',
                (val) => notifier.updateField('model', val),
                hint: 'Vitz',
                initialValue: state.fields['model']?.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _input(
                'Year',
                (val) => notifier.updateField('year', val),
                number: true,
                initialValue: state.fields['year']?.toString(),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _input(
                'Mileage',
                (val) => notifier.updateField('mileage', val),
                number: true,
                initialValue: state.fields['mileage']?.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _dropdown(
                'Fuel',
                state.fields['fuelType'] ?? 'Petrol',
                ['Petrol', 'Diesel', 'Electric'],
                (val) => notifier.updateField('fuelType', val),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _dropdown(
                'Gear',
                state.fields['transmission'] ?? 'Automatic',
                ['Automatic', 'Manual'],
                (val) => notifier.updateField('transmission', val),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAmenitiesSection(
    AddListingState state,
    AddListingNotifier notifier,
  ) {
    final list = state.activeType == AssetType.HOME
        ? _propertyAmenities
        : _vehicleAmenities;
    final selected = state.fields['amenities'] as List<String>? ?? [];

    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Amenities & Features',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: list.map((item) {
              final isSelected = selected.contains(item['id']);
              return GestureDetector(
                onTap: () {
                  final newList = List<String>.from(selected);
                  if (isSelected)
                    newList.remove(item['id']);
                  else
                    newList.add(item['id']);
                  notifier.updateField('amenities', newList);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppTheme.primary.withOpacity(0.2)
                        : Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected ? AppTheme.primary : Colors.white10,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        item['icon'] as IconData,
                        size: 14,
                        color: isSelected ? Colors.white : Colors.white38,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        item['label'] as String,
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.white38,
                          fontSize: 12,
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceSection(
    AddListingState state,
    AddListingNotifier notifier,
  ) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _input(
            'Asking Price (ETB)',
            (val) => notifier.updateField('price', val),
            number: true,
            icon: Icons.payments_outlined,
            initialValue: state.fields['price']?.toString(),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: state.isPredicting
                  ? null
                  : () => notifier.getAiEstimate(),
              icon: state.isPredicting
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.auto_awesome, size: 16),
              label: Text(
                state.isPredicting
                    ? 'AI Analyzing...'
                    : 'Discover Optimal Price with AI',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                side: const BorderSide(color: AppTheme.secondary),
                foregroundColor: AppTheme.secondary,
              ),
            ),
          ),
          if (state.aiEstimate != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                'AI Recommendation: ETB ${state.aiEstimate}',
                style: const TextStyle(
                  color: AppTheme.secondary,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildVerificationSection(
    AddListingState state,
    AddListingNotifier notifier,
  ) {
    final ownershipLabel = state.ownershipDocument != null
        ? 'New ownership file selected: ${state.ownershipDocument!.name}'
        : state.existingOwnershipDocumentUrl?.isNotEmpty == true
        ? 'Current ownership document on file. Tap to replace it.'
        : 'Upload Ownership Document (PDF/Image)';
    final identityLabel = state.identityPhoto != null
        ? 'New verification photo selected: ${state.identityPhoto!.name}'
        : state.existingIdentityPhotoUrl?.isNotEmpty == true
        ? 'Current identification photo on file. Tap to replace it.'
        : 'Owner Identification Photo';

    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            state.isEditing
                ? 'Ownership & Verification Updates'
                : 'Ownership & Verification',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          _docPicker(
            ownershipLabel,
            state.ownershipDocument,
            notifier.pickDocument,
          ),
          const SizedBox(height: 12),
          _docPicker(
            identityLabel,
            state.identityPhoto,
            notifier.captureIdentity,
            isCamera: true,
          ),
          if (state.existingIdentityPhotoUrl?.isNotEmpty == true ||
              state.identityPhoto != null) ...[
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Image(
                image: state.identityPhoto != null
                    ? FileImage(File(state.identityPhoto!.path))
                    : NetworkImage(
                            _resolveMediaUrl(state.existingIdentityPhotoUrl!),
                          )
                          as ImageProvider,
                height: 180,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _input(
    String label,
    Function(String) onChanged, {
    String? hint,
    String? initialValue,
    bool number = false,
    int maxLines = 1,
    IconData? icon,
  }) {
    return TextFormField(
      initialValue: initialValue,
      onChanged: onChanged,
      keyboardType: number ? TextInputType.number : TextInputType.text,
      minLines: maxLines,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white54, fontSize: 12),
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white12),
        prefixIcon: icon != null
            ? Icon(icon, color: Colors.white24, size: 18)
            : null,
        filled: true,
        fillColor: Colors.white.withOpacity(0.05),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primary),
        ),
      ),
    );
  }

  Widget _dropdown(
    String label,
    String value,
    List<String> items,
    Function(String?) onChanged,
  ) {
    return DropdownButtonFormField<String>(
      value: value,
      items: items
          .map(
            (e) => DropdownMenuItem(
              value: e,
              child: Text(
                e.toUpperCase(),
                style: const TextStyle(fontSize: 12),
              ),
            ),
          )
          .toList(),
      onChanged: onChanged,
      dropdownColor: const Color(0xFF1E1B4B),
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white54, fontSize: 12),
        filled: true,
        fillColor: Colors.white.withOpacity(0.05),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  Widget _docPicker(
    String label,
    XFile? file,
    VoidCallback onTap, {
    bool isCamera = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: file != null
                ? AppTheme.secondary.withOpacity(0.3)
                : Colors.white10,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isCamera
                  ? Icons.camera_alt_outlined
                  : Icons.file_present_outlined,
              color: Colors.white38,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: file != null ? AppTheme.secondary : Colors.white38,
                  fontSize: 13,
                ),
              ),
            ),
            if (file != null)
              const Icon(
                Icons.check_circle,
                color: AppTheme.secondary,
                size: 16,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomAction(
    AddListingState state,
    AddListingNotifier notifier,
  ) {
    final l10n = AppLocalizations.of(context)!;
    final isEditing = state.isEditing;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      color: Colors.transparent,
      child: SizedBox(
        height: 56,
        child: ElevatedButton(
          onPressed: state.isLoading ? null : () => _submit(notifier),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: state.isLoading
              ? const CircularProgressIndicator(color: Colors.white)
              : Text(
                  isEditing ? 'SAVE CHANGES' : l10n.submitListing.toUpperCase(),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    letterSpacing: 1.2,
                  ),
                ),
        ),
      ),
    );
  }

  void _submit(AddListingNotifier notifier) async {
    try {
      final isEditing = ref.read(addListingProvider).isEditing;
      await notifier.submit();
      ref.invalidate(myListingsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isEditing
                  ? 'Listing updated successfully.'
                  : 'Listing submitted successfully! Our team will verify it shortly.',
            ),
            backgroundColor: Colors.green,
          ),
        );
        context.pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  String _resolveMediaUrl(String source) {
    if (source.startsWith('http') || source.startsWith('data:')) {
      return source;
    }
    return '${DioClient.baseUrl}$source';
  }
}
