import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import 'models/transaction_model.dart';
import 'repositories/transaction_repository.dart';

class ReceiptPreviewScreen extends ConsumerStatefulWidget {
  const ReceiptPreviewScreen({
    Key? key,
    required this.transactionId,
    this.transaction,
  }) : super(key: key);

  final String transactionId;
  final TransactionModel? transaction;

  @override
  ConsumerState<ReceiptPreviewScreen> createState() =>
      _ReceiptPreviewScreenState();
}

class _ReceiptPreviewScreenState extends ConsumerState<ReceiptPreviewScreen> {
  WebViewController? _webViewController;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadReceipt);
  }

  Future<void> _loadReceipt() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final dataUri = await ref
          .read(transactionRepositoryProvider)
          .downloadReceipt(widget.transactionId);
      if (dataUri == null || dataUri.isEmpty) {
        throw Exception('Receipt PDF is unavailable for this transaction.');
      }
      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..loadHtmlString(_buildReceiptHtml(dataUri));
      if (!mounted) return;
      setState(() {
        _webViewController = controller;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final transaction = widget.transaction;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Receipt'),
        actions: [
          IconButton(
            onPressed: _isLoading ? null : _copyReference,
            icon: const Icon(Icons.copy_all_outlined),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _ErrorState(
              error: _error!,
              onRetry: _loadReceipt,
              transaction: transaction,
            )
          : Column(
              children: [
                if (transaction != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                    child: Text(
                      '${transaction.amount.toStringAsFixed(0)} ${transaction.currency} - ${transaction.property?.title ?? transaction.type}',
                      style: const TextStyle(color: Colors.white70),
                    ),
                  ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: _webViewController == null
                          ? const SizedBox.shrink()
                          : WebViewWidget(controller: _webViewController!),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  void _copyReference() async {
    final value = widget.transaction?.chapaReference ?? widget.transactionId;
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Receipt reference copied.')));
  }

  String _buildReceiptHtml(String dataUri) {
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
    <div class="fallback">If the PDF does not render here, reopen the receipt after the next app update with native PDF support.</div>
  </body>
</html>
''';
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({
    required this.error,
    required this.onRetry,
    this.transaction,
  });

  final String error;
  final Future<void> Function() onRetry;
  final TransactionModel? transaction;

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
                Icons.picture_as_pdf_outlined,
                color: AppTheme.secondary.withOpacity(0.95),
                size: 44,
              ),
              const SizedBox(height: 16),
              Text(
                'Receipt unavailable',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 10),
              Text(
                error,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, height: 1.5),
              ),
              if (transaction != null) ...[
                const SizedBox(height: 14),
                Text(
                  transaction!.chapaReference ?? transaction!.id,
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
