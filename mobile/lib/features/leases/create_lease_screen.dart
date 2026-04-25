import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../applications/models/application_model.dart';
import '../applications/providers/application_provider.dart';
import '../auth/providers/auth_provider.dart';
import '../dashboard/screens/my_listings_screen.dart';
import 'models/lease_model.dart';
import '../listings/models/property_model.dart';
import 'providers/lease_provider.dart';

class CreateLeaseScreen extends ConsumerStatefulWidget {
  const CreateLeaseScreen({super.key, this.application});

  final PropertyApplication? application;

  @override
  ConsumerState<CreateLeaseScreen> createState() => _CreateLeaseScreenState();
}

class _CreateLeaseScreenState extends ConsumerState<CreateLeaseScreen> {
  late final TextEditingController _totalPriceController;
  late final TextEditingController _recurringAmountController;
  late final TextEditingController _termsController;

  String? _selectedPropertyId;
  String? _selectedCustomerId;
  DateTime? _startDate;
  DateTime? _endDate;
  String _paymentModel = 'Recurring';

  bool get _isRecurring => _paymentModel == 'Recurring';
  bool get _isLongTerm {
    if (_startDate == null || _endDate == null) {
      return false;
    }
    return _endDate!.difference(_startDate!).inDays > 365;
  }

