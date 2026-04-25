import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:ui_web' as ui_web;
// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import '../../../core/theme/app_theme.dart';

class CameraCaptureScreen extends StatefulWidget {
  final bool isFront;
  const CameraCaptureScreen({super.key, this.isFront = true});

  @override
  State<CameraCaptureScreen> createState() => _CameraCaptureScreenState();
}

class _CameraCaptureScreenState extends State<CameraCaptureScreen> {
  // Mobile specific
  CameraController? _controller;
  bool _isInitialized = false;

  // Web specific
  html.VideoElement? _webVideoElement;
  String? _webError;
  bool _isWebInitialized = false;
  late final String _viewId;

  @override
  void initState() {
    super.initState();
    _viewId = 'web-camera-${DateTime.now().millisecondsSinceEpoch}';
    if (kIsWeb) {
      _initWebCamera();
    } else {
      _initMobileCamera();
    }
  }

  Future<void> _initWebCamera() async {
    try {
      final stream = await html.window.navigator.mediaDevices?.getUserMedia({
        'video': {
          'facingMode': widget.isFront ? 'user' : 'environment',
          'width': {'ideal': 1280},
          'height': {'ideal': 720},
        }
      });

      if (stream == null) {
        setState(() => _webError = 'Could not access camera stream');
        return;
      }

      _webVideoElement = html.VideoElement()
        ..srcObject = stream
        ..autoplay = true
        ..muted = true
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.objectFit = 'cover';

      ui_web.platformViewRegistry.registerViewFactory(_viewId, (int viewId) => _webVideoElement!);

      setState(() {
        _isWebInitialized = true;
      });
    } catch (e) {
      setState(() => _webError = 'Web camera error: $e');
    }
  }

  Future<void> _initMobileCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() => _webError = 'No cameras found');
        return;
      }

      final camera = cameras.firstWhere(
        (c) => c.lensDirection == (widget.isFront ? CameraLensDirection.front : CameraLensDirection.back),
        orElse: () => cameras.first,
      );

      _controller = CameraController(camera, ResolutionPreset.high, enableAudio: false);
      await _controller!.initialize();
      if (mounted) setState(() => _isInitialized = true);
    } catch (e) {
      if (mounted) setState(() => _webError = 'Mobile camera error: $e');
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    _webVideoElement?.srcObject?.getTracks().forEach((track) => track.stop());
    _webVideoElement?.remove();
    super.dispose();
  }

  Future<void> _takePicture() async {
    if (kIsWeb) {
      if (!_isWebInitialized || _webVideoElement == null) return;
      try {
        final canvas = html.CanvasElement(
          width: _webVideoElement!.videoWidth,
          height: _webVideoElement!.videoHeight,
        );
        canvas.context2D.drawImage(_webVideoElement!, 0, 0);
        final dataUrl = canvas.toDataUrl('image/jpeg', 0.9);
        final base64String = dataUrl.split(',')[1];
        final bytes = html.window.atob(base64String).runes.toList();
        
        Navigator.pop(context, XFile.fromData(Uint8List.fromList(bytes), name: 'capture.jpg', mimeType: 'image/jpeg'));
      } catch (e) {
        debugPrint('Web capture error: $e');
      }
    } else {
      if (!_isInitialized || _controller == null || _controller!.value.isTakingPicture) return;
      try {
        final image = await _controller!.takePicture();
        if (mounted) Navigator.pop(context, image);
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Capture error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            if (kIsWeb && _isWebInitialized)
              Center(
                child: HtmlElementView(viewType: _viewId),
              )
            else if (!kIsWeb && _isInitialized && _controller != null)
              Center(child: CameraPreview(_controller!))
            else if (_webError != null)
              Center(child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
                    const SizedBox(height: 16),
                    Text(_webError!, style: const TextStyle(color: Colors.white), textAlign: TextAlign.center),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Go Back'),
                    )
                  ],
                ),
              ))
            else
              const Center(child: CircularProgressIndicator(color: Colors.white)),
            
            // UI Overlay
            Positioned(
              top: 16,
              left: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            
            Positioned(
              bottom: 40,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  const Text('Position your face within the frame', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 24),
                  GestureDetector(
                    onTap: _takePicture,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 4)),
                      child: Container(width: 70, height: 70, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
