import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../prediction/models/prediction_model.dart';
import '../../prediction/repositories/ai_repository.dart';
import '../models/property_model.dart';
import '../repositories/listing_repository.dart';

enum AssetType { HOME, CAR }

extension AssetTypeLabel on AssetType {
  String get apiValue => this == AssetType.HOME ? 'Home' : 'Car';
}

class AddListingState {
  AddListingState({
    this.activeType = AssetType.HOME,
    this.isLoading = false,
    this.isPredicting = false,
    this.editingListingId,
    this.images = const [],
    this.existingImageUrls = const [],
    this.existingOwnershipDocumentUrl,
    this.existingIdentityPhotoUrl,
    this.ownershipDocument,
    this.identityPhoto,
    this.aiEstimate,
    this.fields = const {},
  });

  final AssetType activeType;
  final bool isLoading;
  final bool isPredicting;
  final String? editingListingId;
  final List<XFile> images;
  final List<String> existingImageUrls;
  final String? existingOwnershipDocumentUrl;
  final String? existingIdentityPhotoUrl;
  final XFile? ownershipDocument;
  final XFile? identityPhoto;
  final String? aiEstimate;
  final Map<String, dynamic> fields;

  bool get isEditing =>
      editingListingId != null && editingListingId!.isNotEmpty;

  AddListingState copyWith({
    AssetType? activeType,
    bool? isLoading,
    bool? isPredicting,
    String? editingListingId,
    List<XFile>? images,
    List<String>? existingImageUrls,
    String? existingOwnershipDocumentUrl,
    String? existingIdentityPhotoUrl,
    XFile? ownershipDocument,
    XFile? identityPhoto,
    String? aiEstimate,
    Map<String, dynamic>? fields,
  }) {
    return AddListingState(
      activeType: activeType ?? this.activeType,
      isLoading: isLoading ?? this.isLoading,
      isPredicting: isPredicting ?? this.isPredicting,
      editingListingId: editingListingId ?? this.editingListingId,
      images: images ?? this.images,
      existingImageUrls: existingImageUrls ?? this.existingImageUrls,
      existingOwnershipDocumentUrl:
          existingOwnershipDocumentUrl ?? this.existingOwnershipDocumentUrl,
      existingIdentityPhotoUrl:
          existingIdentityPhotoUrl ?? this.existingIdentityPhotoUrl,
      ownershipDocument: ownershipDocument ?? this.ownershipDocument,
      identityPhoto: identityPhoto ?? this.identityPhoto,
      aiEstimate: aiEstimate ?? this.aiEstimate,
      fields: fields ?? this.fields,
    );
  }
}

class AddListingNotifier extends StateNotifier<AddListingState> {
  AddListingNotifier(this._repo, this._aiRepo) : super(_buildInitialState());

  final ListingRepository _repo;
  final AiRepository _aiRepo;

  static AddListingState _buildInitialState({AssetType type = AssetType.HOME}) {
    return AddListingState(
      activeType: type,
      fields: {
        'listingType': 'buy',
        'category': 'apartment',
        'fuelType': 'Petrol',
        'transmission': 'Automatic',
        'amenities': <String>[],
      },
    );
  }

  void reset({AssetType type = AssetType.HOME}) {
    state = _buildInitialState(type: type);
  }

  void loadFromProperty(PropertyModel property) {
    final activeType = property.isCar ? AssetType.CAR : AssetType.HOME;
    final listingType = _normalizeListingType(
      property.listingTypes.isNotEmpty ? property.listingTypes.first : null,
    );

    state = AddListingState(
      activeType: activeType,
      editingListingId: property.id,
      existingImageUrls: property.images,
      existingOwnershipDocumentUrl: property.ownershipDocuments.isNotEmpty
          ? property.ownershipDocuments.first.url
          : null,
      existingIdentityPhotoUrl: property.owner?.verificationPhoto,
      aiEstimate: property.price.toStringAsFixed(0),
      fields: {
        'title': property.title,
        'description': property.description,
        'city': property.city ?? '',
        'subcity': property.subcity ?? '',
        'region': property.region ?? '',
        'village': property.village ?? '',
        'listingType': listingType,
        'category': property.propertyType ?? 'apartment',
        'bedrooms': property.bedrooms?.toString() ?? '',
        'bathrooms': property.bathrooms?.toString() ?? '',
        'area':
            property.area?.toStringAsFixed(
              property.area != null && property.area! % 1 == 0 ? 0 : 1,
            ) ??
            '',
        'brand': property.brand ?? '',
        'model': property.model ?? '',
        'year': property.year?.toString() ?? '',
        'mileage':
            property.mileage?.toStringAsFixed(
              property.mileage != null && property.mileage! % 1 == 0 ? 0 : 1,
            ) ??
            '',
        'fuelType': property.fuelType ?? 'Petrol',
        'transmission': property.transmission ?? 'Automatic',
        'price': property.price.toStringAsFixed(
          property.price % 1 == 0 ? 0 : 1,
        ),
        'amenities': List<String>.from(property.amenities),
      },
    );
  }

  void setType(AssetType type) {
    if (state.activeType == type) return;
    state = _buildInitialState(type: type);
  }

  void updateField(String key, dynamic value) {
    final newFields = Map<String, dynamic>.from(state.fields);
    newFields[key] = value;
    state = state.copyWith(fields: newFields);
  }