  @override
  void initState() {
    super.initState();
    final initialPrice = widget.application?.price ?? 0;

    _totalPriceController = TextEditingController(
      text: initialPrice > 0 ? initialPrice.toStringAsFixed(0) : '',
    );
    _recurringAmountController = TextEditingController(
      text: initialPrice > 0 ? initialPrice.toStringAsFixed(0) : '',
    );
    _termsController = TextEditingController(
      text: 'The tenant agrees to maintain the property in good condition and pay on time. Both parties will provide notice before cancellation.',
    );

    if (widget.application != null) {
      _selectedPropertyId = widget.application!.propertyId;
      _selectedCustomerId = widget.application!.customerId;
    }

    final today = DateTime.now();
    _startDate = DateTime(today.year, today.month, today.day);
    _endDate = DateTime(today.year, today.month + 1, today.day);

    if (widget.application != null) {
      _recalculatePrice();
    }
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
    final applicationsAsync = ref.watch(managedApplicationsProvider);
    final propertiesAsync = ref.watch(myListingsProvider);
    final leases = ref.watch(leasesProvider).valueOrNull ?? const <LeaseModel>[];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: AppTheme.border)),
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 960),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                    child: Row(
                      children: [
                        IconButton(
                          onPressed: () => Navigator.of(context).maybePop(),
                          style: IconButton.styleFrom(
                            backgroundColor: AppTheme.primary.withValues(
                              alpha: 0.06,
                            ),
                            foregroundColor: AppTheme.primary,
                          ),
                          icon: const Icon(Icons.chevron_left_rounded),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Text(
                            'Create New Lease',
                            style: TextStyle(
                              color: AppTheme.foreground,
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        if (MediaQuery.sizeOf(context).width >= 600)
                          Row(
                            children: [
                              Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: AppTheme.primary.withValues(alpha: 0.10),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                                child: const Icon(
                                  Icons.description_outlined,
                                  color: AppTheme.primary,
                                  size: 18,
                                ),
                              ),
                              Transform.translate(
                                offset: const Offset(-8, 0),
                                child: Container(
                                  width: 34,
                                  height: 34,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDCFCE7),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                  ),
                                  child: const Icon(
                                    Icons.verified_user_outlined,
                                    color: Color(0xFF16A34A),
                                    size: 18,
                                  ),
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 40),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 960),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Lease Agreement Details',
                          style: TextStyle(
                            color: AppTheme.foreground,
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.6,
                          ),
                        ),
                        const SizedBox(height: 24),
                        _FormSection(
                          title: 'Agreement Parties',
                          icon: Icons.people_alt_outlined,
                          child: Column(
                            children: [
                              _buildPropertySelector(propertiesAsync, leases),
                              const SizedBox(height: 16),
                              _buildCustomerSelector(applicationsAsync),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 20),

                        _FormSection(
                          title: 'Lease Configuration',
                          icon: Icons.settings_outlined,
                          child: Column(
                            children: [
                              _SelectField<String>(
                                    label: 'Payment Model',
                                    value: _paymentModel,
                                    icon: Icons.payments_outlined,
                                    enabled:
                                        _startDate != null &&
                                        _endDate != null &&
                                        !_isLongTerm,
                                    hint: _startDate == null || _endDate == null
                                        ? 'Select dates first...'
                                        : 'Select frequency',
                                    items: const [
                                      DropdownMenuItem(
                                        value: 'OneTime',
                                        child: Text('One-Time Payment'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'Recurring',
                                        child: Text('Recurring (Monthly)'),
                                      ),
                                    ],
                                    onChanged: (val) {
                                      setState(() {
                                        _paymentModel = val ?? 'Recurring';
                                        _syncAmountsFromSelectedProperty(
                                          propertiesAsync.valueOrNull ??
                                              const <PropertyModel>[],
                                        );
                                        _recalculatePrice(
                                          resetForOneTime: true,
                                        );
                                      });
                                    },
                              ),
                              const SizedBox(height: 16),
                              LayoutBuilder(
                                builder: (context, constraints) {
                                  final compact = constraints.maxWidth < 680;
                                  final startField = _DateField(
                                    label: 'Start Date',
                                    value: _startDate,
                                    onTap: () => _pickDate(isStart: true),
                                  );
                                  final endField = _DateField(
                                    label: 'End Date',
                                    value: _endDate,
                                    onTap: () => _pickDate(isStart: false),
                                  );

                                  if (compact) {
                                    return Column(
                                      children: [
                                        startField,
                                        const SizedBox(height: 16),
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
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        _FormSection(
                          title: 'Financial Terms',
                          icon: Icons.account_balance_wallet_outlined,
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              final compact = constraints.maxWidth < 680;
                              final totalField = _InputField(
                                label: 'Total Contract Value',
                                controller: _totalPriceController,
                                prefix: 'ETB',
                                keyboardType: TextInputType.number,
                              );

                              if (compact) {
                                return Column(
                                  children: [
                                    totalField,
                                    if (_isRecurring) ...[
                                      const SizedBox(height: 16),
                                      _InputField(
                                        label: 'Monthly Amount',
                                        controller: _recurringAmountController,
                                        prefix: 'ETB',
                                        keyboardType: TextInputType.number,
                                      ),
                                    ],
                                  ],
                                );
                              }

                              return Wrap(
                                spacing: 14,
                                runSpacing: 16,
                                children: [
                                  SizedBox(
                                    width: (constraints.maxWidth - 14) / 2,
                                    child: totalField,
                                  ),
                                  if (_isRecurring)
                                    SizedBox(
                                      width: (constraints.maxWidth - 14) / 2,
                                      child: _InputField(
                                        label: 'Monthly Amount',
                                        controller: _recurringAmountController,
                                        prefix: 'ETB',
                                        keyboardType: TextInputType.number,
                                      ),
                                    ),
                                ],
                              );
                            },
                          ),
                        ),

                        const SizedBox(height: 20),

                        _FormSection(
                          title: 'Agreement Terms',
                          icon: Icons.description_outlined,
                          child: _InputField(
                            label: 'Terms and Conditions',
                            controller: _termsController,
                            minLines: 5,
                            maxLines: 10,
                          ),
                        ),

                        const SizedBox(height: 32),

                        LayoutBuilder(
                          builder: (context, constraints) {
                            final compact = constraints.maxWidth < 520;
                            final cancelButton = TextButton(
                              onPressed: () => Navigator.of(context).pop(),
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 16,
                                ),
                                foregroundColor: AppTheme.mutedForeground,
                              ),
                              child: const Text(
                                'Cancel',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                            );
                            final submitButton = FilledButton(
                              onPressed: actionState.isLoading ? null : _submit,
                              style: FilledButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 32,
                                  vertical: 16,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
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
                                  : const Text(
                                      'Create Lease',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            );

                            if (compact) {
                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  cancelButton,
                                  const SizedBox(height: 12),
                                  submitButton,
                                ],
                              );
                            }

                            return Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                cancelButton,
                                const SizedBox(width: 12),
                                submitButton,
                              ],
                            );
                          },
                        ),
                        
                        if (actionState.error != null) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.red.withOpacity(0.2)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline, color: Colors.red, size: 18),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    actionState.error!,
                                    style: const TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
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

  Widget _buildPropertySelector(
    AsyncValue<List<PropertyModel>> propertiesAsync,
    List<LeaseModel> leases,
  ) {
    return propertiesAsync.when(
      data: (properties) {
        final activeLeasePropertyIds = leases
            .where((lease) => lease.isActive)
            .map((lease) => lease.propertyId.trim())
            .where((id) => id.isNotEmpty)
            .toSet();
        final availableProperties = properties
            .where(
              (property) => property.listingTypes
                  .map((type) => type.toUpperCase())
                  .contains('RENT'),
            )
            .where((property) => !activeLeasePropertyIds.contains(property.id))
            .toList();

        // Keep price fields in sync when screen is opened with a preselected property
        // and listing data arrives after initState.
        _syncAmountsFromSelectedProperty(availableProperties);
        _recalculatePrice(resetForOneTime: true);

        return _SelectField<String>(
          label: 'Choose a Property',
          value: _selectedPropertyId,
          icon: Icons.home_work_outlined,
          hint: 'Select property for this lease',
          items: availableProperties
              .map(
                (PropertyModel property) => DropdownMenuItem<String>(
                  value: property.id,
                  child: Text(
                    '${property.title} - ETB ${property.price.toStringAsFixed(0)}',
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              )
              .toList(),
          onChanged: (val) {
            setState(() {
              _selectedPropertyId = val;
              if (val == null) {
                _totalPriceController.clear();
                _recurringAmountController.clear();
                return;
              }
              final property = availableProperties.firstWhere((p) => p.id == val);
              _recurringAmountController.text = property.price.toStringAsFixed(0);
              _totalPriceController.text = property.price.toStringAsFixed(0);
              _recalculatePrice(resetForOneTime: true);
            });
          },
        );
      },
      loading: () => const LinearProgressIndicator(),
      error: (err, _) => Text('Error loading properties: $err', style: const TextStyle(color: Colors.red)),
    );
  }

  Widget _buildCustomerSelector(
    AsyncValue<List<PropertyApplication>> applicationsAsync,
  ) {
    return applicationsAsync.when(
      data: (applications) {
        final acceptedApplications = applications
            .where((application) => application.isAccepted)
            .toList();
        final uniqueCustomers = <String, PropertyApplication>{};
        for (final application in acceptedApplications) {
          if (application.customerId.trim().isEmpty ||
              uniqueCustomers.containsKey(application.customerId)) {
            continue;
          }
          uniqueCustomers[application.customerId] = application;
        }

        return _SelectField<String>(
          label: 'Identify the Tenant',
          value: _selectedCustomerId,
          icon: Icons.person_outline,
          hint: 'Select tenant for this lease',
          items: uniqueCustomers.values
              .map(
                (application) => DropdownMenuItem<String>(
                  value: application.customerId,
                  child: Text(
                    [
                      if (application.customerName?.trim().isNotEmpty ?? false)
                        application.customerName!,
                      if (application.customerEmail?.trim().isNotEmpty ?? false)
                        '(${application.customerEmail!})',
                    ].join(' '),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              )
              .toList(),
          onChanged: (val) => setState(() => _selectedCustomerId = val),
        );
      },
      loading: () => const LinearProgressIndicator(),
      error: (err, _) => Text(
        'Error loading accepted applicants: $err',
        style: const TextStyle(color: Colors.red),
      ),
    );
  }

  Future<void> _pickDate({required bool isStart}) async {
    final date = await showDatePicker(
      context: context,
      initialDate: isStart
          ? (_startDate ?? DateTime.now())
          : (_endDate ?? DateTime.now().add(const Duration(days: 30))),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 3650)),
      builder: (context, child) {
        final base = Theme.of(context);
        return Theme(
          data: base.copyWith(
            scaffoldBackgroundColor: Colors.white,
            canvasColor: Colors.white,
            colorScheme: base.colorScheme.copyWith(
                  primary: AppTheme.primary,
                  onPrimary: Colors.white,
                  surface: Colors.white,
                  onSurface: AppTheme.foreground,
                ),
            dialogTheme: const DialogThemeData(
              backgroundColor: Colors.white,
              surfaceTintColor: Colors.white,
            ),
            datePickerTheme: DatePickerThemeData(
              backgroundColor: Colors.white,
              surfaceTintColor: Colors.white,
              headerBackgroundColor: AppTheme.primary,
              headerForegroundColor: Colors.white,
              dayForegroundColor: MaterialStateProperty.resolveWith((states) {
                if (states.contains(MaterialState.selected)) return Colors.white;
                return AppTheme.foreground;
              }),
              dayBackgroundColor: MaterialStateProperty.resolveWith((states) {
                if (states.contains(MaterialState.selected)) return AppTheme.primary;
                return Colors.transparent;
              }),
              todayForegroundColor: const MaterialStatePropertyAll(AppTheme.primary),
              todayBackgroundColor: const MaterialStatePropertyAll(Colors.white),
              yearForegroundColor: const MaterialStatePropertyAll(AppTheme.foreground),
              yearBackgroundColor: const MaterialStatePropertyAll(Colors.white),
            ),
          ),
          child: child!,
        );
      },
    );
    if (date != null) {
      setState(() {
        if (isStart) {
          _startDate = date;
          if (_endDate != null && _endDate!.isBefore(date)) {
            _endDate = date.add(const Duration(days: 30));
          }
        } else {
          _endDate = date;
        }
        _syncPaymentModelWithDates();
        _recalculatePrice(resetForOneTime: true);
      });
    }
  }

  void _syncPaymentModelWithDates() {
    if (_isLongTerm && _paymentModel != 'Recurring') {
      _paymentModel = 'Recurring';
    }
  }

  void _syncAmountsFromSelectedProperty(List<PropertyModel> properties) {
    if (_selectedPropertyId == null) {
      return;
    }
    PropertyModel? selectedProperty;
    for (final property in properties) {
      if (property.id == _selectedPropertyId) {
        selectedProperty = property;
        break;
      }
    }
    if (selectedProperty == null) {
      return;
    }

    final propertyPrice = selectedProperty.price.toStringAsFixed(0);
    if (_isRecurring) {
      if (_recurringAmountController.text.trim().isEmpty ||
          _recurringAmountController.text.trim() == '0') {
        _recurringAmountController.text = propertyPrice;
      }
    } else {
      _recurringAmountController.clear();
      _totalPriceController.text = propertyPrice;
    }
  }

  void _recalculatePrice({bool resetForOneTime = false}) {
    if (_startDate == null || _endDate == null) return;

    final priceStr = _recurringAmountController.text.trim();
    if (priceStr.isEmpty) return;

    final price = double.tryParse(priceStr) ?? 0;
    final diffInDays = _endDate!.difference(_startDate!).inDays;
    final totalMonths = (diffInDays / 30).floor().clamp(1, 120);

    if (_isRecurring) {
      _totalPriceController.text = (price * totalMonths).toStringAsFixed(0);
    } else if (resetForOneTime) {
      _totalPriceController.text = price.toStringAsFixed(0);
      _recurringAmountController.clear();
    }
  }

  Future<void> _submit() async {
    if (_selectedPropertyId == null || _selectedCustomerId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select property and tenant.')),
      );
      return;
    }
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select both start and end dates.')),
      );
      return;
    }
    if (_totalPriceController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the total contract value.')),
      );
      return;
    }

    final user = ref.read(authProvider).user;
    if (user == null) return;

    try {
      await ref.read(leaseActionProvider.notifier).createLease(
        leaseType: 'LongTerm',
        startDate: _startDate!.toIso8601String(),
        endDate: _endDate!.toIso8601String(),
        totalPrice: double.parse(_totalPriceController.text),
        recurringAmount: _isRecurring &&
                _recurringAmountController.text.trim().isNotEmpty
            ? double.parse(_recurringAmountController.text)
            : null,
        terms: _termsController.text.trim(),
        propertyId: _selectedPropertyId!,
        customerId: _selectedCustomerId!,
        ownerId: user.id,
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      // Error handled by provider
    }
  }
}

class _FormSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;

  const _FormSection({required this.title, required this.icon, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppTheme.primary),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: AppTheme.foreground,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          child,
        ],
      ),
      ),
    );
  }
}

