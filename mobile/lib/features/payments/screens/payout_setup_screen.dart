import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/payment_provider.dart';

class PayoutSetupScreen extends ConsumerStatefulWidget {
  const PayoutSetupScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<PayoutSetupScreen> createState() => _PayoutSetupScreenState();
}

class _PayoutSetupScreenState extends ConsumerState<PayoutSetupScreen> {
  late final TextEditingController _accountNameController;
  late final TextEditingController _accountNumberController;
  late final TextEditingController _businessNameController;
  String? _bankCode;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _accountNameController = TextEditingController(
      text: user?.payoutAccountName ?? user?.name ?? '',
    );
    _accountNumberController = TextEditingController(
      text: user?.payoutAccountNumber ?? '',
    );
    _businessNameController = TextEditingController(text: user?.name ?? '');
    _bankCode = user?.payoutBankCode;
    Future.microtask(() => ref.read(paymentProvider.notifier).fetchBanks());
  }

  @override
  void dispose() {
    _accountNameController.dispose();
    _accountNumberController.dispose();
    _businessNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final paymentState = ref.watch(paymentProvider);
    final banks = paymentState.banks;
    final isLinked =
        user?.chapaSubaccountId != null && user!.chapaSubaccountId!.isNotEmpty;

    return Scaffold(
      appBar: AppBar(title: const Text('Payout Setup')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    isLinked
                        ? Icons.verified_user_outlined
                        : Icons.account_balance_outlined,
                    color: isLinked
                        ? const Color(0xFF34D399)
                        : AppTheme.secondary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isLinked
                              ? 'Payout account linked'
                              : 'Payout setup required',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          isLinked
                              ? 'Your account is ready to receive split payments from Chapa.'
                              : 'Add your bank details so accepted applications and lease payments can be completed.',
                          style: const TextStyle(
                            color: Colors.white70,
                            height: 1.45,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bank Details',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _resolveSelectedBankCode(banks),
                    dropdownColor: const Color(0xFF1E293B),
                    decoration: _inputDecoration('Select bank'),
                    items: banks
                        .map(
                          (bank) => DropdownMenuItem<String>(
                            value: _bankValue(bank),
                            child: Text(_bankLabel(bank)),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setState(() => _bankCode = value),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _accountNameController,
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDecoration('Account name'),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _accountNumberController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDecoration('Account number'),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _businessNameController,
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDecoration('Business name (optional)'),
                  ),
                  if (paymentState.error != null &&
                      paymentState.error!.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Text(
                      paymentState.error!.replaceFirst('Exception: ', ''),
                      style: const TextStyle(color: Colors.redAccent),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: paymentState.isLoading ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.secondary,
                  foregroundColor: AppTheme.darkBackground,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: paymentState.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        isLinked
                            ? 'Update Payout Details'
                            : 'Save Payout Details',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: Colors.white.withOpacity(0.06),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
    );
  }

  String? _resolveSelectedBankCode(List<dynamic> banks) {
    if (_bankCode == null || _bankCode!.isEmpty) {
      return null;
    }
    for (final bank in banks) {
      if (_bankValue(bank) == _bankCode) {
        return _bankCode;
      }
    }
    return null;
  }

  String _bankValue(dynamic bank) {
    if (bank is Map) {
      return (bank['id'] ?? bank['code'] ?? '').toString();
    }
    return '';
  }

  String _bankLabel(dynamic bank) {
    if (bank is Map) {
      return (bank['name'] ?? bank['bank_name'] ?? bank['id'] ?? 'Bank')
          .toString();
    }
    return 'Bank';
  }

  Future<void> _save() async {
    final user = ref.read(authProvider).user;
    if (user == null) {
      _showMessage('Please sign in to configure payouts.');
      return;
    }
    if (!user.isOwnerOrAgent) {
      _showMessage('Only owners and agents can set up payouts.');
      return;
    }
    if (_bankCode == null || _bankCode!.trim().isEmpty) {
      _showMessage('Select a bank first.');
      return;
    }
    if (_accountNameController.text.trim().isEmpty ||
        _accountNumberController.text.trim().isEmpty) {
      _showMessage('Enter both the account name and number.');
      return;
    }

    try {
      await ref
          .read(paymentProvider.notifier)
          .createSubaccount(
            userId: user.id,
            bankCode: _bankCode!,
            accountNumber: _accountNumberController.text.trim(),
            accountName: _accountNameController.text.trim(),
            businessName: _businessNameController.text.trim(),
          );
      await ref.read(authProvider.notifier).refreshCurrentUser();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payout details saved successfully.')),
      );
    } catch (error) {
      if (!mounted) return;
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}
