import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/ai/recommendations_screen.dart';
import '../../features/ai/ai_insights_screen.dart';
import '../../features/ai/assistant_screen.dart';
import '../../features/admin/admin_agent_review_screen.dart';
import '../../features/admin/admin_document_viewer_screen.dart';
import '../../features/admin/admin_dashboard_screen.dart';
import '../../features/admin/admin_property_review_screen.dart';
import '../../features/applications/models/application_model.dart';
import '../../features/applications/applications_screen.dart';
import '../../features/applications/managed_applications_screen.dart';
import '../../features/auth/forgot_password_screen.dart';
import '../../features/auth/models/user_model.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/reset_password_screen.dart';
import '../../features/auth/signup_screen.dart';
import '../../features/auth/verify_email_screen.dart';
import '../../features/chat/chat_list_screen.dart';
import '../../features/chat/chat_screen.dart';
import '../../features/dashboard/agent_dashboard_screen.dart';
import '../../features/dashboard/customer_dashboard_screen.dart';
import '../../features/dashboard/owner_dashboard_screen.dart';
import '../../features/dashboard/screens/my_listings_screen.dart';
import '../../features/documents/documents_screen.dart';
import '../../features/favorites/favorites_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/leases/create_lease_screen.dart';
import '../../features/leases/lease_contract_preview_screen.dart';
import '../../features/leases/lease_detail_screen.dart';
import '../../features/leases/models/lease_model.dart';
import '../../features/leases/leases_screen.dart';
import '../../features/listings/listing_list_screen.dart';
import '../../features/listings/models/property_model.dart';
import '../../features/listings/property_detail_screen.dart';
import '../../features/listings/screens/add_listing_screen.dart';
import '../../features/maintenance/maintenance_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/payments/screens/checkout_screen.dart';
import '../../features/payments/screens/payout_setup_screen.dart';
import '../../features/payments/screens/payment_success_screen.dart';
import '../../features/prediction/prediction_screen.dart';
import '../../features/profile/agent_verification_screen.dart';
import '../../features/profile/edit_profile_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/profile/public_profile_screen.dart';
import '../../features/transactions/receipt_preview_screen.dart';
import '../../features/transactions/models/transaction_model.dart';
import '../../features/transactions/transactions_screen.dart';
import '../../shared/widgets/app_shell.dart';

String? _dashboardPathForUser(UserModel? user) {
  if (user == null) {
    return null;
  }
  if (user.isAdmin) {
    return '/dashboard/admin';
  }
  if (user.isOwner) {
    return '/dashboard/owner';
  }
  if (user.isAgent) {
    return '/dashboard/agent';
  }
  return '/dashboard/customer';
}

