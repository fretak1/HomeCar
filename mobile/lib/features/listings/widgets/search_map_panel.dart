import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/theme/app_theme.dart';
import '../models/property_model.dart';

class SearchMapPanel extends StatefulWidget {
  const SearchMapPanel({Key? key, required this.properties, this.onMapMoved})
    : super(key: key);

  final List<PropertyModel> properties;
  final Future<void> Function(double lat, double lng, double zoom)? onMapMoved;

  @override
  State<SearchMapPanel> createState() => _SearchMapPanelState();
}

class _SearchMapPanelState extends State<SearchMapPanel> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..addJavaScriptChannel(
        'MapBridge',
        onMessageReceived: (message) {
          try {
            final payload = jsonDecode(message.message) as Map<String, dynamic>;
            if (payload['type'] == 'move' && widget.onMapMoved != null) {
              widget.onMapMoved!(
                (payload['lat'] as num).toDouble(),
                (payload['lng'] as num).toDouble(),
                (payload['zoom'] as num).toDouble(),
              );
            }
          } catch (_) {}
        },
      );
    _loadMap();
  }

  @override
  void didUpdateWidget(covariant SearchMapPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.properties != widget.properties) {
      _loadMap();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.properties.isEmpty) {
      return Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.04),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white10),
        ),
        child: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'No map results yet. Update your search or filters.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white54),
            ),
          ),
        ),
      );
    }

    final approximateCount = widget.properties
        .where((property) => property.lat == null || property.lng == null)
        .length;

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Stack(
        children: [
          Positioned.fill(child: WebViewWidget(controller: _controller)),
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
                  color: const Color(0xE610172A),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white12),
                ),
                child: Text(
                  '$approximateCount listing${approximateCount == 1 ? '' : 's'} shown near the search area because exact coordinates are missing.',
                  style: const TextStyle(
                    color: Colors.white70,
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
                color: const Color(0xE610172A),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: Colors.white12),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.map_outlined, size: 14, color: AppTheme.secondary),
                  SizedBox(width: 6),
                  Text(
                    'Move map to explore results',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
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

  Future<void> _loadMap() async {
    final properties = widget.properties;
    if (properties.isEmpty) return;

    PropertyModel? firstWithCoords;
    for (final property in properties) {
      if (property.lat != null && property.lng != null) {
        firstWithCoords = property;
        break;
      }
    }
    final baseLat = firstWithCoords?.lat ?? 9.03;
    final baseLng = firstWithCoords?.lng ?? 38.74;

    final markers = properties.asMap().entries.map((entry) {
      final index = entry.key;
      final property = entry.value;
      final fallbackOffset = ((index % 4) - 1.5) * 0.01;
      final fallbackRow = ((index ~/ 4) % 4) * 0.008;
      final lat = property.lat ?? (baseLat + fallbackRow);
      final lng = property.lng ?? (baseLng + fallbackOffset);
      return {
        'id': property.id,
        'title': property.title,
        'price': property.price,
        'assetType': property.assetType,
        'location': property.locationLabel,
        'lat': lat,
        'lng': lng,
        'image': property.mainImage,
        'approximate': property.lat == null || property.lng == null,
      };
    }).toList();

    final markerJson = jsonEncode(markers);
    final html =
        '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    html, body, #map { height: 100%; margin: 0; background: #0f172a; }
    .leaflet-container { background: #0f172a; font-family: Arial, sans-serif; }
    .price-marker {
      background: #0f766e;
      color: white;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 700;
      border: 2px solid white;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.35);
      white-space: nowrap;
    }
    .popup-card { width: 190px; }
    .popup-image {
      width: 100%;
      height: 90px;
      border-radius: 10px;
      object-fit: cover;
      background: #e5e7eb;
      margin-bottom: 10px;
    }
    .popup-title { font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .popup-location { font-size: 12px; color: #475569; margin-bottom: 8px; }
    .popup-price { font-weight: 700; color: #0f766e; }
    .popup-note { font-size: 11px; color: #9a3412; margin-top: 8px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const listings = $markerJson;
    const fallbackLat = ${baseLat.toStringAsFixed(6)};
    const fallbackLng = ${baseLng.toStringAsFixed(6)};
    const map = L.map('map', { zoomControl: true }).setView([fallbackLat, fallbackLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const bounds = [];

    listings.forEach((item) => {
      const priceLabel = 'ETB ' + Number(item.price || 0).toFixed(0);
      const marker = L.marker([item.lat, item.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="price-marker">' + priceLabel + '</div>',
          iconSize: [72, 34],
          iconAnchor: [36, 17]
        })
      }).addTo(map);

      const imageHtml = item.image
        ? '<img class="popup-image" src="' + escapeHtml(item.image) + '" alt="Listing image" />'
        : '<div class="popup-image"></div>';

      const approxHtml = item.approximate
        ? '<div class="popup-note">Approximate map position</div>'
        : '';

      marker.bindPopup(
        '<div class="popup-card">' +
          imageHtml +
          '<div class="popup-title">' + escapeHtml(item.title) + '</div>' +
          '<div class="popup-location">' + escapeHtml(item.location) + '</div>' +
          '<div class="popup-price">' + priceLabel + '</div>' +
          approxHtml +
        '</div>'
      );

      bounds.push([item.lat, item.lng]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [28, 28] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    }

    function postMove() {
      if (!window.MapBridge) return;
      const center = map.getCenter();
      MapBridge.postMessage(JSON.stringify({
        type: 'move',
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom()
      }));
    }

    map.on('moveend', postMove);
    setTimeout(postMove, 600);
  </script>
</body>
</html>
''';

    await _controller.loadHtmlString(html);
  }
}
