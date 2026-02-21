"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { usePropertyStore } from '@/store/usePropertyStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Home,
    MapPin,
    Ruler,
    Bed,
    Bath,
    Car,
    Check,
    Tag,
    Calendar,
    Settings2,
    Zap,
    Shield,
    Wifi,
    Wind,
    ParkingCircle,
    Waves,

    ChefHat,
    Monitor,
    Flame,
    Key,
    Image as ImageIcon,
    Plus,
    X,
    FileText,
    UploadCloud,
    Camera,
    Navigation
} from 'lucide-react';
import { CameraCapture } from '@/components/CameraCapture';
import { MapPicker } from '@/components/MapPicker';
import { cn } from '@/components/ui/utils';

interface AddItemFormProps {
    onSuccess: (data: any) => void;
    onCancel: () => void;
    initialData?: any;
}

const PROPERTY_AMENITIES = [
    { id: 'wifi', label: ' WiFi', icon: Wifi },
    { id: 'parking', label: 'Private Parking', icon: ParkingCircle },
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
    { id: 'ac', label: 'Air Conditioning', icon: Wind },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
    { id: 'furnished', label: 'Furnished', icon: Check },
    { id: 'heating', label: 'Heating', icon: Flame },
];

const VEHICLE_AMENITIES = [
    { id: 'bluetooth', label: 'Bluetooth Audio', icon: Zap },
    { id: 'ac', label: 'Climate Control', icon: Wind },
    { id: 'camera', label: 'Backup Camera', icon: Monitor },
    { id: 'leather', label: 'Leather Seats', icon: Check },
    { id: 'gps', label: 'GPS Navigation', icon: MapPin },
    { id: 'sunroof', label: 'Panoramic Sunroof', icon: Waves },
    { id: 'keyless', label: 'Keyless Entry', icon: Key },
];

