import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/property_model.dart';

class SearchMapPanel extends StatefulWidget {
  const SearchMapPanel({super.key, required this.properties, this.onMapMoved});

  final List<PropertyModel> properties;
  final Future<void> Function(double lat, double lng, double zoom)? onMapMoved;

  @override
  State<SearchMapPanel> createState() => _SearchMapPanelState();
}

class _SearchMapPanelState extends State<SearchMapPanel> {
  final TransformationController _transformationController =
      TransformationController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _reportViewport());
  }

  @override
  void didUpdateWidget(covariant SearchMapPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.properties != widget.properties) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _reportViewport());
    }
  }

  @override
  void dispose() {
    _transformationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.properties.isEmpty) {
      return Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppTheme.border),
        ),
        child: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'No map results yet. Update your search or filters.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.mutedForeground,
                height: 1.45,
              ),
            ),
          ),
        ),
      );
    }

    final markers = _buildMarkers(widget.properties);
    final approximateCount = markers.where((marker) => marker.approximate).length;

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFF8FAFC), Color(0xFFEFF6FF)],
                ),
              ),
              child: InteractiveViewer(
                transformationController: _transformationController,
                minScale: 1,
                maxScale: 3.2,
                boundaryMargin: const EdgeInsets.all(120),
                onInteractionEnd: (_) => _reportViewport(),
                child: SizedBox(
                  width: 960,
                  height: 540,
                  child: Stack(
                    children: [
                      const Positioned.fill(child: _MapBackdrop()),
                      for (final marker in markers)
                        Positioned(
                          left: marker.left,
                          top: marker.top,
                          child: _MapMarkerChip(marker: marker),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (approximateCount > 0)
            Positioned(
              left: 12,
              right: 12,
              top: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.96),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.border),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0F000000),
                      blurRadius: 14,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Text(
                  '$approximateCount listing${approximateCount == 1 ? '' : 's'} shown near the search area because exact coordinates are missing.',
                  style: const TextStyle(
                    color: AppTheme.mutedForeground,
                    fontSize: 12,
                    height: 1.35,
                  ),
                ),
              ),
            ),
          Positioned(
            right: 12,
            bottom: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.96),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppTheme.border),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0F000000),
                    blurRadius: 14,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.map_outlined, size: 14, color: AppTheme.primary),
                  SizedBox(width: 6),
                  Text(
                    'Drag or pinch to inspect results',
                    style: TextStyle(
                      color: AppTheme.foreground,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<_MapMarkerData> _buildMarkers(List<PropertyModel> properties) {
    PropertyModel? firstWithCoords;
    for (final property in properties) {
      if (property.lat != null && property.lng != null) {
        firstWithCoords = property;
        break;
      }
    }

    final baseLat = firstWithCoords?.lat ?? 9.03;
    final baseLng = firstWithCoords?.lng ?? 38.74;

    final computed = <_MapPointData>[];
    for (var index = 0; index < properties.length; index++) {
      final property = properties[index];
      final fallbackOffset = ((index % 4) - 1.5) * 0.01;
      final fallbackRow = ((index ~/ 4) % 4) * 0.008;
      final lat = property.lat ?? (baseLat + fallbackRow);
      final lng = property.lng ?? (baseLng + fallbackOffset);

      computed.add(
        _MapPointData(
          property: property,
          lat: lat,
          lng: lng,
          approximate: property.lat == null || property.lng == null,
        ),
      );
    }

    final latitudes = computed.map((item) => item.lat).toList();
    final longitudes = computed.map((item) => item.lng).toList();

    final minLat = latitudes.reduce((a, b) => a < b ? a : b);
    final maxLat = latitudes.reduce((a, b) => a > b ? a : b);
    final minLng = longitudes.reduce((a, b) => a < b ? a : b);
    final maxLng = longitudes.reduce((a, b) => a > b ? a : b);

    final latSpan = (maxLat - minLat).abs() < 0.001 ? 0.02 : (maxLat - minLat);
    final lngSpan = (maxLng - minLng).abs() < 0.001 ? 0.02 : (maxLng - minLng);

    return computed.map((item) {
      final normalizedX = ((item.lng - minLng) / lngSpan).clamp(0.0, 1.0);
      final normalizedY = ((item.lat - minLat) / latSpan).clamp(0.0, 1.0);

      return _MapMarkerData(
        property: item.property,
        approximate: item.approximate,
        left: 72 + normalizedX * 760,
        top: 54 + (1 - normalizedY) * 390,
      );
    }).toList(growable: false);
  }

  Future<void> _reportViewport() async {
    if (widget.onMapMoved == null || widget.properties.isEmpty) {
      return;
    }

    PropertyModel? firstWithCoords;
    for (final property in widget.properties) {
      if (property.lat != null && property.lng != null) {
        firstWithCoords = property;
        break;
      }
    }

    final lat = firstWithCoords?.lat ?? 9.03;
    final lng = firstWithCoords?.lng ?? 38.74;
    final zoom = 12 * _transformationController.value.getMaxScaleOnAxis();

    await widget.onMapMoved!(lat, lng, zoom);
  }
}

class _MapBackdrop extends StatelessWidget {
  const _MapBackdrop();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _MapBackdropPainter(),
      child: Container(),
    );
  }
}