  Future<void> pickImages() async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage();
    if (picked.isEmpty) return;

    final totalExisting = state.existingImageUrls.length;
    final availableSlots = (5 - totalExisting - state.images.length)
        .clamp(0, 5)
        .toInt();
    if (availableSlots <= 0) {
      return;
    }

    final merged = [...state.images, ...picked.take(availableSlots)];
    state = state.copyWith(images: merged.take(5).toList());
  }

  void removeImage(int index) {
    final newImages = List<XFile>.from(state.images);
    newImages.removeAt(index);
    state = state.copyWith(images: newImages);
  }

  void removeExistingImage(String imageUrl) {
    final updatedImages = List<String>.from(state.existingImageUrls)
      ..remove(imageUrl);
    state = state.copyWith(existingImageUrls: updatedImages);
  }

  Future<void> pickDocument() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
    );

    final path = result?.files.single.path;
    if (path == null) return;
    state = state.copyWith(ownershipDocument: XFile(path));
  }

  Future<void> captureIdentity() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera);
    if (picked != null) {
      state = state.copyWith(identityPhoto: picked);
    }
  }

  Future<void> getAiEstimate() async {
    state = state.copyWith(isPredicting: true);
    try {
      final fields = state.fields;
      if (state.activeType == AssetType.CAR) {
        final request = CarPredictionRequest(
          brand: fields['brand'] ?? '',
          model: fields['model'] ?? '',
          year: int.tryParse(fields['year']?.toString() ?? '2020') ?? 2020,
          mileage: double.tryParse(fields['mileage']?.toString() ?? '0') ?? 0,
          fuelType: fields['fuelType'] ?? 'Petrol',
          transmission: fields['transmission'] ?? 'Automatic',
          listingType: (fields['listingType'] ?? 'buy')
              .toString()
              .toUpperCase(),
          city: fields['city'] ?? '',
          subcity: fields['subcity'] ?? '',
          region: fields['region'] ?? '',
          village: fields['village'] ?? '',
        );
        final response = await _aiRepo.predictCarPrice(request);
        state = state.copyWith(
          aiEstimate: response.predictedPrice?.toStringAsFixed(0),
          isPredicting: false,
        );
      } else {
        final request = HousePredictionRequest(
          city: fields['city'] ?? '',
          subcity: fields['subcity'] ?? '',
          region: fields['region'] ?? '',
          village: fields['village'] ?? '',
          listingType: (fields['listingType'] ?? 'buy')
              .toString()
              .toUpperCase(),
          propertyType: fields['category'] ?? 'apartment',
          area: double.tryParse(fields['area']?.toString() ?? '0') ?? 0,
          bedrooms: int.tryParse(fields['bedrooms']?.toString() ?? '0') ?? 0,
          bathrooms: int.tryParse(fields['bathrooms']?.toString() ?? '0') ?? 0,
        );
        final response = await _aiRepo.predictHousePrice(request);
        state = state.copyWith(
          aiEstimate: response.predictedPrice?.toStringAsFixed(0),
          isPredicting: false,
        );
      }
    } catch (_) {
      state = state.copyWith(isPredicting: false);
      rethrow;
    }
  }

  Future<PropertyModel> submit() async {
    state = state.copyWith(isLoading: true);
    try {
      final formDataMap = Map<String, dynamic>.from(state.fields);
      formDataMap['location'] = jsonEncode({
        'city': formDataMap['city'] ?? '',
        'subcity': formDataMap['subcity'] ?? '',
        'region': formDataMap['region'] ?? '',
        'village': formDataMap['village'] ?? '',
        'lat': 9.03,
        'lng': 38.74,
      });

      final amenities = formDataMap['amenities'];
      if (amenities is List<String>) {
        formDataMap['amenities'] = jsonEncode(amenities);
      }

      formDataMap['assetType'] = state.activeType.apiValue;
      if (state.isEditing) {
        formDataMap['keepImages'] = jsonEncode(state.existingImageUrls);
      }

      final formData = FormData.fromMap(formDataMap);

      for (final file in state.images) {
        formData.files.add(
          MapEntry(
            'images',
            await MultipartFile.fromFile(file.path, filename: file.name),
          ),
        );
      }

      if (state.ownershipDocument != null) {
        formData.files.add(
          MapEntry(
            'ownershipDocument',
            await MultipartFile.fromFile(
              state.ownershipDocument!.path,
              filename: state.ownershipDocument!.name,
            ),
          ),
        );
      }

      if (state.identityPhoto != null) {
        formData.files.add(
          MapEntry(
            'ownerPhoto',
            await MultipartFile.fromFile(
              state.identityPhoto!.path,
              filename: state.identityPhoto!.name,
            ),
          ),
        );
      }

      final result = state.isEditing
          ? await _repo.updateListing(state.editingListingId!, formData)
          : await _repo.createListing(formData);
      state = state.copyWith(isLoading: false);
      return result;
    } catch (_) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  String _normalizeListingType(String? value) {
    final normalized = value?.toUpperCase().trim() ?? '';
    if (normalized == 'RENT' || normalized == 'FOR_RENT') {
      return 'rent';
    }
    return 'buy';
  }
}

final addListingProvider =
    StateNotifierProvider<AddListingNotifier, AddListingState>((ref) {
      return AddListingNotifier(
        ref.watch(listingRepositoryProvider),
        ref.watch(aiRepositoryProvider),
      );
    });
