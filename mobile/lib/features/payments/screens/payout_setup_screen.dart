import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../../dashboard/widgets/dashboard_page_scaffold.dart';
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
  bool _isEditing = false;

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
    final showSummary = isLinked && !_isEditing;
    final isBanksLoading = paymentState.isLoading && banks.isEmpty;
    final currentBank = _findCurrentBank(banks, user?.payoutBankCode);
    final bankName = currentBank != null
        ? _bankLabel(currentBank)
        : (user?.payoutBankCode?.trim().isNotEmpty ?? false)
              ? user!.payoutBankCode!
              : 'Bank not selected';

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
                          title: 'Payout Settings',
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              LayoutBuilder(
                                builder: (context, constraints) {
                                  final compact = constraints.maxWidth < 560;
                                  final header = Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 42,
                                        height: 42,
                                        decoration: BoxDecoration(
                                          color: AppTheme.primary.withValues(
                                            alpha: 0.10,
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            14,
                                          ),
                                        ),
                                        child: const Icon(
                                          Icons.credit_card_rounded,
                                          color: AppTheme.primary,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      const Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Payout Settings',
                                              style: TextStyle(
                                                color: AppTheme.foreground,
                                                fontSize: 20,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                            SizedBox(height: 4),
                                            Text(
                                              'Configure where you want to receive your earnings',
                                              style: TextStyle(
                                                color: AppTheme.mutedForeground,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  );

                                  Widget? action;
                                  if (showSummary) {
                                    action = OutlinedButton(
                                      onPressed: () {
                                        setState(() {
                                          _isEditing = true;
                                        });
                                      },
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: AppTheme.foreground,
                                        side: const BorderSide(
                                          color: AppTheme.border,
                                        ),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            14,
                                          ),
                                        ),
                                      ),
                                      child: const Text(
                                        'Update Account',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    );
                                  } else if (_isEditing) {
                                    action = TextButton(
                                      onPressed: () {
                                        setState(() {
                                          _isEditing = false;
                                          _resetFromUser(user);
                                        });
                                      },
                                      child: const Text(
                                        'Cancel',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    );
                                  }

                                  if (compact || action == null) {
                                    return Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        header,
                                        if (action != null) ...[
                                          const SizedBox(height: 14),
                                          action,
                                        ],
                                      ],
                                    );
                                  }

                                  return Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Expanded(child: header),
                                      const SizedBox(width: 12),
                                      action,
                                    ],
                                  );
                                },
                              ),
                              const SizedBox(height: 18),
                              AnimatedSwitcher(
                                duration: const Duration(milliseconds: 220),
                                child: showSummary
                                    ? Column(
                                        key: const ValueKey('payout-summary'),
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          _banner(
                                            backgroundColor:
                                                const Color(0xFFF0FDF4),
                                            borderColor:
                                                const Color(0xFFBBF7D0),
                                            icon: Icons.check_circle_outline,
                                            iconBackground:
                                                const Color(0xFFDCFCE7),
                                            iconColor:
                                                const Color(0xFF16A34A),
                                            title: 'Account Linked & Verified',
                                            subtitle:
                                                'Your funds will be automatically settled to this account.',
                                            textColor:
                                                const Color(0xFF166534),
                                          ),
                                          const SizedBox(height: 16),
                                          LayoutBuilder(
                                            builder: (context, constraints) {
                                              final compact =
                                                  constraints.maxWidth < 720;
                                              return Wrap(
                                                spacing: 12,
                                                runSpacing: 12,
                                                children: [
                                                  _summaryTile(
                                                    compact: compact,
                                                    label: 'Receiving Bank',
                                                    value: isBanksLoading
                                                        ? 'Loading bank info...'
                                                        : bankName,
                                                    icon: Icons
                                                        .account_balance_outlined,
                                                  ),
                                                  _summaryTile(
                                                    compact: compact,
                                                    label: 'Account Holder',
                                                    value: user
                                                                ?.payoutAccountName
                                                                ?.trim()
                                                                .isNotEmpty ==
                                                            true
                                                        ? user!
                                                            .payoutAccountName!
                                                        : 'Account name missing',
                                                    icon: Icons.badge_outlined,
                                                  ),
                                                  _summaryTile(
                                                    compact: compact,
                                                    label: 'Account Number',
                                                    value: user
                                                                ?.payoutAccountNumber
                                                                ?.trim()
                                                                .isNotEmpty ==
                                                            true
                                                        ? user!
                                                            .payoutAccountNumber!
                                                        : 'Account number missing',
                                                    icon: Icons.numbers_outlined,
                                                  ),
                                                  _summaryTile(
                                                    compact: compact,
                                                    label: 'Settlement Type',
                                                    value: 'Direct Deposit',
                                                    icon: Icons
                                                        .payments_outlined,
                                                  ),
                                                ],
                                              );
                                            },
                                          ),
                                        ],
                                      )
                                    : Column(
                                        key: const ValueKey('payout-form'),
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          if (!isLinked) ...[
                                            _banner(
                                              backgroundColor:
                                                  const Color(0xFFFFFBEB),
                                              borderColor:
                                                  const Color(0xFFFDE68A),
                                              icon:
                                                  Icons.error_outline_rounded,
                                              iconBackground:
                                                  const Color(0xFFFEF3C7),
                                              iconColor:
                                                  const Color(0xFFD97706),
                                              title: 'Setup Payout Method',
                                              subtitle:
                                                  'Link your bank account to start receiving direct payments from HomeCar.',
                                              textColor:
                                                  const Color(0xFF92400E),
                                            ),
                                            const SizedBox(height: 16),
                                          ],
                                          LayoutBuilder(
                                            builder: (context, constraints) {
                                              final compact =
                                                  constraints.maxWidth < 720;
                                              final bankField =
                                                  DropdownButtonFormField<String>(
                                                    value:
                                                        _resolveSelectedBankCode(
                                                          banks,
                                                        ),
                                                    decoration: _fieldDecoration(
                                                      'Select bank',
                                                    ),
                                                    items: banks
                                                        .map(
                                                          (
                                                            bank,
                                                          ) => DropdownMenuItem<
                                                            String
                                                          >(
                                                            value:
                                                                _bankValue(bank),
                                                            child: Text(
                                                              _bankLabel(bank),
                                                            ),
                                                          ),
                                                        )
                                                        .toList(),
                                                    onChanged:
                                                        paymentState.isLoading
                                                        ? null
                                                        : (value) => setState(
                                                            () =>
                                                                _bankCode =
                                                                    value,
                                                          ),
                                                  );
                                              final nameField = TextField(
                                                controller:
                                                    _accountNameController,
                                                decoration: _fieldDecoration(
                                                  'Account holder name',
                                                ),
                                              );
                                              final numberField = TextField(
                                                controller:
                                                    _accountNumberController,
                                                keyboardType:
                                                    TextInputType.number,
                                                decoration: _fieldDecoration(
                                                  'Account number',
                                                ),
                                              );
                                              final businessField = TextField(
                                                controller:
                                                    _businessNameController,
                                                decoration: _fieldDecoration(
                                                  'Business reference (optional)',
                                                ),
                                              );

                                              if (compact) {
                                                return Column(
                                                  children: [
                                                    bankField,
                                                    const SizedBox(height: 12),
                                                    nameField,
                                                    const SizedBox(height: 12),
                                                    numberField,
                                                    const SizedBox(height: 12),
                                                    businessField,
                                                  ],
                                                );
                                              }

                                              return Wrap(
                                                spacing: 12,
                                                runSpacing: 12,
                                                children: [
                                                  SizedBox(
                                                    width:
                                                        (constraints.maxWidth -
                                                            12) /
                                                        2,
                                                    child: bankField,
                                                  ),
                                                  SizedBox(
                                                    width:
                                                        (constraints.maxWidth -
                                                            12) /
                                                        2,
                                                    child: nameField,
                                                  ),
                                                  SizedBox(
                                                    width:
                                                        (constraints.maxWidth -
                                                            12) /
                                                        2,
                                                    child: numberField,
                                                  ),
                                                  SizedBox(
                                                    width:
                                                        (constraints.maxWidth -
                                                            12) /
                                                        2,
                                                    child: businessField,
                                                  ),
                                                ],
                                              );
                                            },
                                          ),
                                          if (paymentState.error != null &&
                                              paymentState.error!.isNotEmpty) ...[
                                            const SizedBox(height: 12),
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
                                          const SizedBox(height: 16),
                                          LayoutBuilder(
                                            builder: (context, constraints) {
                                              final button = FilledButton(
                                                onPressed: paymentState.isLoading
                                                    ? null
                                                    : _save,
                                                style:
                                                    FilledButton.styleFrom(
                                                      backgroundColor:
                                                          AppTheme.primary,
                                                      foregroundColor:
                                                          Colors.white,
                                                    ),
                                                child: paymentState.isLoading
                                                    ? const SizedBox(
                                                        width: 20,
                                                        height: 20,
                                                        child:
                                                            CircularProgressIndicator(
                                                              strokeWidth: 2,
                                                              color:
                                                                  Colors.white,
                                                            ),
                                                      )
                                                    : Text(
                                                        isLinked
                                                            ? 'Update payout details'
                                                            : 'Verify & setup account',
                                                      ),
                                              );
                                              if (constraints.maxWidth < 520) {
                                                return SizedBox(
                                                  width: double.infinity,
                                                  child: button,
                                                );
                                              }
                                              return button;
                                            },
                                          ),
                                        ],
                                      ),
                              ),
                            ],
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
      if (bank is! Map) {
        continue;
      }
      final id = bank['id']?.toString().trim();
      final code = bank['code']?.toString().trim();
      if (id == _bankCode || code == _bankCode) {
        return id?.isNotEmpty == true ? id : code;
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

  Map<String, dynamic>? _findCurrentBank(List<dynamic> banks, String? code) {
    if (code == null || code.trim().isEmpty) {
      return null;
    }
    for (final bank in banks) {
      if (bank is! Map) {
        continue;
      }
      final id = bank['id']?.toString().trim();
      final bankCode = bank['code']?.toString().trim();
      if (id == code || bankCode == code) {
        return Map<String, dynamic>.from(bank);
      }
    }
    return null;
  }

  void _resetFromUser(UserModel? user) {
    _accountNameController.text = user?.payoutAccountName ?? user?.name ?? '';
    _accountNumberController.text = user?.payoutAccountNumber ?? '';
    _businessNameController.text = user?.name ?? '';
    _bankCode = user?.payoutBankCode;
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
      setState(() {
        _isEditing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payout details saved and verified with Chapa.'),
        ),
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

Widget _banner({
  required Color backgroundColor,
  required Color borderColor,
  required IconData icon,
  required Color iconBackground,
  required Color iconColor,
  required String title,
  required String subtitle,
  required Color textColor,
}) {
  return Container(
    width: double.infinity,
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: backgroundColor,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: borderColor),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: iconBackground,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: textColor,
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(color: textColor, height: 1.4),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

Widget _summaryTile({
  required bool compact,
  required String label,
  required String value,
  required IconData icon,
}) {
  return Container(
    width: compact ? double.infinity : 260,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(14),
      color: const Color(0xFFF8FAFC),
      border: Border.all(color: AppTheme.border),
    ),
    child: Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.mutedForeground,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: AppTheme.foreground,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
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