export function AddPropertyForm({ onSuccess, onCancel, initialData }: AddItemFormProps) {
    // Map backend assetType ('HOME'/'CAR') to form state ('Home'/'Car')
    const getInitialType = (): 'Home' | 'Car' => {
        const assetType = initialData?.assetType;
        if (assetType === 'HOME' || assetType === 'Home') return 'Home';
        if (assetType === 'CAR' || assetType === 'Car') return 'Car';
        // Fallback: detect by car-specific fields
        return initialData?.mileage !== undefined || initialData?.brand ? 'Car' : 'Home';
    };
    const [activeType, setActiveType] = useState<'Home' | 'Car'>(getInitialType);

    // Normalize amenities from backend to match the amenity id keys
    const normalizeAmenities = (raw: string[] | undefined): string[] => {
        if (!raw || raw.length === 0) return [];
        const allAmenities = [...PROPERTY_AMENITIES, ...VEHICLE_AMENITIES];
        return raw.map(item => {
            // If it's already a known id, keep it
            if (allAmenities.some(a => a.id === item)) return item;
            // Otherwise try to find by label (case-insensitive)
            const found = allAmenities.find(a =>
                a.label.trim().toLowerCase() === item.trim().toLowerCase()
            );
            return found ? found.id : item.toLowerCase().replace(/\s+/g, '_');
        });
    };
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
        () => normalizeAmenities(initialData?.amenities)
    );
    const [images, setImages] = useState<(string | null)[]>(() => {
        const initialImages = initialData?.images?.map((img: any) => typeof img === 'string' ? img : img.url) || [];
        return initialImages.length > 0 ? initialImages : [null, null, null, null];
    });
    // Show existing ownership document from backend
    const [ownershipDoc, setOwnershipDoc] = useState<string | null>(
        initialData?.ownershipDocument || null
    );
    const [ownershipFile, setOwnershipFile] = useState<File | null>(null);
    const [ownerPhoto, setOwnerPhoto] = useState<string | null>(initialData?.ownerPhoto || null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [imageFiles, setImageFiles] = useState<(File | null)[]>(() => {
        return new Array(Math.max(4, initialData?.images?.length || 0)).fill(null);
    });
    const { addProperty, updateProperty, isLoading: isSubmitting } = usePropertyStore();
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const docInputRef = useRef<HTMLInputElement>(null);
    const isEditMode = !!(initialData as any)?.id;

    const form = useForm({
        defaultValues: {
            title: initialData?.title || '',
            category: (initialData as any)?.propertyType || (initialData as any)?.category || 'apartment',
            price: initialData?.price?.toString() || '',
            // Location fields - handle nested location object from backend
            city: (initialData as any)?.location?.city || (initialData as any)?.city || '',
            subCity: (initialData as any)?.location?.subcity || (initialData as any)?.subCity || '',
            description: initialData?.description || '',
            // Property specific
            bedrooms: initialData?.bedrooms?.toString() || '',
            bathrooms: initialData?.bathrooms?.toString() || '',
            area: initialData?.area?.toString() || '',
            // Vehicle specific
            brand: initialData?.brand || '',
            model: initialData?.model || '',
            year: initialData?.year?.toString() || '',
            mileage: initialData?.mileage?.toString() || '',
            fuelType: initialData?.fuelType || '',
            transmission: initialData?.transmission || '',
            listingType: initialData?.listingType?.[0]?.toLowerCase()?.includes('rent') ? 'rent' : 'buy',
            // Location
            region: (initialData as any)?.location?.region || '',
            village: (initialData as any)?.location?.village || '',
            lat: (initialData as any)?.location?.lat || 9.032,
            lng: (initialData as any)?.location?.lng || 38.74,
        },
    });

    const watchedFields = useWatch({ control: form.control });

    // When initialData arrives asynchronously (after fetchPropertyById resolves),
    // sync all state that was initialized before data was available.
    useEffect(() => {
        if (!initialData) return;

        // Sync asset type tab
        const assetType = initialData.assetType;
        if (assetType === 'HOME' || assetType === 'Home') setActiveType('Home');
        else if (assetType === 'CAR' || assetType === 'Car') setActiveType('Car');

        // Sync amenities
        setSelectedAmenities(normalizeAmenities(initialData.amenities));

        // Sync images from backend
        const backendImages = initialData.images?.map((img: any) =>
            typeof img === 'string' ? img : img.url
        ) || [];
        if (backendImages.length > 0) {
            setImages(backendImages);
            setImageFiles(new Array(backendImages.length).fill(null));
        }

        // Sync ownership document
        if ((initialData as any).ownershipDocument) {
            setOwnershipDoc((initialData as any).ownershipDocument);
        }

        // Reset form values from initialData
        const loc = (initialData as any).location || {};
        form.reset({
            title: initialData.title || '',
            category: (initialData as any).propertyType || (initialData as any).category || 'apartment',
            price: initialData.price?.toString() || '',
            city: loc.city || '',
            subCity: loc.subcity || '',
            description: initialData.description || '',
            bedrooms: initialData.bedrooms?.toString() || '',
            bathrooms: initialData.bathrooms?.toString() || '',
            area: initialData.area?.toString() || '',
            brand: initialData.brand || '',
            model: initialData.model || '',
            year: initialData.year?.toString() || '',
            mileage: initialData.mileage?.toString() || '',
            fuelType: initialData.fuelType || '',
            transmission: initialData.transmission || '',
            listingType: initialData.listingType?.[0]?.toLowerCase()?.includes('rent') ? 'rent' : 'buy',
            region: loc.region || '',
            village: loc.village || '',
            lat: loc.lat ?? 9.032,
            lng: loc.lng ?? 38.74,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);



    const toggleAmenity = (id: string) => {
        setSelectedAmenities((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        );
    };

    const handleImageUpload = (index: number, files: FileList | null) => {
        if (!files) return;

        const newImages = [...images];
        const newFiles = [...imageFiles];
        const incomingFiles = Array.from(files);

        incomingFiles.forEach((file, i) => {
            const targetIndex = index + i;
            // If we have space or it's the target index, fill it
            // Otherwise, append to the end
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (targetIndex < newImages.length) {
                    newImages[targetIndex] = result;
                    newFiles[targetIndex] = file;
                } else {
                    newImages.push(result);
                    newFiles.push(file);
                }

                // Update state once all readers are done or for each one (re-renders are fine here)
                setImages([...newImages]);
                setImageFiles([...newFiles]);
            };
            reader.readAsDataURL(file);
        });
    };

    const triggerImageUpload = (index: number) => {
        fileInputRefs.current[index]?.click();
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages[index] = null;
        setImages(newImages);

        const newFiles = [...imageFiles];
        newFiles[index] = null;
        setImageFiles(newFiles);
    };

    const handleDocUpload = (file: File) => {
        setOwnershipFile(file);
        setOwnershipDoc(file.name); // Store name for UI feedback
    };

    const handleCameraCapture = (imageData: string) => {
        setOwnerPhoto(imageData);
    };

    const openCamera = () => {
        setIsCameraOpen(true);
    };

    const onSubmit = async (data: any) => {
        // For new listings, require at least 4 photos
        // For edits, only require new photos if no existing images
        const uploadedPhotosCount = imageFiles.filter(Boolean).length;
        const hasExistingImages = isEditMode && initialData?.images && initialData.images.length > 0;
        if (!hasExistingImages && uploadedPhotosCount < 4) {
            toast.error(`Please upload at least 4 photos. Currently: ${uploadedPhotosCount}`);
            return;
        }

        try {
            const formData = new FormData();

            // Append basic fields
            Object.keys(data).forEach(key => {
                if (key !== 'lat' && key !== 'lng') {
                    formData.append(key, data[key]);
                }
            });

            // Handle location separately as JSON string for easy parsing or individual fields
            formData.append('location', JSON.stringify({
                city: data.city,
                subcity: data.subCity,
                region: data.region,
                village: data.village,
                lat: data.lat,
                lng: data.lng
            }));

            // Append new images (if any were uploaded during edit)
            imageFiles.forEach(file => {
                if (file) {
                    formData.append('images', file);
                }
            });

            // Append Ownership Document
            if (ownershipFile) {
                formData.append('ownershipDocument', ownershipFile);
            }

            // Append Owner Photo if captured
            if (ownerPhoto && ownerPhoto.startsWith('data:')) {
                const response = await fetch(ownerPhoto);
                const blob = await response.blob();
                formData.append('ownerPhoto', blob, 'owner_photo.jpg');
            }

            formData.append('assetType', activeType);
            formData.append('amenities', JSON.stringify(selectedAmenities));

            if (isEditMode) {
                await updateProperty((initialData as any).id, formData);
                toast.success('Property updated successfully!');
            } else {
                await addProperty(formData);
                toast.success('Property listed successfully!');
            }
            onSuccess(data);
        } catch (error: any) {
            toast.error(error.message || (isEditMode ? 'Failed to update property' : 'Failed to list property'));
            console.error(error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Tabs defaultValue="Home" onValueChange={(v) => setActiveType(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/20 border border-border/50 rounded-xl">
                    <TabsTrigger value="Home" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Home className="h-4 w-4 mr-2" />
                        Property
                    </TabsTrigger>
                    <TabsTrigger value="Car" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Car className="h-4 w-4 mr-2" />
                        Vehicle
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* 1. Media Section - Mandatory for modern listings */}
                    <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2 text-primary">
                                <ImageIcon className="h-5 w-5" />
                                <h3 className="text-lg font-bold">Media Upload</h3>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                At least 4 Photos Required
                            </span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative group transition-all",
                                        img ? "border-solid border-primary/20 bg-muted/5" : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
                                    )}
                                >
                                    {img ? (
                                        <>
                                            <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full h-full">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                ref={el => { fileInputRefs.current[idx] = el; }}
                                                onChange={(e) => {
                                                    handleImageUpload(idx, e.target.files);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => triggerImageUpload(idx)}
                                                className="flex flex-col items-center space-y-2 w-full h-full justify-center"
                                            >
                                                <div className="p-2 bg-muted/10 rounded-full group-hover:bg-primary/10 transition-colors">
                                                    <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Add Photo</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Core Information Section */}
                    <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-2 mb-6 text-primary">
                            <Tag className="h-5 w-5" />
                            <h3 className="text-lg font-bold">Core Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="title"
                                rules={{ required: 'Title is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                    {activeType === 'Home' ? <Home className="h-full w-full" /> : <Car className="h-full w-full" />}
                                                </div>
                                                <Input className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white transition-all rounded-xl" placeholder={activeType === 'Home' ? "Modern Villa" : "Tesla Model S"} {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="city"
                                rules={{ required: 'City is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white transition-all rounded-xl" placeholder="Addis Ababa" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="subCity"
                                rules={{ required: 'Sub-city is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sub City</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white transition-all rounded-xl" placeholder="Bole" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="region"
                                rules={{ required: 'Region is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Region</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white transition-all rounded-xl" placeholder="Addis Ababa" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="village"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Village / Specific Area</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white transition-all rounded-xl" placeholder="Hayat / CMC" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="listingType"
                                rules={{ required: 'Listing type is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Listed For</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 bg-muted/5 border-border/60 rounded-xl">
                                                    <SelectValue placeholder="Select purpose" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="rent">Rent</SelectItem>
                                                <SelectItem value="buy">Sale / Buy</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {activeType === 'Home' && (
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Property Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 bg-muted/5 border-border/60 rounded-xl">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="compound">Compound</SelectItem>
                                                    <SelectItem value="apartment">Apartment</SelectItem>
                                                    <SelectItem value="condominium">Condominium</SelectItem>
                                                    <SelectItem value="villa">Villa</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {/* Map Picker Integration */}
                        <div className="mt-8 space-y-4">
                            <FormLabel className="flex items-center space-x-2 text-primary">
                                <Navigation className="h-4 w-4" />
                                <span className="font-bold">Pin Precise Location</span>
                            </FormLabel>
                            <MapPicker
                                onLocationSelect={(coords) => {
                                    form.setValue('lat', coords.lat);
                                    form.setValue('lng', coords.lng);
                                }}
                                initialLocation={{
                                    lat: parseFloat(watchedFields.lat as any) || 9.03,
                                    lng: parseFloat(watchedFields.lng as any) || 38.74
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-center italic">
                                Precisely pinning your location increases buyer/renter trust by 40%
                            </p>
                        </div>
                    </div>

                    {/* 3. Specifications Section */}
                    <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-2 mb-6 text-primary">
                            <Settings2 className="h-5 w-5" />
                            <h3 className="text-lg font-bold">Specifications</h3>
                        </div>

                        {activeType === 'Home' ? (
                            <div key="property-specs" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
                                <FormField
                                    control={form.control}
                                    name="bedrooms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bedrooms</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Bed className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input type="number" className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white rounded-xl" placeholder="3" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bathrooms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bathrooms</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Bath className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input type="number" className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white rounded-xl" placeholder="2" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="area"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Area (sqm)</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input type="number" className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white rounded-xl" placeholder="150" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        ) : (
                            <div key="vehicle-specs" className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                                <FormField
                                    control={form.control}
                                    name="brand"
                                    rules={{ required: 'Brand is required' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Brand</FormLabel>
                                            <FormControl>
                                                <Input className="h-11 bg-muted/5 border-border/60 focus:bg-white rounded-xl" placeholder="Toyota / Tesla" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="model"
                                    rules={{ required: 'Model is required' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Model</FormLabel>
                                            <FormControl>
                                                <Input className="h-11 bg-muted/5 border-border/60 focus:bg-white rounded-xl" placeholder="Camry / Model S" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="year"
                                    rules={{ required: 'Year is required' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Year</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input type="number" className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white rounded-xl" placeholder="2024" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fuelType"
                                    rules={{ required: 'Fuel Type is required' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fuel Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 bg-muted/5 border-border/60 rounded-xl">
                                                        <SelectValue placeholder="Select fuel" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="petrol">Petrol</SelectItem>
                                                    <SelectItem value="diesel">Diesel</SelectItem>
                                                    <SelectItem value="electric">Electric</SelectItem>
                                                    <SelectItem value="hybrid">Hybrid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    {/* 4. Amenities Multi-Select Section */}
                    <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-2 mb-6 text-primary">
                            <Zap className="h-5 w-5" />
                            <h3 className="text-lg font-bold">Amenities & Features</h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {(activeType === 'Home' ? PROPERTY_AMENITIES : VEHICLE_AMENITIES).map((amenity) => {
                                const isSelected = selectedAmenities.includes(amenity.id);
                                const Icon = amenity.icon;
                                return (
                                    <button
                                        key={amenity.id}
                                        type="button"
                                        onClick={() => toggleAmenity(amenity.id)} // Removed dummy field
                                        className={cn(
                                            "flex items-center space-x-2 p-3 rounded-xl border transition-all text-sm font-medium",
                                            isSelected
                                                ? "bg-primary/10 border-primary text-primary shadow-sm"
                                                : "bg-muted/5 border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-white"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                                        <span>{amenity.label}</span>
                                        {isSelected && <Check className="h-3 w-3 ml-auto" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 5. Description Section */}
                    <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm">
                        <FormLabel className="flex items-center space-x-2 mb-4">
                            <Settings2 className="h-4 w-4 text-primary" />
                            <span>Detailed Description</span>
                        </FormLabel>
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Share what makes this item special..."
                                            className="min-h-[150px] bg-muted/5 border-border/60 focus:bg-white rounded-xl p-4 text-base resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* 6. Ownership Verification Section */}
                    <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2 text-primary">
                                <Shield className="h-5 w-5" />
                                <h3 className="text-lg font-bold">Ownership Verification</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary">Required for Verification</Badge>
                        </div>

                        <div
                            className={cn(
                                "border-2 border-dashed rounded-2xl p-8 transition-all relative group",
                                ownershipDoc
                                    ? "border-green-500/30 bg-green-50/10"
                                    : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
                            )}
                        >
                            {ownershipDoc ? (
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 bg-green-100 rounded-xl flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground">
                                            {ownershipDoc.startsWith('http')
                                                ? ownershipDoc.split('/').pop()?.split('?')[0] || 'ownership_document'
                                                : ownershipDoc}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            {ownershipDoc.startsWith('http') ? 'Previously uploaded document' : 'Successfully uploaded for review'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {ownershipDoc.startsWith('http') && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(ownershipDoc, '_blank')}
                                                className="font-bold border-green-200 text-green-700 hover:bg-green-50 rounded-xl"
                                            >
                                                View
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setOwnershipDoc(null)}
                                            className="text-destructive hover:bg-destructive/10"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => docInputRef.current?.click()}
                                    className="w-full flex flex-col items-center justify-center space-y-4"
                                >
                                    <div className="h-14 w-14 bg-muted/10 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <UploadCloud className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-foreground">Upload Ownership Document</p>
                                        <p className="text-sm text-muted-foreground mt-1 text-center">
                                            Please upload legal document proving ownership.<br />
                                            (PDF, JPG, PNG up to 10MB)
                                        </p>
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={docInputRef}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleDocUpload(file);
                                            }}
                                        />
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 7. Owner Identification Photo (Selfie) */}
                    <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2 text-[#005a41]">
                                <Camera className="h-5 w-5" />
                                <h3 className="text-lg font-bold">Owner Identification Photo</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase border-[#005a41]/20 text-[#005a41]">Security Verification</Badge>
                        </div>

                        <div
                            className={cn(
                                "border-2 border-dashed rounded-2xl p-8 transition-all relative group overflow-hidden",
                                ownerPhoto
                                    ? "border-green-500/30 bg-green-50/10"
                                    : "border-border/60 hover:border-[#005a41]/40 hover:bg-[#005a41]/5"
                            )}
                        >
                            {ownerPhoto ? (
                                <div className="flex items-center justify-between gap-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-20 w-20 overflow-hidden rounded-xl border-2 border-green-500/20 shadow-sm">
                                            <img src={ownerPhoto} alt="Owner Identification" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">Identification Selfie</h4>
                                            <p className="text-xs text-muted-foreground">Captured successfully</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={openCamera}
                                            className="font-bold border-[#005a41]/20 text-[#005a41] hover:bg-[#005a41]/5 rounded-xl"
                                        >
                                            Retake
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setOwnerPhoto(null)}
                                            className="text-destructive hover:bg-destructive/10 rounded-xl"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openCamera}
                                    className="w-full flex flex-col items-center justify-center space-y-4 py-4"
                                >
                                    <div className="h-16 w-16 bg-[#005a41]/10 rounded-full flex items-center justify-center group-hover:bg-[#005a41]/20 transition-colors">
                                        <Camera className="h-8 w-8 text-[#005a41]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-foreground">Take Identification Photo</p>
                                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                            Please take a clear photo of yourself for our secure owner verification process.
                                        </p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 7. Pricing Section - AT THE VERY END for better User Experience & AI Guidance */}
                    <div className="bg-white rounded-2xl border border-primary/20 p-8 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                        <div className="relative z-10 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-foreground tracking-tight">Set Your Pricing</h3>
                                    <p className="text-sm text-muted-foreground">The final step to getting your listing live.</p>
                                </div>


                            </div>

                            <FormField
                                control={form.control}
                                name="price"
                                rules={{ required: 'Price is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative group max-w-md mx-auto md:mx-0">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    ETB
                                                </div>
                                                <Input
                                                    type="number"
                                                    className="pl-12 h-16 text-2xl font-black bg-primary/5 border-2 border-primary/20 focus:border-primary focus:bg-white transition-all rounded-3xl placeholder:text-muted-foreground/30 shadow-inner"
                                                    placeholder="00,000"
                                                    {...field}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                                                    <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                                                        {watchedFields.listingType === 'rent'
                                                            ? (activeType === 'Home' ? 'ETB / MO' : 'ETB / DAY')
                                                            : 'ETB'}
                                                    </span>
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-center md:text-left mt-2 font-medium">
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-6 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                            className="px-10 rounded-2xl hover:bg-destructive/10 hover:text-destructive font-bold text-base h-11"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition-all font-bold h-11 px-8"
                        >
                            {isSubmitting ? (
                                <Zap className="h-4 w-4 animate-pulse mr-2" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            {isSubmitting ? 'Processing...' : (initialData ? 'Update Listing' : 'Add Property')}
                        </Button>
                    </div>
                </form>
            </Form>

            <CameraCapture
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCameraCapture}
            />
        </div >
    );
}
