import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/widgets/glass_card.dart';
import '../auth/providers/auth_provider.dart';
import 'providers/assistant_provider.dart';

class AIInsightsScreen extends ConsumerWidget {
  const AIInsightsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final insightsAsync = ref.watch(aiInsightsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('AI Insights')),
      body: user == null
          ? const Center(child: Text('Sign in to view your AI insights.'))
          : RefreshIndicator(
              onRefresh: () async => ref.invalidate(aiInsightsProvider),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  GlassCard(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Why these recommendations?',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'This view explains the signals behind your personalized HomeCar matches.',
                            style: TextStyle(
                              color: Colors.white70,
                              height: 1.45,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  insightsAsync.when(
                    data: (data) {
                      if (data == null) {
                        return const GlassCard(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: Text(
                              'No AI insights are available yet.',
                              style: TextStyle(color: Colors.white54),
                            ),
                          ),
                        );
                      }
                      return _InsightBody(data: data);
                    },
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 48),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (error, _) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Text(
                        error.toString().replaceFirst('Exception: ', ''),
                        style: const TextStyle(color: Colors.redAccent),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _InsightBody extends StatelessWidget {
  const _InsightBody({required this.data});

  final dynamic data;

  @override
  Widget build(BuildContext context) {
    if (data is String) {
      return GlassCard(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Text(
            data as String,
            style: const TextStyle(color: Colors.white70, height: 1.5),
          ),
        ),
      );
    }

    if (data is Map) {
      final map = Map<String, dynamic>.from(data as Map);
      return Column(
        children: map.entries
            .map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _InsightSection(title: entry.key, value: entry.value),
              ),
            )
            .toList(),
      );
    }

    return GlassCard(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Text(
          const JsonEncoder.withIndent('  ').convert(data),
          style: const TextStyle(color: Colors.white70, height: 1.45),
        ),
      ),
    );
  }
}

class _InsightSection extends StatelessWidget {
  const _InsightSection({required this.title, required this.value});

  final String title;
  final dynamic value;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _formatTitle(title),
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            _buildValue(value),
          ],
        ),
      ),
    );
  }

  Widget _buildValue(dynamic value) {
    if (value is Map) {
      final map = Map<String, dynamic>.from(value);
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: map.entries
            .map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 3,
                      child: Text(
                        _formatTitle(entry.key),
                        style: const TextStyle(
                          color: Colors.white54,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 5,
                      child: Text(
                        _stringify(entry.value),
                        style: const TextStyle(
                          color: Colors.white70,
                          height: 1.45,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      );
    }

    if (value is List) {
      if (value.isEmpty) {
        return const Text(
          'No data yet.',
          style: TextStyle(color: Colors.white54),
        );
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: value
            .asMap()
            .entries
            .map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: Text(
                    entry.value is Map
                        ? const JsonEncoder.withIndent('  ').convert(
                            Map<String, dynamic>.from(entry.value as Map),
                          )
                        : _stringify(entry.value),
                    style: const TextStyle(color: Colors.white70, height: 1.45),
                  ),
                ),
              ),
            )
            .toList(),
      );
    }

    return Text(
      _stringify(value),
      style: const TextStyle(color: Colors.white70, height: 1.45),
    );
  }

  String _formatTitle(String value) {
    return value
        .split('_')
        .where((part) => part.isNotEmpty)
        .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
        .join(' ');
  }

  String _stringify(dynamic value) {
    if (value == null) return 'N/A';
    if (value is String) return value;
    if (value is num || value is bool) return value.toString();
    return const JsonEncoder.withIndent('  ').convert(value);
  }
}

