import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../applications/models/application_model.dart';
import '../dashboard/widgets/dashboard_page_scaffold.dart';
import '../dashboard/widgets/dashboard_utils.dart';
import '../dashboard/widgets/role_dashboard_scaffold.dart';
import 'providers/lease_provider.dart';

class CreateLeaseScreen extends ConsumerStatefulWidget {
  const CreateLeaseScreen({super.key, required this.application});

  final PropertyApplication application;

  @override
  ConsumerState<CreateLeaseScreen> createState() => _CreateLeaseScreenState();
}

class _CreateLeaseScreenState extends ConsumerState<CreateLeaseScreen> {
  late final TextEditingController _totalPriceController;
  late final TextEditingController _recurringAmountController;
  late final TextEditingController _termsController;
  DateTime? _startDate;
  DateTime? _endDate;
  String _leaseType = 'LongTerm';
  bool _isRecurring = true;

  @override
  void initState() {
    super.initState();
    final basePrice = widget.application.price;
    _totalPriceController = TextEditingController(
      text: basePrice > 0 ? basePrice.toStringAsFixed(0) : '',
    );
    _recurringAmountController = TextEditingController(
      text: basePrice > 0 ? basePrice.toStringAsFixed(0) : '',
    );
    _termsController = TextEditingController(
      text:
          'The tenant agrees to maintain the property in good condition and pay on time. Both parties will provide notice before cancellation.',
    );
    final today = DateTime.now();
    _startDate = DateTime(today.year, today.month, today.day);
    _endDate = DateTime(today.year, today.month + 1, today.day);
    _recalculatePrice();
  }

