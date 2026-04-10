import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/glass_card.dart';
import 'models/prediction_model.dart';
import 'providers/prediction_provider.dart';

class PredictionScreen extends ConsumerStatefulWidget {
  const PredictionScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  ConsumerState<PredictionScreen> createState() => _PredictionScreenState();
}

class _PredictionScreenState extends ConsumerState<PredictionScreen> {
  final _formKey = GlobalKey<FormState>();

  // Car Controllers
  final _brandCtrl = TextEditingController(text: 'Toyota');
  final _modelCtrl = TextEditingController(text: 'Camry');
  final _yearCtrl = TextEditingController(text: '2020');
  final _mileageCtrl = TextEditingController(text: '45000');
  String _fuelType = 'Petrol';
  String _transmission = 'Automatic';

  // House Controllers
  final _subcityCtrl = TextEditingController(text: 'Bole');
  final _bedsCtrl = TextEditingController(text: '3');
  final _bathsCtrl = TextEditingController(text: '2');
  final _areaCtrl = TextEditingController(text: '150');
  final _villageCtrl = TextEditingController(text: 'Gerji');

  @override
  void dispose() {
    _brandCtrl.dispose();
    _modelCtrl.dispose();
    _yearCtrl.dispose();
    _mileageCtrl.dispose();
    _subcityCtrl.dispose();
    _bedsCtrl.dispose();
    _bathsCtrl.dispose();
    _areaCtrl.dispose();
    _villageCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    final state = ref.read(predictionProvider);

    if (state.type == PredictionType.car) {
      ref
          .read(predictionProvider.notifier)
          .predictCar(
            CarPredictionRequest(
              brand: _brandCtrl.text,
              model: _modelCtrl.text,
              year: int.tryParse(_yearCtrl.text) ?? 2020,
              mileage: double.tryParse(_mileageCtrl.text) ?? 0,
              fuelType: _fuelType,
              transmission: _transmission,
              listingType: 'BUY',
              city: 'Addis Ababa',
              subcity: 'Bole',
              region: 'Addis Ababa',
              village: 'Central',
            ),
          );
    } else {
      ref
          .read(predictionProvider.notifier)
          .predictHouse(
            HousePredictionRequest(
              city: 'Addis Ababa',
              subcity: _subcityCtrl.text,
              region: 'Addis Ababa',
              village: _villageCtrl.text,
              listingType: 'BUY',
              propertyType: 'Apartment',
              area: double.tryParse(_areaCtrl.text) ?? 0,
              bedrooms: int.tryParse(_bedsCtrl.text) ?? 0,
              bathrooms: int.tryParse(_bathsCtrl.text) ?? 0,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(predictionProvider);

    final content = Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0F172A), Color(0xFF1E1B4B)],
          ),
        ),
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              if (!widget.embedded) _buildAppBar(),
              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildToggle(state),
                    const SizedBox(height: 24),
                    _buildForm(state),
                    const SizedBox(height: 32),
                    if (state.result != null) _buildResultCard(state.result!),
                    if (state.error != null) _buildErrorCard(state.error!),
                    const SizedBox(height: 100),
                  ]),
                ),
              ),
            ],
          ),
        ),
      );

    if (widget.embedded) return content;

    return Scaffold(backgroundColor: Colors.transparent, body: content);
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      floating: true,
      backgroundColor: Colors.transparent,
      elevation: 0,
      title: const Text(
        'AI Price Predictor',
        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24),
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(40),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Text(
            'Estimate market value for properties and cars using our real-time AI service.',
            style: TextStyle(
              color: Colors.white.withOpacity(0.5),
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildToggle(PredictionState state) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          _toggleBtn(
            'Car',
            Icons.directions_car_outlined,
            state.type == PredictionType.car,
            () {
              ref.read(predictionProvider.notifier).setType(PredictionType.car);
            },
          ),
          _toggleBtn(
            'Real Estate',
            Icons.home_work_outlined,
            state.type == PredictionType.house,
            () {
              ref
                  .read(predictionProvider.notifier)
                  .setType(PredictionType.house);
            },
          ),
        ],
      ),
    );
  }

  Widget _toggleBtn(
    String label,
    IconData icon,
    bool active,
    VoidCallback onTap,
  ) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: active ? AppTheme.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: AppTheme.primary.withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : [],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: active ? Colors.white : Colors.white24,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: active ? Colors.white : Colors.white24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildForm(PredictionState state) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          GlassCard(
            padding: const EdgeInsets.all(24),
            child: state.type == PredictionType.car
                ? _buildCarFields()
                : _buildHouseFields(),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: state.isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.secondary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: state.isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.auto_awesome, size: 20),
                        SizedBox(width: 10),
                        Text(
                          'Predict Price',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCarFields() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _field(
                _brandCtrl,
                'Brand',
                Icons.branding_watermark_outlined,
                'e.g. Toyota',
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _field(
                _modelCtrl,
                'Model',
                Icons.model_training,
                'e.g. Camry',
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _field(
                _yearCtrl,
                'Year',
                Icons.calendar_today,
                'e.g. 2020',
                number: true,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _field(
                _mileageCtrl,
                'Mileage (KM)',
                Icons.speed,
                'e.g. 45000',
                number: true,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _dropdown(
          'Fuel Type',
          Icons.local_gas_station,
          _fuelType,
          ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
          (v) => setState(() => _fuelType = v!),
        ),
        const SizedBox(height: 16),
        _dropdown(
          'Transmission',
          Icons.settings_input_component,
          _transmission,
          ['Automatic', 'Manual'],
          (v) => setState(() => _transmission = v!),
        ),
      ],
    );
  }

  Widget _buildHouseFields() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _field(
                _subcityCtrl,
                'Subcity',
                Icons.location_city_outlined,
                'e.g. Bole',
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _field(
                _villageCtrl,
                'Village',
                Icons.map_outlined,
                'e.g. Gerji',
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _field(
                _bedsCtrl,
                'Beds',
                Icons.bed,
                'e.g. 3',
                number: true,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _field(
                _bathsCtrl,
                'Baths',
                Icons.bathtub_outlined,
                'e.g. 2',
                number: true,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _field(
          _areaCtrl,
          'Area (SQM)',
          Icons.square_foot,
          'e.g. 150',
          number: true,
        ),
      ],
    );
  }

  Widget _field(
    TextEditingController ctrl,
    String label,
    IconData icon,
    String hint, {
    bool number = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: ctrl,
          keyboardType: number ? TextInputType.number : TextInputType.text,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white24),
            prefixIcon: Icon(icon, color: AppTheme.secondary, size: 20),
            filled: true,
            fillColor: Colors.white.withOpacity(0.05),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
          validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
        ),
      ],
    );
  }

  Widget _dropdown(
    String label,
    IconData icon,
    String value,
    List<String> items,
    Function(String?) onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              dropdownColor: const Color(0xFF1E1B4B),
              style: const TextStyle(color: Colors.white),
              icon: const Icon(
                Icons.keyboard_arrow_down,
                color: Colors.white24,
              ),
              items: items.map((String item) {
                return DropdownMenuItem(value: item, child: Text(item));
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildResultCard(PredictionResponse result) {
    return GlassCard(
      borderRadius: 24,
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Icon(Icons.auto_awesome, color: Colors.amberAccent, size: 40),
          const SizedBox(height: 16),
          const Text(
            'Estimated Market Value',
            style: TextStyle(color: Colors.white70, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            '${result.predictedPrice?.toStringAsFixed(0) ?? "---"} ${result.currency}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 20),
          if (result.confidence != null)
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Confidence'.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(
                        value: result.confidence,
                        backgroundColor: Colors.white10,
                        color: AppTheme.secondary,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 20),
                Text(
                  '${(result.confidence! * 100).toStringAsFixed(0)}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
          const SizedBox(height: 16),
          if (result.reasoning != null)
            Text(
              result.reasoning!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withOpacity(0.6),
                height: 1.5,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildErrorCard(String error) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Error getting prediction: $error',
              style: const TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
    );
  }
}
