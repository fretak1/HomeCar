import 'package:flutter/material.dart';

String formatDashboardMoney(num value, {String currency = 'ETB'}) {
  final amount = value.toDouble();
  final whole = amount.truncate();
  final raw = whole.abs().toString();
  final buffer = StringBuffer();

  for (var index = 0; index < raw.length; index++) {
    final reverseIndex = raw.length - index;
    buffer.write(raw[index]);
    if (reverseIndex > 1 && reverseIndex % 3 == 1) {
      buffer.write(',');
    }
  }

  final formatted = amount < 0 ? '-${buffer.toString()}' : buffer.toString();
  return '$currency $formatted';
}

String formatDashboardDate(DateTime? value) {
  if (value == null) {
    return 'Unknown date';
  }

  final monthNames = const [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  final month = monthNames[value.month - 1];
  return '$month ${value.day}, ${value.year}';
}

String prettyDashboardLabel(String value) {
  final normalized = value.replaceAll('_', ' ').trim();
  if (normalized.isEmpty) {
    return 'Unknown';
  }

  return normalized
      .split(RegExp(r'\s+'))
      .map((part) {
        if (part.isEmpty) {
          return part;
        }
        return part[0].toUpperCase() + part.substring(1).toLowerCase();
      })
      .join(' ');
}

Color dashboardStatusColor(String status) {
  final normalized = status.trim().toUpperCase();

  switch (normalized) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'COMPLETED':
    case 'VERIFIED':
    case 'ACCEPTED':
    case 'SUCCESS':
      return const Color(0xFF059669);
    case 'PENDING':
    case 'INPROGRESS':
    case 'IN_PROGRESS':
    case 'PROCESSING':
    case 'CANCELLATION_PENDING':
      return const Color(0xFFD97706);
    case 'REJECTED':
    case 'FAILED':
    case 'CANCELLED':
    case 'DECLINED':
      return const Color(0xFFDC2626);
    default:
      return const Color(0xFF475569);
  }
}

