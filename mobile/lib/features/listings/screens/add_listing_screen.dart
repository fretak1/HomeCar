import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_card.dart';
import '../../../shared/widgets/camera_capture_screen.dart';
import '../../dashboard/screens/my_listings_screen.dart';
import '../providers/add_listing_provider.dart';
import '../models/property_model.dart';
import '../../../l10n/app_localizations.dart';
import '../../../core/constants/ethiopia_locations.dart';

class AddListingScreen extends ConsumerStatefulWidget {
  const AddListingScreen({Key? key, this.initialProperty}) : super(key: key);

  final PropertyModel? initialProperty;

  @override
  ConsumerState<AddListingScreen> createState() => _AddListingScreenState();
}

class _AddListingScreenState extends ConsumerState<AddListingScreen> {
  final List<Map<String, dynamic>> _propertyAmenities = [
    {'id': 'wifi', 'label': 'WiFi', 'icon': Icons.wifi},
    {'id': 'parking', 'label': 'Parking', 'icon': Icons.local_parking},
    {'id': 'pool', 'label': 'Pool', 'icon': Icons.pool},
    {'id': 'ac', 'label': 'AC', 'icon': Icons.ac_unit},
    {'id': 'kitchen', 'label': 'Kitchen', 'icon': Icons.kitchen},
    {'id': 'furnished', 'label': 'Furnished', 'icon': Icons.check_circle_outline},
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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final notifier = ref.read(addListingProvider.notifier);
      final property = widget.initialProperty;
      if (property != null) {
        notifier.loadFromProperty(property);
      } else {
        notifier.reset();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(addListingProvider);
    final notifier = ref.read(addListingProvider.notifier);
    final l10n = AppLocalizations.of(context)!;

    return Theme(
      data: ThemeData.light().copyWith(
        scaffoldBackgroundColor: const Color(0xFFF9FAFB),
        primaryColor: AppTheme.primary,
        colorScheme: const ColorScheme.light(
          primary: AppTheme.primary,
          secondary: AppTheme.secondary,
        ),
      ),
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFFF9FAFB),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1E293B), size: 20),
            onPressed: () => context.pop(),
          ),
          actions: [
            TextButton(
              onPressed: () => context.pop(),
              child: const Text('Cancel', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeroHeader(state),
              const SizedBox(height: 32),
              _buildTypeTabs(state, notifier),
              const SizedBox(height: 32),
              _buildMediaSection(state, notifier),
              const SizedBox(height: 24),
              _buildBasicInfo(state, notifier),
              const SizedBox(height: 24),
              _buildLocationSection(state, l10n, notifier),
              const SizedBox(height: 24),
              _buildSpecsSection(state, notifier),
              const SizedBox(height: 24),
              _buildAmenitiesSection(state, notifier),
              const SizedBox(height: 24),
              _buildPriceSection(state, notifier),
              const SizedBox(height: 24),
              _buildVerificationSection(state, notifier),
              const SizedBox(height: 40),
            ],
          ),
        ),
        bottomNavigationBar: _buildBottomAction(state, notifier),
      ),
    );
  }

  Widget _buildHeroHeader(AddListingState state) {
    final isEditing = state.isEditing;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1E293B),
              letterSpacing: -1,
            ),
            children: [
              TextSpan(text: isEditing ? 'Edit ' : 'Add New '),
              const TextSpan(
                text: 'Property',
                style: TextStyle(color: AppTheme.primary),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          isEditing
              ? 'Update your listing details and media to keep your property information accurate and attractive.'
              : 'List your property on HomeCar and reach thousands of potential buyers and renters.',
          style: TextStyle(
            color: const Color(0xFF64748B),
            fontSize: 14,
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildTypeTabs(AddListingState state, AddListingNotifier notifier) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        children: [
          Expanded(
            child: _tabItem(
              'Property',
              Icons.home_work_rounded,
              state.activeType == AssetType.HOME,
              () => notifier.setType(AssetType.HOME),
            ),
          ),
          Expanded(
            child: _tabItem(
              'Vehicle',
              Icons.directions_car_rounded,
              state.activeType == AssetType.CAR,
              () => notifier.setType(AssetType.CAR),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tabItem(String label, IconData icon, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
          boxShadow: active
              ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: active ? AppTheme.primary : const Color(0xFF64748B)),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                color: active ? const Color(0xFF1E293B) : const Color(0xFF64748B),
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section({required Widget child, EdgeInsets padding = const EdgeInsets.all(24)}) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildMediaSection(AddListingState state, AddListingNotifier notifier) {
    return _section(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.add_photo_alternate_rounded, color: AppTheme.primary, size: 20),
              const SizedBox(width: 10),
              const Text(
                'Media Upload',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1E293B)),
              ),
              const Spacer(),
              const Text(
                'AT LEAST 4 PHOTOS REQUIRED',
                style: TextStyle(color: AppTheme.primary, fontSize: 8, fontWeight: FontWeight.w900),
              ),
            ],
          ),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.2,
            ),
            itemCount: 4,
            itemBuilder: (context, index) {
              final existingCount = state.existingImageUrls.length;
              final newCount = state.images.length;
              
              bool isExistingImage = index < existingCount;
              bool isNewImage = !isExistingImage && (index - existingCount) < newCount;
              int newImageIndex = index - existingCount;

              return GestureDetector(
                onTap: () => notifier.pickImages(),
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (isExistingImage)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: CachedNetworkImage(
                            imageUrl: _resolveMediaUrl(state.existingImageUrls[index]),
                            fit: BoxFit.cover,
                          ),
                        )
                      else if (isNewImage)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: kIsWeb 
                            ? Image.network(state.images[newImageIndex].path, fit: BoxFit.cover)
                            : Image.file(File(state.images[newImageIndex].path), fit: BoxFit.cover),
                        )
                      else
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: const BoxDecoration(color: Color(0xFFF1F5F9), shape: BoxShape.circle),
                                child: const Icon(Icons.camera_alt_rounded, color: Color(0xFF94A3B8), size: 20),
                              ),
                            ],
                          ),
                        ),
                      if (isExistingImage || isNewImage)
                        Positioned(
                          top: 8,
                          right: 8,
                          child: GestureDetector(
                            onTap: () {
                              if (isExistingImage) {
                                notifier.removeExistingImage(state.existingImageUrls[index]);
                              } else {
                                notifier.removeImage(newImageIndex);
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                              child: const Icon(Icons.close, size: 12, color: Colors.white),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildBasicInfo(AddListingState state, AddListingNotifier notifier) {
    return _section(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.info_outline_rounded, color: AppTheme.primary, size: 20),
              const SizedBox(width: 10),
              const Text(
                'Core Information',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1E293B)),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _input(
            'Title',
            (val) => notifier.updateField('title', val),
            hint: 'E.g. Luxury 3 Bedroom Villa',
            icon: Icons.title_rounded,
            initialValue: state.fields['title']?.toString(),
          ),
          const SizedBox(height: 20),
          _input(
            'Description',
            (val) => notifier.updateField('description', val),
            hint: 'Describe your property in detail...',
            icon: Icons.description_outlined,
            maxLines: 4,
            initialValue: state.fields['description']?.toString(),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationSection(AddListingState state, AppLocalizations l10n, AddListingNotifier notifier) {
    final region = state.fields['region'] ?? '';
    final city = state.fields['city'] ?? '';
    final subCity = state.fields['subcity'] ?? '';

    // Get cities for selected region
    final Map<String, Map<String, List<String>>> citiesMap = 
        (ethiopiaLocations[region] as Map<String, Map<String, List<String>>>?) ?? {};
    final cities = citiesMap.keys.toList();

    // Get sub-cities for selected city
    final Map<String, List<String>> subCitiesMap = 
        (citiesMap[city] as Map<String, List<String>>?) ?? {};
    final subCities = subCitiesMap.keys.toList();

    // Get villages for selected sub-city
    final List<String> villages = 
        (subCitiesMap[subCity] as List<String>?) ?? [];

    return _section(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.map_outlined, color: AppTheme.primary, size: 20),
              const SizedBox(width: 10),
              const Text(
                'Location Details',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1E293B)),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _dropdown(
                  'Region',
                  region,
                  ethiopiaLocations.keys.toList(),
                  (val) => notifier.updateLocationField('region', val!),
                  icon: Icons.public_rounded,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _dropdown(
                  'City',
                  city,
                  cities,
                  (val) => notifier.updateLocationField('city', val!),
                  icon: Icons.location_city_rounded,
                  disabled: cities.isEmpty,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _dropdown(
                  'Sub City',
                  subCity,
                  subCities,
                  (val) => notifier.updateLocationField('subcity', val!),
                  icon: Icons.location_on_outlined,
                  disabled: subCities.isEmpty,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _dropdown(
                  'Village / Kebele',
                  state.fields['village'],
                  villages,
                  (val) => notifier.updateLocationField('village', val!),
                  icon: Icons.holiday_village_rounded,
                  disabled: villages.isEmpty,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _buildMapSection(state, notifier),
        ],
      ),
    );
  }

  Widget _buildMapSection(AddListingState state, AddListingNotifier notifier) {
    final lat = double.tryParse(state.fields['latitude']?.toString() ?? '9.03') ?? 9.03;
    final lng = double.tryParse(state.fields['longitude']?.toString() ?? '38.74') ?? 38.74;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.location_searching_rounded, color: AppTheme.primary, size: 18),
            SizedBox(width: 10),
            Text('Pin Precise Location', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF475569))),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          height: 200,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: FlutterMap(
              options: MapOptions(
                initialCenter: LatLng(lat, lng),
                initialZoom: 13,
                onTap: (tapPosition, point) {
                  notifier.updateField('latitude', point.latitude.toString());
                  notifier.updateField('longitude', point.longitude.toString());
                },
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                  userAgentPackageName: 'com.homecar.mobile',
                ),
                // Add a slight dark overlay to make markers pop on satellite
                Opacity(
                  opacity: 0.7,
                  child: TileLayer(
                    urlTemplate: 'https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}.png',
                  ),
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: LatLng(lat, lng),
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.location_on_rounded, color: Colors.redAccent, size: 40),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        const Center(
          child: Text(
            'PRECISELY PINNING YOUR LOCATION INCREASES BUYER/RENTER TRUST BY 40%',
            style: TextStyle(color: AppTheme.primary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5),
          ),
        ),
      ],
    );
  }

  Widget _buildSpecsSection(AddListingState state, AddListingNotifier notifier) {
    return _section(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.tune_rounded, color: AppTheme.primary, size: 20),
              const SizedBox(width: 10),
              const Text(
                'Specifications',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1E293B)),
              ),
            ],
          ),
          const SizedBox(height: 24),
          state.activeType == AssetType.HOME
              ? _buildHomeSpecs(state, notifier)
              : _buildCarSpecs(state, notifier),
        ],
      ),
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
          suffixText: 'sqm',
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
              child: _input('Brand', (val) => notifier.updateField('brand', val), hint: 'Toyota', initialValue: state.fields['brand']?.toString()),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _input('Model', (val) => notifier.updateField('model', val), hint: 'Vitz', initialValue: state.fields['model']?.toString()),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _input('Year', (val) => notifier.updateField('year', val), number: true, initialValue: state.fields['year']?.toString()),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _input('Mileage', (val) => notifier.updateField('mileage', val), number: true, initialValue: state.fields['mileage']?.toString(), suffixText: 'km'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAmenitiesSection(AddListingState state, AddListingNotifier notifier) {
    final list = state.activeType == AssetType.HOME ? _propertyAmenities : _vehicleAmenities;
    final selected = state.fields['amenities'] as List<String>? ?? [];

    return _section(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.bolt_rounded, color: AppTheme.primary, size: 20),
              const SizedBox(width: 10),
              const Text('Amenities & Features', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1E293B))),
            ],
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: list.map((item) {
              final isSelected = selected.contains(item['id']);
              return InkWell(
                onTap: () {
                  final newList = List<String>.from(selected);
                  if (isSelected) newList.remove(item['id']); else newList.add(item['id']);
                  notifier.updateField('amenities', newList);
                },
                borderRadius: BorderRadius.circular(12),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.primary.withOpacity(0.08) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isSelected ? AppTheme.primary : const Color(0xFFE2E8F0), width: 1.5),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(item['icon'] as IconData, size: 16, color: isSelected ? AppTheme.primary : const Color(0xFF94A3B8)),
                      const SizedBox(width: 8),
                      Text(
                        item['label'] as String,
                        style: TextStyle(
                          color: isSelected ? AppTheme.primary : const Color(0xFF64748B),
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
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

  Widget _buildPriceSection(AddListingState state, AddListingNotifier notifier) {
    return _section(
      padding: const EdgeInsets.all(28),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Set Your Pricing', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Color(0xFF1E293B))),
                    const SizedBox(height: 4),
                    const Text('The final step to getting live.', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              TextButton.icon(
                onPressed: state.isPredicting ? null : () async {
                  try {
                    await notifier.getAiEstimate();
                    final updatedState = ref.read(addListingProvider);
                    if (updatedState.aiEstimate != null) {
                      notifier.updateField('price', updatedState.aiEstimate);
                      if (mounted) {
                        _showAiEstimateSheet(updatedState);
                      }
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('AI Estimation failed: $e'),
                          backgroundColor: Colors.redAccent,
                        ),
                      );
                    }
                  }
                },
                icon: state.isPredicting 
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.auto_awesome, size: 16),
                label: const Text('AI Estimate', style: TextStyle(fontWeight: FontWeight.w900)),
                style: TextButton.styleFrom(
                  backgroundColor: AppTheme.primary.withOpacity(0.1),
                  foregroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _input(
            '',
            (val) => notifier.updateField('price', val),
            key: ValueKey('price_${state.fields['price']}'), // Force rebuild on AI update
            number: true,
            hint: '00,000',
            initialValue: state.fields['price']?.toString(),
            prefixText: 'ETB ',
            suffixText: state.fields['listingType'] == 'rent' ? '/ MO' : '',
            large: true,
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationSection(AddListingState state, AddListingNotifier notifier) {
    return _section(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified_user_rounded, color: AppTheme.primary, size: 20),
              const SizedBox(width: 10),
              const Text('Trust & Verification', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1E293B))),
              const Spacer(),
              Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(6)), child: const Text('REQUIRED', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 24),
          _docPicker('Ownership Document', 'Legal document proving your ownership', state.ownershipDocument, state.existingOwnershipDocumentUrl, notifier.pickDocument, Icons.file_present_rounded),
          const SizedBox(height: 12),
          _docPicker('Identification Photo', 'Clear photo of your ID or selfie', state.identityPhoto, state.existingIdentityPhotoUrl, () async {
            final image = await Navigator.push<XFile>(
              context,
              MaterialPageRoute(builder: (context) => const CameraCaptureScreen(isFront: true)),
            );
            if (image != null) {
              notifier.setIdentityPhoto(image);
            }
          }, Icons.camera_alt_rounded),
        ],
      ),
    );
  }

  Widget _docPicker(String label, String subtitle, XFile? file, String? existingUrl, VoidCallback onTap, IconData icon) {
    final hasFile = file != null || (existingUrl != null && existingUrl.isNotEmpty);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: hasFile ? AppTheme.primary.withOpacity(0.05) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: hasFile ? AppTheme.primary.withOpacity(0.3) : const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Icon(hasFile ? Icons.check_circle_rounded : icon, color: hasFile ? AppTheme.primary : const Color(0xFF94A3B8)),
            const SizedBox(width: 16),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(label, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: hasFile ? const Color(0xFF1E293B) : const Color(0xFF64748B))),
                Text(hasFile ? 'Document Uploaded' : subtitle, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
              ]),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1)),
          ],
        ),
      ),
    );
  }

  Widget _input(String label, Function(String) onChanged, {Key? key, bool number = false, IconData? icon, int maxLines = 1, String? initialValue, String? hint, String? prefixText, String? suffixText, bool large = false}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty) ...[
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
          const SizedBox(height: 8),
        ],
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(large ? 16 : 12),
            border: Border.all(color: const Color(0xFFE2E8F0), width: large ? 2 : 1),
          ),
          child: TextFormField(
            initialValue: initialValue,
            onChanged: onChanged,
            keyboardType: number ? TextInputType.number : TextInputType.text,
            maxLines: maxLines,
            style: TextStyle(color: const Color(0xFF1E293B), fontSize: large ? 28 : 15, fontWeight: large ? FontWeight.w900 : FontWeight.w500),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: Color(0xFFCBD5E1)),
              prefixIcon: icon != null ? Icon(icon, color: const Color(0xFF94A3B8), size: 18) : (prefixText != null ? Container(padding: const EdgeInsets.only(left: 16, right: 8), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Text(prefixText, style: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold))])) : null),
              suffixIcon: suffixText != null ? Container(padding: const EdgeInsets.only(right: 16), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Text(suffixText, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold))])) : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _dropdown(String label, String? value, List<String> options, Function(String?) onChanged, {IconData? icon, bool disabled = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: (value == null || value.isEmpty || !options.contains(value)) ? null : value,
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF94A3B8)),
              style: const TextStyle(color: Color(0xFF1E293B), fontSize: 14, fontWeight: FontWeight.w500),
              items: options.map((String val) => DropdownMenuItem<String>(value: val, child: Text(val.toUpperCase()))).toList(),
              onChanged: disabled ? null : onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomAction(AddListingState state, AddListingNotifier notifier) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Color(0xFFE2E8F0)))),
      child: SizedBox(
        height: 56,
        child: ElevatedButton(
          onPressed: state.isLoading ? null : () => _submit(notifier),
          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
          child: state.isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('SAVE LISTING', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1.2, color: Colors.white)),
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
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(isEditing ? 'Listing updated successfully.' : 'Listing submitted successfully!'), backgroundColor: Colors.green));
        context.pop(true);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent));
    }
  }

  void _showAiEstimateSheet(AddListingState state) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                const Icon(Icons.auto_awesome, color: AppTheme.primary, size: 24),
                const SizedBox(width: 12),
                const Text(
                  'AI Valuation Report',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                ),
                const Spacer(),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded)),
              ],
            ),
            const SizedBox(height: 24),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primary.withOpacity(0.1)),
              ),
              child: Column(
                children: [
                  const Text('PREDICTED PRICE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppTheme.primary, letterSpacing: 1.5)),
                  const SizedBox(height: 8),
                  Text(
                    'ETB ${state.aiEstimate}',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            if (state.reasoning != null) ...[
              const Text('REASONING', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1.2)),
              const SizedBox(height: 12),
              Text(
                state.reasoning!,
                style: const TextStyle(fontSize: 14, color: Color(0xFF334155), height: 1.6),
              ),
              const SizedBox(height: 24),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('APPLY THIS PRICE', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  String _resolveMediaUrl(String source) {
    if (source.startsWith('http') || source.startsWith('data:')) return source;
    return '${DioClient.baseUrl}$source';
  }
}
