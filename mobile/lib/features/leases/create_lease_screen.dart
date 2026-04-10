import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import '../applications/models/application_model.dart';
import 'providers/lease_provider.dart';

class CreateLeaseScreen extends ConsumerStatefulWidget {
  const CreateLeaseScreen({Key? key, required this.application})
    : super(key: key);

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
      appBar: AppBar(title: const Text('Create Lease Offer')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.application.propertyTitle,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.application.propertyLocation,
                    style: const TextStyle(color: Colors.white70),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _InfoChip(
                          label: 'Applicant',
                          value: widget.application.customerName ?? 'Customer',
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _InfoChip(
                          label: 'Reference Price',
                          value:
                              '${widget.application.price.toStringAsFixed(0)} ETB',
                        ),
                      ),
                    ],
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
                    'Lease Details',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _leaseType,
                    dropdownColor: const Color(0xFF1E293B),
                    decoration: _inputDecoration('Lease type'),
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
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<bool>(
                    value: _isRecurring,
                    dropdownColor: const Color(0xFF1E293B),
                    decoration: _inputDecoration('Payment model'),
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
                      if (value == null) return;
                      setState(() {
                        _isRecurring = value;
                        if (!_isRecurring) {
                          _recurringAmountController.clear();
                        } else if (_recurringAmountController.text
                            .trim()
                            .isEmpty) {
                          _recurringAmountController.text = widget
                              .application
                              .price
                              .toStringAsFixed(0);
                        }
                        _recalculatePrice();
                      });
                    },
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: _DateField(
                          label: 'Start date',
                          value: _startDate,
                          onTap: () => _pickDate(isStart: true),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _DateField(
                          label: 'End date',
                          value: _endDate,
                          onTap: () => _pickDate(isStart: false),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _totalPriceController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDecoration('Total contract price (ETB)'),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _recurringAmountController,
                    enabled: _isRecurring,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    style: TextStyle(
                      color: _isRecurring ? Colors.white : Colors.white38,
                    ),
                    decoration: _inputDecoration('Recurring amount (ETB)'),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _termsController,
                    minLines: 5,
                    maxLines: 7,
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDecoration('Terms and conditions'),
                  ),
                  if (actionState.error != null &&
                      actionState.error!.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Text(
                      actionState.error!,
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
                onPressed: actionState.isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.secondary,
                  foregroundColor: AppTheme.darkBackground,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: actionState.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text(
                        'Send Lease Offer',
                        style: TextStyle(fontWeight: FontWeight.bold),
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
    if (date == null) return;

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
      await ref
          .read(leaseActionProvider.notifier)
          .createLease(
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
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lease offer created successfully.')),
      );
      Navigator.of(context).pop(true);
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

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.white54, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
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
        ? label
        : '${value!.day}/${value!.month}/${value!.year}';
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.06),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.calendar_today_outlined,
              size: 18,
              color: Colors.white70,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(text, style: const TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
