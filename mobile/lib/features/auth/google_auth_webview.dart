import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_cookie_manager/webview_cookie_manager.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/dio_client.dart';
import '../../../core/api/session_storage.dart';
import 'providers/auth_provider.dart';

class GoogleAuthWebviewScreen extends ConsumerStatefulWidget {
  const GoogleAuthWebviewScreen({
    Key? key,
    required this.authUrl,
    required this.callbackPrefix,
  }) : super(key: key);

  final String authUrl;
  final String callbackPrefix;

  @override
  ConsumerState<GoogleAuthWebviewScreen> createState() =>
      _GoogleAuthWebviewScreenState();
}

class _GoogleAuthWebviewScreenState extends ConsumerState<GoogleAuthWebviewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() => _isLoading = true);
          },
          onPageFinished: (String url) {
            setState(() => _isLoading = false);
          },
          onNavigationRequest: (NavigationRequest request) async {
            if (request.url.startsWith(widget.callbackPrefix)) {
              await _handleSuccess();
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.authUrl));
  }

  Future<void> _handleSuccess() async {
    // 1. Get cookies set by the backend for the baseUrl using the webview_cookie_manager plugin
    final cookieManager = WebviewCookieManager();
    final baseUrl = DioClient.baseUrl;
    final cookies = await cookieManager.getCookies(baseUrl);

    
    // 2. Format them into a single cookie string
    if (cookies.isNotEmpty) {
      final cookieString = cookies.map((c) => '${c.name}=${c.value}').join('; ');
      await ref.read(sessionStorageProvider).writeCookies(cookieString);
    }

    // 3. Refresh user session
    try {
      await ref.read(authProvider.notifier).refreshCurrentUser();
    } catch (_) {
      // ignore
    }

    // 4. Pop back
    if (mounted) {
      context.pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign in with Google'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(false),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
