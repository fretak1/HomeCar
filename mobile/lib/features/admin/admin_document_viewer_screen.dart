import 'dart:convert';
import 'dart:typed_data';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
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
    if (!kIsWeb && !_isNetworkImage && _imageBytes == null) {
      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..loadHtmlString(_buildHtml(_resolvedSource));
      _isReady = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final imageBytes = _imageBytes;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        surfaceTintColor: Colors.white,
        elevation: 0,
      ),
      body: widget.source.trim().isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Document source is unavailable.',
                  style: TextStyle(color: Color(0xFF475569)),
                ),
              ),
            )
          : imageBytes != null
          ? Container(
              color: const Color(0xFFF8FAFC),
              alignment: Alignment.center,
              child: InteractiveViewer(
                minScale: 1,
                maxScale: 4,
                child: Image.memory(imageBytes, fit: BoxFit.contain),
              ),
            )
          : _isNetworkImage
          ? Container(
              color: const Color(0xFFF8FAFC),
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
                      style: TextStyle(color: Color(0xFF475569)),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            )
          : kIsWeb
          ? _BrowserDocumentFallback(source: _resolvedSource)
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
        background: #f8fafc;
        color: #0f172a;
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

class _BrowserDocumentFallback extends StatelessWidget {
  const _BrowserDocumentFallback({required this.source});

  final String source;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF8FAFC),
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 560),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x12000000),
                blurRadius: 24,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.open_in_browser_outlined,
                  size: 40,
                  color: Color(0xFF0F766E),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Document preview is not embedded in the browser build yet.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'The browser app will stay stable here instead of crashing on WebView initialization.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF475569),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 18),
                SelectableText(
                  source,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF0F766E),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

