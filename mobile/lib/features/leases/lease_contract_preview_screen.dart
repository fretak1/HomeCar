import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import 'models/lease_model.dart';
import 'repositories/lease_repository.dart';

class LeaseContractPreviewScreen extends ConsumerStatefulWidget {
  const LeaseContractPreviewScreen({
    super.key,
    required this.leaseId,
    this.lease,
  });

  final String leaseId;
  final LeaseModel? lease;

  @override
  ConsumerState<LeaseContractPreviewScreen> createState() =>
      _LeaseContractPreviewScreenState();
}

class _LeaseContractPreviewScreenState
    extends ConsumerState<LeaseContractPreviewScreen> {
  WebViewController? _webViewController;
  bool _isLoading = true;
  String? _error;
  String? _contractDataUri;

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadContract);
  }

  Future<void> _loadContract() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dataUri = await ref
          .read(leaseRepositoryProvider)
          .downloadContract(widget.leaseId);
      if (dataUri == null || dataUri.isEmpty) {
        throw Exception('Lease agreement PDF is unavailable for this lease.');
      }

      if (!mounted) {
        return;
      }

      if (kIsWeb) {
        setState(() {
          _contractDataUri = dataUri;
          _isLoading = false;
        });
        return;
      }

      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..loadHtmlString(_buildHtml(dataUri));

      setState(() {
        _contractDataUri = dataUri;
        _webViewController = controller;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final lease = widget.lease;

    return Scaffold(
      appBar: AppBar(title: const Text('Lease Agreement')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _LeaseContractErrorState(
              error: _error!,
              onRetry: _loadContract,
              lease: lease,
            )
          : Column(
              children: [
                if (lease != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                    child: Text(
                      '${lease.property?.title ?? 'Lease agreement'} - ${lease.status.replaceAll('_', ' ')}',
                      style: const TextStyle(color: Colors.white70),
                    ),
                  ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: kIsWeb
                          ? const _BrowserPdfFallback(
                              title: 'Lease agreement preview',
                            )
                          : _webViewController == null
                          ? const SizedBox.shrink()
                          : WebViewWidget(controller: _webViewController!),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  String _buildHtml(String dataUri) {
    return '''
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        background: #0f172a;
      }
      embed {
        width: 100%;
        height: 100vh;
      }
      .fallback {
        color: white;
        font-family: sans-serif;
        padding: 24px;
      }
    </style>
  </head>
  <body>
    <embed src="$dataUri" type="application/pdf" />
    <div class="fallback">If the PDF does not render here, reopen the agreement after the next app update with native PDF support.</div>
  </body>
</html>
''';
  }
}

class _BrowserPdfFallback extends StatelessWidget {
  const _BrowserPdfFallback({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF8FAFC),
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 520),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.description_outlined,
              size: 40,
              color: Color(0xFF0F766E),
            ),
            const SizedBox(height: 16),
            Text(
              '$title is not embedded in the browser build yet.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'This screen now stays stable on web instead of crashing when WebView is unavailable.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF475569),
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LeaseContractErrorState extends StatelessWidget {
  const _LeaseContractErrorState({
    required this.error,
    required this.onRetry,
    this.lease,
  });

  final String error;
  final Future<void> Function() onRetry;
  final LeaseModel? lease;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: GlassCard(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.description_outlined,
                color: AppTheme.secondary.withOpacity(0.95),
                size: 44,
              ),
              const SizedBox(height: 16),
              Text(
                'Agreement unavailable',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 10),
              Text(
                error,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, height: 1.5),
              ),
              if (lease != null) ...[
                const SizedBox(height: 14),
                Text(
                  lease!.property?.title ?? lease!.id,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: () => onRetry(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
