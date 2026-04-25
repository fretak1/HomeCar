import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/api/api_config.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_card.dart';
import '../providers/payment_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  final double amount;
  final String title;
  final String category; // e.g. 'LISTING_PROMOTION'
  final String? propertyId;
  final String? leaseId;
  final String? payeeId;
  final String? payerId;
  final String? subaccountId;
  final Map<String, dynamic>? meta;
  final String? email;

  const CheckoutScreen({
    required this.amount,
    required this.title,
    required this.category,
    this.propertyId,
    this.leaseId,
    this.payeeId,
    this.payerId,
    this.subaccountId,
    this.meta,
    this.email,
    Key? key,
  }) : super(key: key);

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  WebViewController? _webViewController;
  bool _showWebView = false;
  String? _currentTxRef;

  @override
  void initState() {
    super.initState();
    final prefix = widget.leaseId != null ? 'RENT' : 'TX';
    _currentTxRef = '$prefix-${DateTime.now().millisecondsSinceEpoch}';
  }

  void _startPayment() async {
    final currentUser = ref.read(authProvider).user;
    if (currentUser == null) {
      _showMessage('Please sign in before starting payment.');
      return;
    }

    if (widget.payeeId == null ||
        widget.payeeId!.isEmpty ||
        widget.subaccountId == null ||
        widget.subaccountId!.isEmpty) {
      _showMessage('This payment is missing payout details.');
      return;
    }

    final notifier = ref.read(paymentProvider.notifier);
    final txRef =
        _currentTxRef ?? 'TX-${DateTime.now().millisecondsSinceEpoch}';
    final nameParts = currentUser.name.trim().split(RegExp(r'\s+'));
    final firstName = nameParts.isNotEmpty ? nameParts.first : 'Customer';
    final lastName = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';

    final checkoutUrl = await notifier.initialize({
      'amount': widget.amount,
      'email': widget.email ?? currentUser.email,
      'firstName': firstName,
      'lastName': lastName,
      'txRef': txRef,
        'returnUrl': ApiConfig.paymentSuccessReturnUrl(txRef),
      'subaccountId': widget.subaccountId,
      'leaseId': widget.leaseId,
      'propertyId': widget.propertyId,
      'payerId': widget.payerId ?? currentUser.id,
      'payeeId': widget.payeeId,
      if (widget.meta != null && widget.meta!.isNotEmpty) 'meta': widget.meta,
    });

    if (checkoutUrl != null) {
      setState(() {
        _webViewController = WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..setNavigationDelegate(
            NavigationDelegate(
              onPageStarted: (url) {
                if (_currentTxRef != null && url.contains(_currentTxRef!)) {
                  context.pushReplacement(
                    '/checkout/success/${_currentTxRef!}',
                  );
                }
              },
            ),
          )
          ..loadRequest(Uri.parse(checkoutUrl));
        _showWebView = true;
      });
      return;
    }

    _showMessage(
      ref.read(paymentProvider).error?.replaceFirst('Exception: ', '') ??
          'Unable to initialize payment.',
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(paymentProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0F172A), Color(0xFF1E1B4B)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(context),
              Expanded(
                child: _showWebView && _webViewController != null
                    ? WebViewWidget(controller: _webViewController!)
                    : _buildSummary(state),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(
              Icons.arrow_back_ios,
              color: Colors.white,
              size: 20,
            ),
            onPressed: () => context.pop(),
          ),
          const SizedBox(width: 8),
          const Text(
            'Checkout',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummary(PaymentState state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GlassCard(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Transaction Summary',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  widget.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.category,
                  style: const TextStyle(color: Colors.white38, fontSize: 14),
                ),
                const Divider(color: Colors.white10, height: 40),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Amount Due',
                      style: TextStyle(color: Colors.white70, fontSize: 16),
                    ),
                    Text(
                      '${widget.amount.toStringAsFixed(2)} ETB',
                      style: const TextStyle(
                        color: AppTheme.secondary,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                if (state.error != null && state.error!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(
                    state.error!.replaceFirst('Exception: ', ''),
                    style: const TextStyle(
                      color: Colors.redAccent,
                      fontSize: 13,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 40),
          const Text(
            'Select Payment Method',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _methodTile(
            'Chapa Wallet',
            Icons.account_balance_wallet_outlined,
            true,
          ),
          _methodTile('Bank Transfer', Icons.account_balance_outlined, false),
          const SizedBox(height: 60),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: state.isLoading ? null : _startPayment,
              child: state.isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text(
                      'PAY NOW',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        letterSpacing: 1.2,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 16),
          const Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.security, color: Colors.white24, size: 14),
                SizedBox(width: 8),
                Text(
                  'Secure Payment processed by Chapa',
                  style: TextStyle(color: Colors.white24, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Widget _methodTile(String label, IconData icon, bool selected) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(selected ? 0.1 : 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: selected
              ? AppTheme.secondary.withOpacity(0.5)
              : Colors.white10,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: selected ? AppTheme.secondary : Colors.white38),
          const SizedBox(width: 16),
          Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : Colors.white38,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          if (selected)
            const Icon(Icons.check_circle, color: AppTheme.secondary, size: 20),
        ],
      ),
    );
  }
}

