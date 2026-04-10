import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/filter_provider.dart';
import '../../../core/theme/app_theme.dart';

// ─── Public entry point ───────────────────────────────────────────────────────
Future<void> showFilterSheet(BuildContext context, String assetType) async {
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => FilterSheet(assetType: assetType),
  );
}

// ─── Sheet Widget ─────────────────────────────────────────────────────────────
class FilterSheet extends ConsumerStatefulWidget {
  final String assetType; // 'HOME' or 'CAR'

  const FilterSheet({super.key, required this.assetType});

  @override
  ConsumerState<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<FilterSheet> {
  // Local draft state – applied only when user taps "Apply"
  late FilterState _draft;

  // ── Property Type options (matching web's PropertyTypeIcons keys) ──────────
  static const _propertyTypes = [
    ('Villa', Icons.villa_outlined),
    ('Apartment', Icons.apartment_outlined),
    ('Commercial', Icons.store_outlined),
    ('Studio', Icons.single_bed_outlined),
    ('Penthouse', Icons.roofing_outlined),
    ('Condominium', Icons.domain_outlined),
    ('Town House', Icons.house_outlined),
    ('Traditional Home', Icons.cottage_outlined),
  ];

  // ── Car amenity chips (matching web's amenity filter for cars) ─────────────
  static const _carAmenities = [
    ('Bluetooth', Icons.bluetooth),
    ('AC', Icons.ac_unit),
    ('Camera', Icons.camera_outlined),
    ('Leather', Icons.chair_outlined),
    ('GPS', Icons.gps_fixed_outlined),
    ('Sunroof', Icons.wb_sunny_outlined),
    ('Keyless', Icons.key_outlined),
  ];

  // ── Home amenity chips ────────────────────────────────────────────────────
  static const _homeAmenities = [
    ('WiFi', Icons.wifi),
    ('Parking', Icons.local_parking_outlined),
    ('Pool', Icons.pool_outlined),
    ('AC', Icons.ac_unit),
    ('Kitchen', Icons.kitchen_outlined),
    ('Furnished', Icons.chair_outlined),
    ('Heating', Icons.local_fire_department_outlined),
  ];

  static const _carBrands = [
    'Toyota',
    'Mercedes',
    'Tesla',
    'Hyundai',
    'Suzuki',
    'Ford',
  ];
  @override
  void initState() {
    super.initState();
    _draft = ref.read(filterProvider);
  }

  void _apply() {
    ref.read(filterProvider.notifier).update((_) => _draft);
    Navigator.of(context).pop();
  }

  void _reset() => setState(() => _draft = const FilterState());

  @override
  Widget build(BuildContext context) {
    final isHome = widget.assetType == 'HOME';
    return DraggableScrollableSheet(
      initialChildSize: 0.93,
      maxChildSize: 0.97,
      minChildSize: 0.5,
      builder: (context, controller) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1E293B),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.symmetric(vertical: 10),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${isHome ? 'Property' : 'Vehicle'} Filters',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  TextButton(
                    onPressed: _reset,
                    child: const Text(
                      'Reset All',
                      style: TextStyle(color: AppTheme.secondary),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(color: Colors.white12),
            // Scrollable content
            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
                children: [
                  // ── Location ──────────────────────────────────────────────
                  _sectionLabel('Location'),
                  _textField(
                    'Region',
                    _draft.region,
                    (v) => setState(() => _draft = _draft.copyWith(region: v)),
                  ),
                  const SizedBox(height: 10),
                  _textField(
                    'City',
                    _draft.city,
                    (v) => setState(() => _draft = _draft.copyWith(city: v)),
                  ),
                  const SizedBox(height: 10),
                  _textField(
                    'Sub City',
                    _draft.subCity,
                    (v) => setState(() => _draft = _draft.copyWith(subCity: v)),
                  ),

                  // ── Listing Type ──────────────────────────────────────────
                  _sectionLabel('Listing Type'),
                  _segmentedRow(
                    options: const [
                      ('Any', 'any'),
                      ('For Rent', 'rent'),
                      ('For Sale', 'buy'),
                    ],
                    selected: _draft.listingType,
                    onSelect: (v) => setState(
                      () => _draft = _draft.copyWith(listingType: v),
                    ),
                  ),

                  // ── Price Range ───────────────────────────────────────────
                  _sectionLabel('Price Range (ETB)'),
                  Row(
                    children: [
                      Expanded(
                        child: _dropdown(
                          'Min Price',
                          _draft.priceMin?.toString() ?? 'any',
                          [
                            const ('No Min', 'any'),
                            ...(isHome
                                    ? [500, 1000, 2500, 5000, 10000, 25000]
                                    : [
                                        50000,
                                        100000,
                                        250000,
                                        500000,
                                        1000000,
                                        2500000,
                                      ])
                                .map((p) => ('ETB ${_fmt(p)}', p.toString()))
                                .toList(),
                          ],
                          (v) => setState(
                            () => _draft = v == 'any'
                                ? _draft.copyWith(clearPriceMin: true)
                                : _draft.copyWith(priceMin: double.parse(v)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _dropdown(
                          'Max Price',
                          _draft.priceMax?.toString() ?? 'any',
                          [
                            const ('No Max', 'any'),
                            ...(isHome
                                    ? [1000, 2500, 5000, 10000, 25000, 50000]
                                    : [
                                        100000,
                                        250000,
                                        500000,
                                        1000000,
                                        2500000,
                                        5000000,
                                      ])
                                .map((p) => ('ETB ${_fmt(p)}', p.toString()))
                                .toList(),
                          ],
                          (v) => setState(
                            () => _draft = v == 'any'
                                ? _draft.copyWith(clearPriceMax: true)
                                : _draft.copyWith(priceMax: double.parse(v)),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // ── HOME SPECIFIC ─────────────────────────────────────────
                  if (isHome) ...[
                    _sectionLabel('Property Type'),
                    _propertyTypeGrid(),

                    _sectionLabel('Beds & Baths'),
                    Row(
                      children: [
                        Expanded(
                          child: _dropdown(
                            'Beds',
                            _draft.beds,
                            [
                              const ('Any Beds', 'any'),
                              ...[
                                '1',
                                '2',
                                '3',
                                '4+',
                              ].map((v) => ('$v+ Beds', v)),
                            ],
                            (v) => setState(
                              () => _draft = _draft.copyWith(beds: v),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _dropdown(
                            'Baths',
                            _draft.baths,
                            [
                              const ('Any Baths', 'any'),
                              ...['1', '2', '3+'].map((v) => ('$v+ Baths', v)),
                            ],
                            (v) => setState(
                              () => _draft = _draft.copyWith(baths: v),
                            ),
                          ),
                        ),
                      ],
                    ),

                    _sectionLabel('Amenities & Features'),
                    _amenityChips(_homeAmenities),
                  ],

                  // ── CAR SPECIFIC ──────────────────────────────────────────
                  if (!isHome) ...[
                    _sectionLabel('Vehicle Brand'),
                    _dropdown(
                      'All Brands',
                      _draft.brand,
                      [
                        const ('All Brands', 'any'),
                        ..._carBrands.map((b) => (b, b)),
                      ],
                      (v) => setState(() => _draft = _draft.copyWith(brand: v)),
                    ),

                    _sectionLabel('Fuel Technology'),
                    _segmentedRow(
                      options: const [
                        ('Any', 'any'),
                        ...[
                          ('Petrol', 'Petrol'),
                          ('Diesel', 'Diesel'),
                          ('Electric', 'Electric'),
                          ('Hybrid', 'Hybrid'),
                        ],
                      ],
                      selected: _draft.fuelType,
                      onSelect: (v) =>
                          setState(() => _draft = _draft.copyWith(fuelType: v)),
                    ),

                    _sectionLabel('Transmission'),
                    _segmentedRow(
                      options: const [
                        ('Any', 'any'),
                        ('Automatic', 'Automatic'),
                        ('Manual', 'Manual'),
                      ],
                      selected: _draft.transmission,
                      onSelect: (v) => setState(
                        () => _draft = _draft.copyWith(transmission: v),
                      ),
                    ),

                    _sectionLabel('Production Year'),
                    RangeSlider(
                      min: 1990,
                      max: 2025,
                      divisions: 35,
                      activeColor: AppTheme.secondary,
                      inactiveColor: Colors.white12,
                      values: RangeValues(
                        _draft.yearMin.toDouble(),
                        _draft.yearMax.toDouble(),
                      ),
                      labels: RangeLabels(
                        _draft.yearMin.toString(),
                        _draft.yearMax.toString(),
                      ),
                      onChanged: (r) => setState(
                        () => _draft = _draft.copyWith(
                          yearMin: r.start.toInt(),
                          yearMax: r.end.toInt(),
                        ),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${_draft.yearMin}',
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          '${_draft.yearMax}',
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),

                    _sectionLabel('Max Mileage (km)'),
                    Slider(
                      min: 0,
                      max: 200000,
                      divisions: 40,
                      activeColor: AppTheme.secondary,
                      inactiveColor: Colors.white12,
                      value: (_draft.mileageMax ?? 200000).clamp(0, 200000),
                      label: _draft.mileageMax != null
                          ? '${_draft.mileageMax!.toInt().toStringAsFixed(0)} km'
                          : '200,000+ km',
                      onChanged: (v) => setState(
                        () => _draft = _draft.copyWith(mileageMax: v),
                      ),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        _draft.mileageMax != null
                            ? '${_draft.mileageMax!.toInt()} km'
                            : '200,000+ km',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    ),

                    _sectionLabel('Vehicle Features'),
                    _amenityChips(_carAmenities),
                  ],
                ],
              ),
            ),
            // ── Sticky Apply Button ───────────────────────────────────────
            _applyBar(),
          ],
        ),
      ),
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  Widget _sectionLabel(String label) => Padding(
    padding: const EdgeInsets.only(top: 24, bottom: 10),
    child: Text(
      label.toUpperCase(),
      style: const TextStyle(
        color: Colors.white54,
        fontSize: 11,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
    ),
  );

  Widget _textField(
    String hint,
    String value,
    ValueChanged<String> onChanged,
  ) => TextField(
    controller: TextEditingController(text: value),
    onChanged: onChanged,
    style: const TextStyle(color: Colors.white),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white38),
      filled: true,
      fillColor: Colors.white10,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
    ),
  );

  Widget _dropdown(
    String hint,
    String value,
    List<(String, String)> items,
    ValueChanged<String> onChanged,
  ) => DropdownButtonFormField<String>(
    initialValue: value,
    dropdownColor: const Color(0xFF1E293B),
    style: const TextStyle(color: Colors.white),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white38),
      filled: true,
      fillColor: Colors.white10,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
    ),
    items: items
        .map((e) => DropdownMenuItem(value: e.$2, child: Text(e.$1)))
        .toList(),
    onChanged: (v) {
      if (v != null) onChanged(v);
    },
  );

  Widget _segmentedRow({
    required List<(String, String)> options,
    required String selected,
    required ValueChanged<String> onSelect,
  }) => Wrap(
    spacing: 8,
    children: options.map((opt) {
      final isActive = opt.$2 == selected;
      return ChoiceChip(
        label: Text(opt.$1),
        selected: isActive,
        onSelected: (_) => onSelect(opt.$2),
        selectedColor: AppTheme.primary.withValues(alpha: 0.6),
        backgroundColor: Colors.white10,
        labelStyle: TextStyle(
          color: isActive ? AppTheme.secondary : Colors.white70,
          fontSize: 13,
        ),
      );
    }).toList(),
  );

  Widget _propertyTypeGrid() => GridView.count(
    crossAxisCount: 2,
    shrinkWrap: true,
    physics: const NeverScrollableScrollPhysics(),
    mainAxisSpacing: 8,
    crossAxisSpacing: 8,
    childAspectRatio: 3,
    children: _propertyTypes.map((pt) {
      final isActive = _draft.propertyType == pt.$1;
      return GestureDetector(
        onTap: () => setState(
          () =>
              _draft = _draft.copyWith(propertyType: isActive ? 'any' : pt.$1),
        ),
        child: Container(
          decoration: BoxDecoration(
            color: isActive
                ? AppTheme.primary.withValues(alpha: 0.3)
                : Colors.white10,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isActive ? AppTheme.secondary : Colors.transparent,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                pt.$2,
                size: 16,
                color: isActive ? AppTheme.secondary : Colors.white54,
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  pt.$1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: isActive ? AppTheme.secondary : Colors.white70,
                    fontSize: 12,
                    fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }).toList(),
  );

  Widget _amenityChips(List<(String, IconData)> amenities) => Wrap(
    spacing: 8,
    runSpacing: 8,
    children: amenities.map((a) {
      final isActive = _draft.amenities.contains(a.$1.toLowerCase());
      return GestureDetector(
        onTap: () {
          final updated = List<String>.from(_draft.amenities);
          final key = a.$1.toLowerCase();
          if (updated.contains(key)) {
            updated.remove(key);
          } else {
            updated.add(key);
          }
          setState(() => _draft = _draft.copyWith(amenities: updated));
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isActive
                ? AppTheme.primary.withValues(alpha: 0.4)
                : Colors.white10,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isActive ? AppTheme.secondary : Colors.transparent,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                a.$2,
                size: 14,
                color: isActive ? AppTheme.secondary : Colors.white54,
              ),
              const SizedBox(width: 6),
              Text(
                a.$1,
                style: TextStyle(
                  fontSize: 12,
                  color: isActive ? AppTheme.secondary : Colors.white70,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      );
    }).toList(),
  );

  Widget _applyBar() => Container(
    padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
    decoration: BoxDecoration(
      color: const Color(0xFF1E293B),
      border: Border(
        top: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
      ),
    ),
    child: SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: _apply,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: const Text(
          'Apply Filters',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
    ),
  );

  String _fmt(num n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}k';
    return n.toString();
  }
}