class _SelectField<T> extends StatelessWidget {
  final String label;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;
  final IconData icon;
  final String? hint;
  final bool enabled;

  const _SelectField({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
    required this.icon,
    this.hint,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.mutedForeground)),
        const SizedBox(height: 6),
        DropdownButtonFormField<T>(
          value: value,
          items: items,
          onChanged: enabled ? onChanged : null,
          dropdownColor: Colors.white,
          borderRadius: BorderRadius.circular(14),
          style: const TextStyle(
            color: AppTheme.foreground,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
          hint: hint != null
              ? Text(
                  hint!,
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                )
              : null,
          decoration: InputDecoration(
            prefixIcon: Icon(
              icon,
              size: 18,
              color: AppTheme.primary.withValues(alpha: 0.7),
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            hintStyle: const TextStyle(color: AppTheme.foreground),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border)),
            disabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border)),
          ),
        ),
      ],
    );
  }
}

class _InputField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String? prefix;
  final bool enabled;
  final TextInputType keyboardType;
  final int minLines;
  final int maxLines;

  const _InputField({required this.label, required this.controller, this.prefix, this.enabled = true, this.keyboardType = TextInputType.text, this.minLines = 1, this.maxLines = 1});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.mutedForeground)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          enabled: enabled,
          keyboardType: keyboardType,
          minLines: minLines,
          maxLines: maxLines,
          style: const TextStyle(
            color: AppTheme.foreground,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
          decoration: InputDecoration(
            prefixText: prefix != null ? '$prefix ' : null,
            prefixStyle: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.foreground),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border)),
            disabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border)),
          ),
        ),
      ],
    );
  }
}

class _DateField extends StatelessWidget {
  final String label;
  final DateTime? value;
  final VoidCallback onTap;

  const _DateField({required this.label, required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final text = value == null
        ? 'Select Date'
        : '${value!.day}/${value!.month}/${value!.year}';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.mutedForeground)),
        const SizedBox(height: 6),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 16, color: AppTheme.primary),
                const SizedBox(width: 10),
                Text(
                  text,
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
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
