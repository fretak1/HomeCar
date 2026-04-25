import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_theme.dart';
import '../auth/models/user_model.dart';
import '../leases/models/lease_model.dart';
import '../listings/models/property_model.dart';
import 'providers/public_profile_provider.dart';

class PublicProfileScreen extends ConsumerWidget {
  const PublicProfileScreen({super.key, required this.userId});

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(publicUserProvider(userId));
    final leasesAsync = ref.watch(publicUserLeasesProvider(userId));
    final listingsAsync = ref.watch(publicUserListingsProvider(userId));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: userAsync.when(
          loading: () => const _ProfileLoadingState(),
          error: (error, _) => _ProfileErrorState(
            message: error.toString().replaceFirst('Exception: ', ''),
          ),
          data: (user) => _PublicProfileContent(
            user: user,
            leasesAsync: leasesAsync,
            listingsAsync: listingsAsync,
          ),
        ),
      ),
    );
  }
}

class _PublicProfileContent extends StatelessWidget {
  const _PublicProfileContent({
    required this.user,
    required this.leasesAsync,
    required this.listingsAsync,
  });

  final UserModel user;
  final AsyncValue<List<LeaseModel>> leasesAsync;
  final AsyncValue<List<PropertyModel>> listingsAsync;

  @override
  Widget build(BuildContext context) {
    final createdAt = user.createdAt;
    final memberSinceText = createdAt != null
        ? DateFormat('MMM dd, yyyy').format(createdAt)
        : 'Unknown';
    final aboutText =
        '${_roleLabel(user)} member since ${createdAt != null ? DateFormat('MMMM yyyy').format(createdAt) : 'recently'}.';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1200),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: () {
                    if (Navigator.of(context).canPop()) {
                      context.pop();
                    } else {
                      context.go('/home');
                    }
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.mutedForeground,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                  ),
                  icon: const Icon(Icons.arrow_back_rounded, size: 18),
                  label: const Text(
                    'Back',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _ProfileHeaderCard(user: user),
              const SizedBox(height: 24),
              LayoutBuilder(
                builder: (context, constraints) {
                  final isWide = constraints.maxWidth >= 980;
                  final leftColumn = Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _SectionCard(
                        title: 'About ${_roleLabel(user)}',
                        icon: Icons.person_outline_rounded,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '"${user.isAgent ? 'Trusted marketplace professional.' : aboutText}"',
                              style: const TextStyle(
                                color: AppTheme.mutedForeground,
                                fontSize: 14,
                                fontStyle: FontStyle.italic,
                                height: 1.6,
                              ),
                            ),
                            const SizedBox(height: 20),
                            Wrap(
                              spacing: 12,
                              runSpacing: 12,
                              children: [
                                _MiniStatCard(
                                  label: 'Status',
                                  value: user.verified
                                      ? 'Verified Member'
                                      : 'Active Member',
                                ),
                                _MiniStatCard(
                                  label: 'Role',
                                  value: _roleLabel(user),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      _ContactCard(
                        user: user,
                        memberSinceText: memberSinceText,
                      ),
                    ],
                  );
                  final rightColumn = Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _HistoryCard(
                        user: user,
                        leasesAsync: leasesAsync,
                        listingsAsync: listingsAsync,
                      ),
                    ],
                  );

                  if (!isWide) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        leftColumn,
                        const SizedBox(height: 20),
                        rightColumn,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(width: 340, child: leftColumn),
                      const SizedBox(width: 24),
                      Expanded(child: rightColumn),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileHeaderCard extends StatelessWidget {
  const _ProfileHeaderCard({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final initials = _initials(user.name);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 32,
            offset: Offset(0, 18),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Container(
            height: 176,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF005A41), Color(0xFF005A41), Color(0xFF0D9488)],
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  right: -30,
                  top: -18,
                  child: Container(
                    width: 150,
                    height: 150,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.07),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                Positioned(
                  left: -12,
                  bottom: -28,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Transform.translate(
            offset: const Offset(0, -64),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 0),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final compact = constraints.maxWidth < 720;
                  final avatar = Container(
                    width: compact ? 112 : 136,
                    height: compact ? 112 : 136,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: Colors.white, width: 6),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x220F172A),
                          blurRadius: 24,
                          offset: Offset(0, 10),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: user.profileImage != null &&
                            user.profileImage!.trim().isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: user.profileImage!,
                            fit: BoxFit.cover,
                          )
                        : Container(
                            color: AppTheme.primary.withValues(alpha: 0.10),
                            alignment: Alignment.center,
                            child: Text(
                              initials,
                              style: TextStyle(
                                color: AppTheme.primary,
                                fontSize: compact ? 34 : 44,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                  );

                  final details = Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.name,
                        style: TextStyle(
                          color: AppTheme.foreground,
                          fontSize: compact ? 28 : 36,
                          fontWeight: FontWeight.w900,
                          height: 1.05,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          _RoleChip(user: user),
                          _StatusChip(
                            label: user.verified ? 'Active' : 'Pending',
                            color: user.verified
                                ? const Color(0xFF059669)
                                : const Color(0xFFD97706),
                            icon: user.verified
                                ? Icons.check_circle_rounded
                                : Icons.pending_rounded,
                          ),
                        ],
                      ),
                    ],
                  );

                  if (compact) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Center(child: avatar),
                        const SizedBox(height: 20),
                        details,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      avatar,
                      const SizedBox(width: 26),
                      Expanded(child: details),
                    ],
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.icon,
    required this.child,
    this.headerTint,
  });

  final String title;
  final IconData icon;
  final Widget child;
  final Color? headerTint;

  @override
  Widget build(BuildContext context) {
    final tint = headerTint ?? AppTheme.primary;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D0F172A),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            decoration: BoxDecoration(
              color: tint.withValues(alpha: 0.05),
              border: Border(
                bottom: BorderSide(color: tint.withValues(alpha: 0.10)),
              ),
            ),
            child: Row(
              children: [
                Icon(icon, size: 20, color: tint),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: AppTheme.foreground,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: child,
          ),
        ],
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({
    required this.user,
    required this.memberSinceText,
  });

  final UserModel user;
  final String memberSinceText;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Contact Details',
      icon: Icons.call_outlined,
      headerTint: const Color(0xFF005A41),
      child: Column(
        children: [
          _ContactRow(
            icon: Icons.mail_outline_rounded,
            iconColor: const Color(0xFF2563EB),
            iconBackground: const Color(0xFFEFF6FF),
            label: 'Email Address',
            value: user.email,
          ),
          _ContactRow(
            icon: Icons.phone_outlined,
            iconColor: const Color(0xFF16A34A),
            iconBackground: const Color(0xFFF0FDF4),
            label: 'Phone Number',
            value: user.phoneNumber?.trim().isNotEmpty == true
                ? user.phoneNumber!
                : 'N/A',
          ),
          _ContactRow(
            icon: Icons.location_on_outlined,
            iconColor: const Color(0xFFEA580C),
            iconBackground: const Color(0xFFFFF7ED),
            label: 'Primary Location',
            value: 'Addis Ababa',
          ),
          _ContactRow(
            icon: Icons.calendar_month_outlined,
            iconColor: const Color(0xFF475569),
            iconBackground: const Color(0xFFF1F5F9),
            label: 'Member Since',
            value: memberSinceText,
            isLast: true,
          ),
        ],
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({
    required this.user,
    required this.leasesAsync,
    required this.listingsAsync,
  });

  final UserModel user;
  final AsyncValue<List<LeaseModel>> leasesAsync;
  final AsyncValue<List<PropertyModel>> listingsAsync;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'User Information & History',
      icon: Icons.verified_user_outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth < 560 ? 2 : 4;
              final items = [
                ('Gender', user.gender ?? 'Not specified'),
                ('Marriage Status', user.marriageStatus ?? 'Not specified'),
                ('Kids', user.kids?.toString() ?? 'Not specified'),
                (
                  'Employment',
                  user.employmentStatus?.trim().isNotEmpty == true
                      ? user.employmentStatus!
                      : 'Not specified',
                ),
              ];
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: items.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: columns,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: columns == 2 ? 1.6 : 2.2,
                ),
                itemBuilder: (context, index) => _InfoTile(
                  label: items[index].$1,
                  value: items[index].$2,
                ),
              );
            },
          ),
          const SizedBox(height: 28),
          const Divider(color: AppTheme.border),
          const SizedBox(height: 24),
          if (user.isCustomer || user.isOwner || user.isAgent) ...[
            _SectionHeading(
              icon: Icons.calendar_month_rounded,
              label: user.isAgent
                  ? 'Leases Initiated & Managed'
                  : 'Active & Past Leases',
            ),
            const SizedBox(height: 14),
            leasesAsync.when(
              data: (leases) => leases.isEmpty
                  ? const _DashedEmptyState(
                      message: 'No recorded lease history found.',
                    )
                  : Column(
                      children: leases
                          .map(
                            (lease) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _PublicLeaseCard(
                                lease: lease,
                                viewerId: user.id,
                              ),
                            ),
                          )
                          .toList(),
                    ),
              loading: () => const _PanelSkeleton(height: 92),
              error: (error, _) => _InlineError(
                message: error.toString().replaceFirst('Exception: ', ''),
              ),
            ),
            const SizedBox(height: 28),
            const Divider(color: AppTheme.border),
            const SizedBox(height: 24),
          ],
          if (user.isOwner || user.isAgent) ...[
            _SectionHeading(
              icon: Icons.home_work_outlined,
              label: user.isOwner ? 'Properties Owned' : 'Managed Listings',
            ),
            const SizedBox(height: 14),
            listingsAsync.when(
              data: (listings) => listings.isEmpty
                  ? const _DashedEmptyState(
                      message: 'No property records found publicly.',
                    )
                  : LayoutBuilder(
                      builder: (context, constraints) {
                        final columns = constraints.maxWidth < 760 ? 1 : 2;
                        return GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: listings.length > 4 ? 4 : listings.length,
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: columns,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: columns == 1 ? 1.05 : 0.90,
                          ),
                          itemBuilder: (context, index) => _PublicPropertyCard(
                            property: listings[index],
                          ),
                        );
                      },
                    ),
              loading: () => LayoutBuilder(
                builder: (context, constraints) {
                  final columns = constraints.maxWidth < 760 ? 1 : 2;
                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: columns,
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: columns,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: columns == 1 ? 1.05 : 0.90,
                    ),
                    itemBuilder: (_, __) => const _PanelSkeleton(height: 280),
                  );
                },
              ),
              error: (error, _) => _InlineError(
                message: error.toString().replaceFirst('Exception: ', ''),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PublicLeaseCard extends StatelessWidget {
  const _PublicLeaseCard({
    required this.lease,
    required this.viewerId,
  });

  final LeaseModel lease;
  final String viewerId;

  @override
  Widget build(BuildContext context) {
    final assetEmoji = lease.property?.assetType.toUpperCase() == 'CAR'
        ? 'CAR'
        : 'HOME';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            alignment: Alignment.center,
            child: Text(
              assetEmoji == 'CAR' ? 'CAR' : 'HOME',
              style: TextStyle(
                color: AppTheme.primary,
                fontSize: assetEmoji == 'CAR' ? 10 : 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.4,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lease.property?.title ?? 'Property Lease',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${DateFormat('MMM yyyy').format(lease.startDate)} - ${DateFormat('MMM yyyy').format(lease.endDate)}',
                  style: const TextStyle(
                    color: AppTheme.mutedForeground,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          _LeaseStatusBadge(status: lease.status),
        ],
      ),
    );
  }
}

class _PublicPropertyCard extends StatelessWidget {
  const _PublicPropertyCard({required this.property});

  final PropertyModel property;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/property-detail', extra: property),
      borderRadius: BorderRadius.circular(22),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppTheme.border),
          boxShadow: const [
            BoxShadow(
              color: Color(0x100F172A),
              blurRadius: 18,
              offset: Offset(0, 10),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (property.mainImage.isNotEmpty)
                    CachedNetworkImage(
                      imageUrl: property.mainImage,
                      fit: BoxFit.cover,
                    )
                  else
                    Container(
                      color: const Color(0xFFF3F4F6),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.image_outlined,
                        color: AppTheme.mutedForeground,
                        size: 32,
                      ),
                    ),
                  Positioned(
                    top: 14,
                    left: 14,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x1F0F172A),
                            blurRadius: 12,
                            offset: Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Text(
                        property.isHome ? 'HOME' : 'CAR',
                        style: const TextStyle(
                          color: AppTheme.foreground,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    property.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.foreground,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    property.locationLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.mutedForeground,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${property.price.toStringAsFixed(0)} ETB',
                          style: const TextStyle(
                            color: AppTheme.primary,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.arrow_outward_rounded,
                        color: AppTheme.mutedForeground,
                        size: 18,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RoleChip extends StatelessWidget {
  const _RoleChip({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _roleIcon(user),
            size: 14,
            color: AppTheme.primary,
          ),
          const SizedBox(width: 8),
          Text(
            _roleLabel(user).toUpperCase(),
            style: const TextStyle(
              color: AppTheme.foreground,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.color,
    required this.icon,
  });

  final String label;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniStatCard extends StatelessWidget {
  const _MiniStatCard({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 132,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.7,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: AppTheme.foreground,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppTheme.foreground,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  const _ContactRow({
    required this.icon,
    required this.iconColor,
    required this.iconBackground,
    required this.label,
    required this.value,
    this.isLast = false,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBackground;
  final String label;
  final String value;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(
                bottom: BorderSide(color: AppTheme.border),
              ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: iconBackground,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    color: AppTheme.mutedForeground,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  value,
                  style: const TextStyle(
                    color: AppTheme.foreground,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.primary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: AppTheme.primary,
              fontSize: 12,
              fontWeight: FontWeight.w900,
              letterSpacing: 1,
            ),
          ),
        ),
      ],
    );
  }
}

class _LeaseStatusBadge extends StatelessWidget {
  const _LeaseStatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.trim().toUpperCase();
    Color background;
    Color foreground;

    switch (normalized) {
      case 'ACTIVE':
        background = const Color(0xFFECFDF5);
        foreground = const Color(0xFF059669);
        break;
      case 'PENDING':
        background = const Color(0xFFFFFBEB);
        foreground = const Color(0xFFD97706);
        break;
      case 'CANCELLED':
      case 'TERMINATED':
        background = const Color(0xFFFEF2F2);
        foreground = const Color(0xFFDC2626);
        break;
      default:
        background = const Color(0xFFF8FAFC);
        foreground = const Color(0xFF475569);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: foreground.withValues(alpha: 0.14)),
      ),
      child: Text(
        normalized,
        style: TextStyle(
          color: foreground,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class _DashedEmptyState extends StatelessWidget {
  const _DashedEmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: AppTheme.mutedForeground,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _PanelSkeleton extends StatelessWidget {
  const _PanelSkeleton({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(20),
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Text(
        message,
        style: const TextStyle(
          color: Color(0xFFB91C1C),
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _ProfileLoadingState extends StatelessWidget {
  const _ProfileLoadingState();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF8FAFC),
      alignment: Alignment.center,
      child: const Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF005A41)),
            ),
          ),
          SizedBox(height: 18),
          Text(
            'Loading profile...',
            style: TextStyle(
              color: AppTheme.mutedForeground,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileErrorState extends StatelessWidget {
  const _ProfileErrorState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF8FAFC),
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Icon(
              Icons.error_outline_rounded,
              color: Color(0xFFEF4444),
              size: 44,
            ),
          ),
          const SizedBox(height: 18),
          const Text(
            'Profile Not Found',
            style: TextStyle(
              color: AppTheme.foreground,
              fontSize: 28,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            message.isEmpty
                ? "The user you're looking for doesn't exist."
                : message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 22),
          FilledButton(
            onPressed: () {
              if (Navigator.of(context).canPop()) {
                context.pop();
              } else {
                context.go('/home');
              }
            },
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF005A41),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: const Text(
              'Back to Dashboard',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}

String _initials(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .toList();
  if (parts.isEmpty) {
    return 'U';
  }
  return parts.take(2).map((part) => part[0].toUpperCase()).join();
}

String _roleLabel(UserModel user) {
  if (user.isAdmin) return 'Admin';
  if (user.isOwner) return 'Owner';
  if (user.isAgent) return 'Agent';
  return 'Customer';
}

IconData _roleIcon(UserModel user) {
  if (user.isAdmin) return Icons.shield_outlined;
  if (user.isOwner) return Icons.home_work_outlined;
  if (user.isAgent) return Icons.work_outline_rounded;
  return Icons.person_outline_rounded;
}
