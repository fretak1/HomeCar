import 'dart:convert';
import 'dart:typed_data';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/api/dio_client.dart';

class AdminDocumentViewerScreen extends StatefulWidget {
  const AdminDocumentViewerScreen({
    super.key,
    required this.title,
    required this.source,
  });

  final String title;
  final String source;

  @override
  State<AdminDocumentViewerScreen> createState() =>
      _AdminDocumentViewerScreenState();
}

class _AdminDocumentViewerScreenState extends State<AdminDocumentViewerScreen> {
  late final WebViewController _controller;
  bool _isReady = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadHtmlString(_buildHtml(_resolvedSource));
    _isReady = true;
  }

  @override
  Widget build(BuildContext context) {
    final imageBytes = _imageBytes;

    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: widget.source.trim().isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('Document source is unavailable.'),
              ),
            )
          : imageBytes != null
          ? Container(
              color: const Color(0xFF020617),
              alignment: Alignment.center,
              child: InteractiveViewer(
                minScale: 1,
                maxScale: 4,
                child: Image.memory(imageBytes, fit: BoxFit.contain),
              ),
            )
          : _isNetworkImage
          ? Container(
              color: const Color(0xFF020617),
              alignment: Alignment.center,
              child: InteractiveViewer(
                minScale: 1,
                maxScale: 4,
                child: CachedNetworkImage(
                  imageUrl: _resolvedSource,
                  fit: BoxFit.contain,
                  progressIndicatorBuilder: (_, __, ___) =>
                      const CircularProgressIndicator(),
                  errorWidget: (_, __, ___) => const Padding(
                    padding: EdgeInsets.all(24),
                    child: Text(
                      'Failed to load this document preview.',
                      style: TextStyle(color: Colors.white70),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            )
          : !_isReady
          ? const Center(child: CircularProgressIndicator())
          : WebViewWidget(controller: _controller),
    );
  }

  bool get _isNetworkImage {
    final lower = _resolvedSource.toLowerCase();
    return lower.startsWith('http') &&
        (lower.endsWith('.jpg') ||
            lower.endsWith('.jpeg') ||
            lower.endsWith('.png') ||
            lower.endsWith('.webp') ||
            lower.endsWith('.gif'));
  }

  Uint8List? get _imageBytes {
    if (!widget.source.startsWith('data:image/')) {
      return null;
    }

    final marker = widget.source.indexOf('base64,');
    if (marker == -1) {
      return null;
    }

    try {
      return base64Decode(widget.source.substring(marker + 7));
    } catch (_) {
      return null;
    }
  }

  String get _resolvedSource {
    final raw = widget.source.trim();
    if (raw.isEmpty || raw.startsWith('http') || raw.startsWith('data:')) {
      return raw;
    }
    return '${DioClient.baseUrl}$raw';
  }

  String _buildHtml(String source) {
    final jsonSource = jsonEncode(source);
    return '''
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        background: #020617;
        color: #e2e8f0;
        font-family: sans-serif;
      }
      iframe, embed {
        border: 0;
        width: 100%;
        height: 100%;
        background: white;
      }
      .frame {
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div class="frame">
      <iframe id="doc-frame" allowfullscreen></iframe>
    </div>
    <script>
      const source = $jsonSource;
      document.getElementById('doc-frame').src = source;
    </script>
  </body>
</html>
''';
  }
}