final routerProvider = Provider<GoRouter>((ref) {
  // We use a Listenable to notify GoRouter when the auth state changes
  // without re-creating the entire GoRouter instance.
  final authNotifier = ref.watch(authProvider.notifier);
  
  // Create a simple Listenable that triggers whenever the auth state changes
  final listenable = _AuthListenable(ref);

  return GoRouter(
    initialLocation: '/home',
    refreshListenable: listenable,
    redirect: (context, state) {
      // Access the current state without watching (watching here would still cause re-creation)
      final authState = ref.read(authProvider);
      if (authState.isLoading) return null;

      final isAuthed = authState.isAuthenticated;
      final user = authState.user;
      final location = state.matchedLocation;
      
      debugPrint('[ROUTER] Checking redirect for: $location (Authed: $isAuthed)');

      const protectedPaths = [
        '/favorites',
        '/applications',
        '/profile',
        '/inbox',
        '/my-listings',
        '/manage-applications',
        '/add-listing',
        '/edit-listing',
        '/checkout',
        '/leases',
        '/maintenance',
        '/notifications',
        '/admin',
        '/documents',
        '/transactions',
        '/payout-setup',
        '/dashboard',
        '/ai-assistant',
        '/ai-insights',
        '/profile/edit',
        '/profile/view',
        '/agent-verification',
      ];

      if (protectedPaths.any((path) => location.startsWith(path)) &&
          !isAuthed) {
        return '/login';
      }

      const listingManagementPaths = [
        '/my-listings',
        '/add-listing',
        '/edit-listing',
        '/manage-applications',
        '/leases/create',
      ];
      final canManageListings = user?.isOwnerOrAgent ?? false;
      if (listingManagementPaths.any((path) => location.startsWith(path)) &&
          !canManageListings) {
        return '/home';
      }

      if (location.startsWith('/payout-setup') &&
          !(user?.isOwnerOrAgent ?? false)) {
        return '/home';
      }

      if (location.startsWith('/agent-verification') &&
          !(user?.isAgent ?? false)) {
        return '/home';
      }

      if (location == '/admin' && (user?.isAdmin ?? false)) {
        return '/dashboard/admin';
      }

      if (location == '/dashboard') {
        return _dashboardPathForUser(user) ?? '/login';
      }

      if (location == '/listings' || location == '/search') {
        return '/explore';
      }

      if (location.startsWith('/dashboard/')) {
        final target = _dashboardPathForUser(user);
        if (target == null) {
          return '/login';
        }
        final matchesDashboardRoot = location == target;
        final matchesDashboardChild = location.startsWith('$target/');
        if (!matchesDashboardRoot && !matchesDashboardChild) {
          return target;
        }
      }

      if (location.startsWith('/admin') && !(user?.isAdmin ?? false)) {
        return '/home';
      }

      // If user is authenticated but not verified, force them to the verify-email screen
      // (Unless they are trying to log out, are on the profile page, or are already on an auth-related path that isn't login/signup)
      if (isAuthed && !(user?.emailVerified ?? false)) {
        if (location != '/verify-email' && 
            !location.startsWith('/logout') && 
            location != '/profile') {
          debugPrint('[ROUTER] Force Redirect: User is NOT verified. Moving to /verify-email');
          return '/verify-email';
        }
        return null;
      }

      const authPaths = [
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
      ];
      
      if (authPaths.contains(location) && isAuthed) {
        debugPrint('[ROUTER] Redirecting to /home: User is already authenticated.');
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/listings',
        redirect: (context, state) => '/explore',
      ),
      GoRoute(
        path: '/properties',
        redirect: (context, state) => '/explore',
      ),
      GoRoute(
        path: '/search',
        redirect: (context, state) => '/explore',
      ),
      GoRoute(
        path: '/dashboard',
        redirect: (context, state) {
          final authState = ref.read(authProvider);
          return _dashboardPathForUser(authState.user) ?? '/login';
        },
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/verify-email',
        builder: (context, state) => const VerifyEmailScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => const ResetPasswordScreen(),
      ),
      GoRoute(
        path: '/my-listings',
        builder: (context, state) => const MyListingsScreen(),
      ),
      GoRoute(
        path: '/add-listing',
        builder: (context, state) => const AddListingScreen(),
      ),
      GoRoute(
        path: '/edit-listing',
        builder: (context, state) {
          final extra = state.extra;
          if (extra is! PropertyModel) {
            return const _RouteErrorScreen(
              title: 'Listing data missing',
              message: 'Open listing editing from your listings page.',
            );
          }
          return AddListingScreen(initialProperty: extra);
        },
      ),
      GoRoute(
        path: '/applications',
        builder: (context, state) => const ApplicationsScreen(),
      ),
      GoRoute(
        path: '/leases',
        builder: (context, state) => const LeasesScreen(),
      ),
      GoRoute(
        path: '/leases/:leaseId',
        builder: (context, state) {
          final leaseId = state.pathParameters['leaseId']!;
          return LeaseDetailScreen(leaseId: leaseId);
        },
      ),
      GoRoute(
        path: '/leases/:leaseId/contract',
        builder: (context, state) {
          final leaseId = state.pathParameters['leaseId']!;
          final extra = state.extra;
          return LeaseContractPreviewScreen(
            leaseId: leaseId,
            lease: extra is Map<String, dynamic>
                ? extra['lease'] as LeaseModel?
                : extra as LeaseModel?,
          );
        },
      ),
      GoRoute(
        path: '/maintenance',
        builder: (context, state) => const MaintenanceScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const SizedBox.shrink(),
      ),
      GoRoute(
        path: '/dashboard/customer',
        builder: (context, state) {
          final tab = state.uri.queryParameters['tab'];
          return CustomerDashboardScreen(initialTab: tab);
        },
      ),
      GoRoute(
        path: '/dashboard/owner/lease/create',
        builder: (context, state) {
          final extra = state.extra;
          PropertyApplication? application;
          if (extra is Map<String, dynamic>) {
            application = extra['application'] as PropertyApplication?;
          } else if (extra is PropertyApplication) {
            application = extra;
          }
          return CreateLeaseScreen(application: application);
        },
      ),
      GoRoute(
        path: '/dashboard/owner',
        builder: (context, state) {
          final tab = state.uri.queryParameters['tab'];
          return OwnerDashboardScreen(initialTab: tab);
        },
      ),
      GoRoute(
        path: '/dashboard/agent',
        builder: (context, state) => const AgentDashboardScreen(),
      ),
      GoRoute(
        path: '/dashboard/admin',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const SizedBox.shrink(),
      ),
      GoRoute(
        path: '/documents',
        builder: (context, state) => const DocumentsScreen(),
      ),
      GoRoute(
        path: '/admin/agents/:userId',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return AdminAgentReviewScreen(userId: userId);
        },
      ),
      GoRoute(
        path: '/admin/properties/:propertyId',
        builder: (context, state) {
          final propertyId = state.pathParameters['propertyId']!;
          return AdminPropertyReviewScreen(propertyId: propertyId);
        },
      ),
      GoRoute(
        path: '/admin/document',
        builder: (context, state) {
          final extra = state.extra;
          if (extra is! Map<String, dynamic> || extra['source'] is! String) {
            return const _RouteErrorScreen(
              title: 'Document unavailable',
              message: 'Open document review from an admin verification page.',
            );
          }

          return AdminDocumentViewerScreen(
            title: extra['title']?.toString() ?? 'Document',
            source: extra['source'] as String,
          );
        },
      ),
      GoRoute(
        path: '/transactions',
        builder: (context, state) => const TransactionsScreen(),
      ),
      GoRoute(
        path: '/payout-setup',
        builder: (context, state) => const PayoutSetupScreen(),
      ),
      GoRoute(
        path: '/ai-assistant',
        builder: (context, state) => const AssistantScreen(),
      ),
      GoRoute(
        path: '/ai-insights',
        builder: (context, state) => const AIInsightsScreen(),
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/profile/view/:userId',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return PublicProfileScreen(userId: userId);
        },
      ),
      GoRoute(
        path: '/profile/:userId',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return PublicProfileScreen(userId: userId);
        },
      ),
      GoRoute(
        path: '/agent-verification',
        builder: (context, state) => const AgentVerificationScreen(),
      ),
      GoRoute(
        path: '/transactions/receipt/:transactionId',
        builder: (context, state) {
          final transactionId = state.pathParameters['transactionId']!;
          return ReceiptPreviewScreen(
            transactionId: transactionId,
            transaction: state.extra is Map<String, dynamic>
                ? (state.extra as Map<String, dynamic>)['transaction']
                      as TransactionModel?
                : state.extra as TransactionModel?,
          );
        },
      ),
      GoRoute(
        path: '/manage-applications',
        builder: (context, state) => const ManagedApplicationsScreen(),
      ),
      GoRoute(
        path: '/leases/create',
        builder: (context, state) {
          final extra = state.extra;
          PropertyApplication? application;
          if (extra is Map<String, dynamic>) {
            application = extra['application'] as PropertyApplication?;
          } else if (extra is PropertyApplication) {
            application = extra;
          }
          return CreateLeaseScreen(application: application);
        },
      ),
      GoRoute(
        path: '/recommendations',
        builder: (context, state) => const RecommendationsScreen(),
      ),
      GoRoute(
        path: '/checkout',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return CheckoutScreen(
            amount: (extra['amount'] as num).toDouble(),
            title: extra['title'] as String,
            category: extra['category'] as String,
            propertyId: extra['propertyId'] as String?,
            leaseId: extra['leaseId'] as String?,
            payeeId: extra['payeeId'] as String?,
            payerId: extra['payerId'] as String?,
            subaccountId: extra['subaccountId'] as String?,
            email: extra['email'] as String?,
            meta: extra['meta'] is Map
                ? Map<String, dynamic>.from(extra['meta'] as Map)
                : null,
          );
        },
      ),
      GoRoute(
        path: '/checkout/success/:txRef',
        builder: (context, state) {
          final txRef = state.pathParameters['txRef']!;
          return PaymentSuccessScreen(txRef: txRef);
        },
      ),
      GoRoute(
        path: '/property/:propertyId',
        builder: (context, state) {
          final propertyId = state.pathParameters['propertyId']!;
          final extra = state.extra;
          
          if (extra is PropertyModel) {
            return PropertyDetailScreen(property: extra);
          }
          
          return Consumer(
            builder: (context, ref, child) {
              final propertyAsync = ref.watch(propertyDetailProvider(propertyId));
              return propertyAsync.when(
                data: (property) => PropertyDetailScreen(property: property),
                loading: () => const Scaffold(
                  body: Center(child: CircularProgressIndicator()),
                ),
                error: (error, _) => _RouteErrorScreen(
                  title: 'Property not found',
                  message: 'Could not load property details: $error',
                ),
              );
            },
          );
        },
      ),
      GoRoute(
        path: '/property-detail',
        builder: (context, state) {
          final property = state.extra as PropertyModel;
          return PropertyDetailScreen(property: property);
        },
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, state) => const HomeScreen(embedded: true),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/explore',
                builder: (context, state) =>
                    const ListingListScreen(embedded: true),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/ai',
                builder: (context, state) =>
                    const PredictionScreen(embedded: true),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/inbox',
                builder: (context, state) =>
                    const ChatListScreen(embedded: true),
                routes: [
                  GoRoute(
                    path: 'thread/:partnerId',
                    builder: (context, state) {
                      final extra = state.extra as Map<String, dynamic>?;
                      return ChatScreen(
                        partnerId: state.pathParameters['partnerId']!,
                        initialPartnerName: extra?['name'] as String?,
                        initialPartnerImage: extra?['image'] as String?,
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) =>
                    const ProfileScreen(embedded: true),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/favorites',
        builder: (context, state) => const FavoritesScreen(),
      ),
    ],
  );
});

class _RouteErrorScreen extends StatelessWidget {
  const _RouteErrorScreen({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(message, textAlign: TextAlign.center),
        ),
      ),
    );
  }
}

class _AuthListenable extends ChangeNotifier {
  _AuthListenable(Ref ref) {
    _subscription = ref.listen(authProvider, (_, __) {
      notifyListeners();
    });
  }

  late final ProviderSubscription _subscription;

  @override
  void dispose() {
    _subscription.close();
    super.dispose();
  }
}
