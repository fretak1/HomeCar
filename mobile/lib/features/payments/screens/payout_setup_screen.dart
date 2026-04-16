import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../dashboard/widgets/dashboard_page_scaffold.dart';
import '../../dashboard/widgets/dashboard_utils.dart';
import '../../dashboard/widgets/role_dashboard_scaffold.dart';
import '../providers/payment_provider.dart';

class PayoutSetupScreen extends ConsumerStatefulWidget {
  const PayoutSetupScreen({super.key});

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
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            DashboardPageHeader(
              title: 'Payout Setup',
              subtitle:
                  'Connect your bank details so completed payments and lease proceeds can be settled correctly.',
              onBack: () => Navigator.of(context).maybePop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 900),
                    child: Column(
                      children: [
                        DashboardSectionCard(
                          title: isLinked
                              ? 'Payout account connected'
                              : 'Payout setup required',
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isLinked
                                    ? 'Your payout account is linked and ready to receive marketplace disbursements.'
                                    : 'Add your payout bank details so approved transactions can be routed to your account.',
                                style: const TextStyle(
                                  color: AppTheme.mutedForeground,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Wrap(
                                spacing: 12,
                                runSpacing: 12,
                                children: [
                                  DashboardMetricTile(
                                    icon: Icons.verified_outlined,
                                    label: isLinked
                                        ? 'Payout ready'
                                        : 'Setup incomplete',
                                  ),
                                  DashboardMetricTile(
                                    icon: Icons.account_balance_outlined,
                                    label:
                                        user?.payoutBankCode?.trim().isNotEmpty ??
                                                false
                                            ? 'Bank selected'
                                            : 'Bank missing',
                                  ),
                                  DashboardMetricTile(
                                    icon: Icons.badge_outlined,
                                    label: user?.chapaSubaccountId
                                                ?.trim()
                                                .isNotEmpty ??
                                            false
                                        ? 'Chapa linked'
                                        : 'Chapa pending',
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        DashboardSectionCard(
                          title: 'Bank details',
                          child: Column(
                            children: [
                              DropdownButtonFormField<String>(
                                value: _resolveSelectedBankCode(banks),
                                decoration: _fieldDecoration('Select bank'),
                                items: banks
                                    .map(
                                      (bank) => DropdownMenuItem<String>(
                                        value: _bankValue(bank),
                                        child: Text(_bankLabel(bank)),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (value) =>
                                    setState(() => _bankCode = value),
                              ),
                              const SizedBox(height: 14),
                              TextField(
                                controller: _accountNameController,
                                decoration: _fieldDecoration('Account name'),
                              ),
                              const SizedBox(height: 14),
                              TextField(
                                controller: _accountNumberController,
                                keyboardType: TextInputType.number,
                                decoration: _fieldDecoration('Account number'),
                              ),
                              const SizedBox(height: 14),
                              TextField(
                                controller: _businessNameController,
                                decoration: _fieldDecoration(
                                  'Business name (optional)',
                                ),
                              ),
                              if (paymentState.error != null &&
                                  paymentState.error!.isNotEmpty) ...[
                                const SizedBox(height: 14),
                                Text(
                                  paymentState.error!.replaceFirst(
                                    'Exception: ',
                                    '',
                                  ),
                                  style: const TextStyle(
                                    color: Color(0xFFDC2626),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        DashboardSectionCard(
                          title: 'Save changes',
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              final stacked = constraints.maxWidth < 520;
                              final button = FilledButton(
                                onPressed:
                                    paymentState.isLoading ? null : _save,
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppTheme.primary,
                                  foregroundColor: Colors.white,
                                ),
                                child: paymentState.isLoading
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : Text(
                                        isLinked
                                            ? 'Update payout details'
                                            : 'Save payout details',
                                      ),
                              );

                              if (stacked) {
                                return SizedBox(
                                  width: double.infinity,
                                  child: button,
                                );
                              }

                              return Row(
                                children: [
                                  const Spacer(),
                                  button,
                                ],
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
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
      await ref.read(paymentProvider.notifier).createSubaccount(
            userId: user.id,
            bankCode: _bankCode!,
            accountNumber: _accountNumberController.text.trim(),
            accountName: _accountNameController.text.trim(),
            businessName: _businessNameController.text.trim(),
          );
      await ref.read(authProvider.notifier).refreshCurrentUser();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payout details saved successfully.')),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      _showMessage(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}

InputDecoration _fieldDecoration(String label) {
  return InputDecoration(
    labelText: label,
    filled: true,
    fillColor: AppTheme.inputBackground,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: AppTheme.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: AppTheme.border),
    ),
  );
}