  @override
  void dispose() {
    _totalPriceController.dispose();
    _recurringAmountController.dispose();
    _termsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final actionState = ref.watch(leaseActionProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            DashboardPageHeader(
              title: 'Create New Lease',
              subtitle:
                  'Set the agreement structure, payment model, and lease terms before sending it for approval.',
              onBack: () => Navigator.of(context).maybePop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 960),
                    child: Column(
                      children: [
                        DashboardSectionCard(
                          title: 'Application summary',
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.application.propertyTitle,
                                style: const TextStyle(
                                  color: AppTheme.foreground,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                widget.application.propertyLocation,
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
                                    icon: Icons.person_outline_rounded,
                                    label: widget.application.customerName ??
                                        'Customer',
                                  ),
                                  DashboardMetricTile(
                                    icon: Icons.sell_outlined,
                                    label: formatDashboardMoney(
                                      widget.application.price,
                                    ),
                                  ),
                                  DashboardMetricTile(
                                    icon: Icons.category_outlined,
                                    label: widget.application.listingLabel,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        DashboardSectionCard(
                          title: 'Lease details',
                          child: Column(
                            children: [
                              LayoutBuilder(
                                builder: (context, constraints) {
                                  final stacked = constraints.maxWidth < 720;
                                  final typeField = _SelectField<String>(
                                    label: 'Lease type',
                                    value: _leaseType,
                                    items: const [
                                      DropdownMenuItem(
                                        value: 'LongTerm',
                                        child: Text('Long term'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'ShortTerm',
                                        child: Text('Short term'),
                                      ),
                                    ],
                                    onChanged: (value) {
                                      if (value != null) {
                                        setState(() => _leaseType = value);
                                      }
                                    },
                                  );
                                  final paymentField = _SelectField<bool>(
                                    label: 'Payment model',
                                    value: _isRecurring,
                                    items: const [
                                      DropdownMenuItem(
                                        value: true,
                                        child: Text('Recurring payment'),
                                      ),
                                      DropdownMenuItem(
                                        value: false,
                                        child: Text('One-time contract'),
                                      ),
                                    ],
                                    onChanged: (value) {
                                      if (value == null) {
                                        return;
                                      }
                                      setState(() {
                                        _isRecurring = value;
                                        if (!_isRecurring) {
                                          _recurringAmountController.clear();
                                        } else if (_recurringAmountController
                                            .text
                                            .trim()
                                            .isEmpty) {
                                          _recurringAmountController.text =
                                              widget.application.price
                                                  .toStringAsFixed(0);
                                        }
                                        _recalculatePrice();
                                      });
                                    },
                                  );

                                  if (stacked) {
                                    return Column(
                                      children: [
                                        typeField,
                                        const SizedBox(height: 14),
                                        paymentField,
                                      ],
                                    );
                                  }

                                  return Row(
                                    children: [
                                      Expanded(child: typeField),
                                      const SizedBox(width: 14),
                                      Expanded(child: paymentField),
                                    ],
                                  );
                                },
                              ),
                              const SizedBox(height: 14),
                              LayoutBuilder(
                                builder: (context, constraints) {
                                  final stacked = constraints.maxWidth < 720;
                                  final startField = _DateField(
                                    label: 'Start date',
                                    value: _startDate,
                                    onTap: () => _pickDate(isStart: true),
                                  );
                                  final endField = _DateField(
                                    label: 'End date',
                                    value: _endDate,
                                    onTap: () => _pickDate(isStart: false),
                                  );

                                  if (stacked) {
                                    return Column(
                                      children: [
                                        startField,
                                        const SizedBox(height: 14),
                                        endField,
                                      ],
                                    );
                                  }

                                  return Row(
                                    children: [
                                      Expanded(child: startField),
                                      const SizedBox(width: 14),
                                      Expanded(child: endField),
                                    ],
                                  );
                                },
                              ),
                              const SizedBox(height: 14),
                              LayoutBuilder(
                                builder: (context, constraints) {
                                  final stacked = constraints.maxWidth < 720;
                                  final totalField = _InputField(
                                    label: 'Total contract price (ETB)',
                                    controller: _totalPriceController,
                                    keyboardType:
                                        const TextInputType.numberWithOptions(
                                          decimal: true,
                                        ),
                                  );
                                  final recurringField = _InputField(
                                    label: 'Recurring amount (ETB)',
                                    controller: _recurringAmountController,
                                    enabled: _isRecurring,
                                    keyboardType:
                                        const TextInputType.numberWithOptions(
                                          decimal: true,
                                        ),
                                  );

                                  if (stacked) {
                                    return Column(
                                      children: [
                                        totalField,
                                        const SizedBox(height: 14),
                                        recurringField,
                                      ],
                                    );
                                  }

                                  return Row(
                                    children: [
                                      Expanded(child: totalField),
                                      const SizedBox(width: 14),
                                      Expanded(child: recurringField),
                                    ],
                                  );
                                },
                              ),
                              const SizedBox(height: 14),
                              _InputField(
                                label: 'Terms and conditions',
                                controller: _termsController,
                                minLines: 6,
                                maxLines: 8,
                              ),
                              if (actionState.error != null &&
                                  actionState.error!.isNotEmpty) ...[
                                const SizedBox(height: 14),
                                Text(
                                  actionState.error!,
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
                          title: 'Review and send',
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Double-check the dates, payment amount, and contract terms before sending the lease for approval.',
                                style: TextStyle(
                                  color: AppTheme.mutedForeground,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 18),
                              LayoutBuilder(
                                builder: (context, constraints) {
                                  final stacked = constraints.maxWidth < 520;
                                  final cancelButton = OutlinedButton(
                                    onPressed: () =>
                                        Navigator.of(context).maybePop(),
                                    child: const Text('Cancel'),
                                  );
                                  final sendButton = FilledButton(
                                    onPressed:
                                        actionState.isLoading ? null : _submit,
                                    style: FilledButton.styleFrom(
                                      backgroundColor: AppTheme.primary,
                                      foregroundColor: Colors.white,
                                    ),
                                    child: actionState.isLoading
                                        ? const SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Colors.white,
                                            ),
                                          )
                                        : const Text('Send lease offer'),
                                  );

                                  if (stacked) {
                                    return Column(
                                      children: [
                                        SizedBox(
                                          width: double.infinity,
                                          child: cancelButton,
                                        ),
                                        const SizedBox(height: 12),
                                        SizedBox(
                                          width: double.infinity,
                                          child: sendButton,
                                        ),
                                      ],
                                    );
                                  }

                                  return Row(
                                    children: [
                                      cancelButton,
                                      const Spacer(),
                                      sendButton,
                                    ],
                                  );
                                },
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

  Future<void> _pickDate({required bool isStart}) async {
    final initialDate = isStart
        ? (_startDate ?? DateTime.now())
        : (_endDate ??
              _startDate?.add(const Duration(days: 30)) ??
              DateTime.now());
    final firstDate = isStart
        ? DateTime.now().subtract(const Duration(days: 365))
        : (_startDate ?? DateTime.now());
    final date = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: DateTime.now().add(const Duration(days: 3650)),
    );
    if (date == null) {
      return;
    }

    setState(() {
      if (isStart) {
        _startDate = date;
        if (_endDate == null || !_endDate!.isAfter(date)) {
          _endDate = date.add(const Duration(days: 30));
        }
      } else {
        _endDate = date;
      }
      _recalculatePrice();
    });
  }

  void _recalculatePrice() {
    final basePrice =
        _parseDouble(_recurringAmountController.text) ??
        widget.application.price;
    if (_isRecurring && _startDate != null && _endDate != null) {
      final days = _endDate!.difference(_startDate!).inDays;
      final periods = days <= 0 ? 1 : ((days / 30).ceil()).clamp(1, 120);
      _totalPriceController.text = (basePrice * periods).toStringAsFixed(0);
      if (_recurringAmountController.text.trim().isEmpty) {
        _recurringAmountController.text = basePrice.toStringAsFixed(0);
      }
      return;
    }

    if (!_isRecurring && _totalPriceController.text.trim().isEmpty) {
      _totalPriceController.text = widget.application.price.toStringAsFixed(0);
    }
  }

  double? _parseDouble(String value) {
    return double.tryParse(value.trim().replaceAll(',', ''));
  }

  Future<void> _submit() async {
    final totalPrice = _parseDouble(_totalPriceController.text);
    final recurringAmount = _isRecurring
        ? _parseDouble(_recurringAmountController.text)
        : null;

    if (_startDate == null || _endDate == null) {
      _showMessage('Select both a start date and an end date.');
      return;
    }
    if (!_endDate!.isAfter(_startDate!)) {
      _showMessage('The end date must be after the start date.');
      return;
    }
    if (totalPrice == null || totalPrice <= 0) {
      _showMessage('Enter a valid total contract price.');
      return;
    }
    if (_isRecurring && (recurringAmount == null || recurringAmount <= 0)) {
      _showMessage('Enter a valid recurring amount.');
      return;
    }
    if (widget.application.customerId.trim().isEmpty ||
        widget.application.managerId.trim().isEmpty) {
      _showMessage('This application is missing customer or owner details.');
      return;
    }
    if (_termsController.text.trim().isEmpty) {
      _showMessage('Add a few lease terms before sending the offer.');
      return;
    }

    try {
      await ref.read(leaseActionProvider.notifier).createLease(
            leaseType: _leaseType,
            startDate: _startDate!.toIso8601String(),
            endDate: _endDate!.toIso8601String(),
            totalPrice: totalPrice,
            recurringAmount: recurringAmount,
            terms: _termsController.text.trim(),
            propertyId: widget.application.propertyId,
            customerId: widget.application.customerId,
            ownerId: widget.application.managerId,
          );
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lease offer created successfully.')),
      );
      Navigator.of(context).pop(true);
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

class _SelectField<T> extends StatelessWidget {
  const _SelectField({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String label;
  final T value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: _labelStyle),
        const SizedBox(height: 8),
        DropdownButtonFormField<T>(
          value: value,
          decoration: _fieldDecoration(),
          items: items,
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _InputField extends StatelessWidget {
  const _InputField({
    required this.label,
    required this.controller,
    this.keyboardType,
    this.enabled = true,
    this.minLines = 1,
    this.maxLines = 1,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final bool enabled;
  final int minLines;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: _labelStyle),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          enabled: enabled,
          minLines: minLines,
          maxLines: maxLines,
          decoration: _fieldDecoration(),
        ),
      ],
    );
  }
}

class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final DateTime? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final text = value == null
        ? 'Select date'
        : '${value!.day}/${value!.month}/${value!.year}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: _labelStyle),
        const SizedBox(height: 8),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Ink(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.calendar_today_outlined,
                  size: 18,
                  color: AppTheme.primary,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    text,
                    style: const TextStyle(
                      color: AppTheme.foreground,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

const _labelStyle = TextStyle(
  color: AppTheme.foreground,
  fontSize: 13,
  fontWeight: FontWeight.w700,
);

InputDecoration _fieldDecoration() {
  return InputDecoration(
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: AppTheme.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: AppTheme.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: AppTheme.primary, width: 1.4),
    ),
  );
}