class _MapMarkerChip extends StatelessWidget {
  const _MapMarkerChip({required this.marker});

  final _MapMarkerData marker;

  @override
  Widget build(BuildContext context) {
    final label = marker.property.price >= 1000
        ? 'ETB ${(marker.property.price / 1000).toStringAsFixed(0)}k'
        : 'ETB ${marker.property.price.toStringAsFixed(0)}';
    final imageUrl = marker.property.images.isNotEmpty
        ? marker.property.mainImage
        : null;
    final markerColor = marker.approximate
        ? const Color(0xFF0F766E)
        : AppTheme.primary;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            image: imageUrl != null
                ? DecorationImage(
                    image: NetworkImage(imageUrl),
                    fit: BoxFit.cover,
                  )
                : null,
            color: imageUrl == null ? markerColor : null,
            boxShadow: const [
              BoxShadow(
                color: Color(0x330F172A),
                blurRadius: 14,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: imageUrl == null
              ? const Icon(
                  Icons.home_work_outlined,
                  color: Colors.white,
                  size: 18,
                )
              : null,
        ),
        Transform.translate(
          offset: const Offset(0, -4),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 120),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: markerColor,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white, width: 1.5),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x220F172A),
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
        Transform.translate(
          offset: const Offset(0, -7),
          child: Container(
            width: 10,
            height: 10,
          decoration: BoxDecoration(
            color: markerColor,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
          ),
        ),
        ),
      ],
    );
  }
}

class _MapBackdropPainter extends CustomPainter {
  const _MapBackdropPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final panelPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFE5E7EB), Color(0xFFDDE7D3), Color(0xFFD7E6F5)],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, panelPaint);

    final gridPaint = Paint()
      ..color = const Color(0xFF94A3B8).withValues(alpha: 0.24)
      ..strokeWidth = 1;

    for (double x = 0; x <= size.width; x += 80) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y <= size.height; y += 80) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final roadPaint = Paint()
      ..color = const Color(0xFFF8FAFC).withValues(alpha: 0.92)
      ..strokeWidth = 18
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final accentRoadPaint = Paint()
      ..color = const Color(0xFFCBD5E1)
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final paths = [
      [
        Offset(size.width * 0.05, size.height * 0.18),
        Offset(size.width * 0.26, size.height * 0.22),
        Offset(size.width * 0.52, size.height * 0.10),
        Offset(size.width * 0.88, size.height * 0.18),
      ],
      [
        Offset(size.width * 0.12, size.height * 0.78),
        Offset(size.width * 0.34, size.height * 0.60),
        Offset(size.width * 0.58, size.height * 0.72),
        Offset(size.width * 0.85, size.height * 0.52),
      ],
      [
        Offset(size.width * 0.18, size.height * 0.04),
        Offset(size.width * 0.24, size.height * 0.28),
        Offset(size.width * 0.22, size.height * 0.52),
        Offset(size.width * 0.30, size.height * 0.92),
      ],
      [
        Offset(size.width * 0.72, size.height * 0.06),
        Offset(size.width * 0.64, size.height * 0.34),
        Offset(size.width * 0.74, size.height * 0.62),
        Offset(size.width * 0.68, size.height * 0.94),
      ],
    ];

    for (final points in paths) {
      final path = Path()..moveTo(points.first.dx, points.first.dy);
      path.cubicTo(
        points[1].dx,
        points[1].dy,
        points[2].dx,
        points[2].dy,
        points[3].dx,
        points[3].dy,
      );
      canvas.drawPath(path, roadPaint);
      canvas.drawPath(path, accentRoadPaint);
    }

    final parkPaint = Paint()..color = const Color(0xFFCFE8B4);
    final waterPaint = Paint()..color = const Color(0xFFBFD9F4);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(size.width * 0.08, size.height * 0.34, 150, 90),
        const Radius.circular(22),
      ),
      parkPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(size.width * 0.64, size.height * 0.26, 180, 110),
        const Radius.circular(26),
      ),
      waterPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _MapPointData {
  const _MapPointData({
    required this.property,
    required this.lat,
    required this.lng,
    required this.approximate,
  });

  final PropertyModel property;
  final double lat;
  final double lng;
  final bool approximate;
}

class _MapMarkerData {
  const _MapMarkerData({
    required this.property,
    required this.approximate,
    required this.left,
    required this.top,
  });

  final PropertyModel property;
  final bool approximate;
  final double left;
  final double top;
}
