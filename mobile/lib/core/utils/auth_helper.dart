import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../features/auth/google_auth_webview.dart';

void openExternalAuth(BuildContext context, String url, String callbackPrefix) async {
  final uri = Uri.parse(url);
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

void openGoogleAuth(BuildContext context, String url, String callbackPrefix, Future<void> Function(bool?) onResult) async {
  final result = await Navigator.of(context).push<bool>(
    MaterialPageRoute(
      builder: (context) => GoogleAuthWebviewScreen(
        authUrl: url,
        callbackPrefix: callbackPrefix,
      ),
    ),
  );
  await onResult(result);
}
