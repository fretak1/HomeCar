"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Link from 'next/link';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useUserStore } from '@/store/useUserStore';
import { useAIStore } from '@/store/useAIStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
    Form,
    FormControl,
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
import { cn } from '@/lib/utils';
import { ethiopiaLocations } from '@/lib/ethiopiaLocations';

interface AddItemFormProps {
    onSuccess: (data: any) => void;
    onCancel: () => void;
    initialData?: any;
}

const PROPERTY_AMENITIES = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: ParkingCircle },
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
    { id: 'ac', label: 'Air Conditioning', icon: Wind },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
    { id: 'furnished', label: 'Furnished', icon: Check },
    { id: 'heating', label: 'Heating', icon: Flame },
];

const VEHICLE_AMENITIES = [
    { id: 'bluetooth', label: 'Bluetooth', icon: Zap },
    { id: 'ac', label: 'AC', icon: Wind },
    { id: 'camera', label: 'Camera', icon: Monitor },
    { id: 'leather', label: 'Leather Seats', icon: Check },
    { id: 'gps', label: 'GPS', icon: MapPin },
    { id: 'sunroof', label: 'Sunroof', icon: Waves },
    { id: 'keyless', label: 'Keyless Entry', icon: Key },
];

const CAR_BRANDS_AND_MODELS: Record<string, string[]> = {
    'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron'],
    'BMW': ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7'],
    'Chevrolet': ['Silverado', 'Equinox', 'Tahoe', 'Malibu', 'Cruze'],
    'Ford': ['F-150', 'Escape', 'Explorer', 'Focus', 'Mustang', 'Ranger'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Fit'],
    'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona', 'Creta'],
    'Kia': ['Rio', 'Cerato', 'Sportage', 'Sorento', 'Picanto'],
    'Lexus': ['IS', 'ES', 'RX', 'NX', 'LX'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'G-Class'],
    'Mitsubishi': ['Lancer', 'Pajero', 'Outlander', 'L200', 'Mirage'],
    'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Patrol', 'Leaf'],
    'Suzuki': ['Swift', 'Dzire', 'Vitara', 'Jimny', 'Ertiga'],
    'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'],
    'Toyota': ['Corolla', 'Camry', 'RAV4', 'Highlander', 'Land Cruiser', 'Hilux', 'Vitz', 'Yaris', 'Prius'],
    'Volkswagen': ['Golf', 'Jetta', 'Passat', 'Tiguan', 'ID.4', 'Amarok'],
    'Other': ['Other']
};

export function AddPropertyForm({ onSuccess, onCancel, initialData }: AddItemFormProps) {
    const getInitialType = (): 'Home' | 'Car' => {
        const assetType = initialData?.assetType;
        if (assetType === 'HOME' || assetType === 'Home') return 'Home';
        if (assetType === 'CAR' || assetType === 'Car') return 'Car';
        return initialData?.mileage !== undefined || initialData?.brand ? 'Car' : 'Home';
    };

    const { addProperty, updateProperty, isLoading: isSubmitting } = usePropertyStore();
    const { currentUser } = useUserStore();
    const { predictCarPrice, predictHousePrice, isPredicting } = useAIStore();

    const [activeType, setActiveType] = useState<'Home' | 'Car'>(getInitialType);

    const normalizeAmenities = (raw: string[] | undefined): string[] => {
        if (!raw || raw.length === 0) return [];
        const allAmenities = [...PROPERTY_AMENITIES, ...VEHICLE_AMENITIES];
        return raw.map((item: any) => {
            if (allAmenities.some((a: any) => a.id === item)) return item;
            const found = allAmenities.find((a: any) =>
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
        return initialImages.length >= 4 ? initialImages : [...initialImages, ...Array(Math.max(0, 4 - initialImages.length)).fill(null)];
    });
    
    const [ownershipDoc, setOwnershipDoc] = useState<string | null>(
        initialData?.ownershipDocuments?.[0]?.url || initialData?.ownershipDocument || null
    );
    const [ownershipFile, setOwnershipFile] = useState<File | null>(null);
    const [ownerPhoto, setOwnerPhoto] = useState<string | null>(() => {
        return initialData?.ownerPhoto || currentUser?.verificationPhoto || null;
    });

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [imageFiles, setImageFiles] = useState<(File | null)[]>(() => {
        return new Array(Math.max(4, initialData?.images?.length || 0)).fill(null);
    });
    const [aiReasoning, setAiReasoning] = useState<string | null>(null);
    const [similarListings, setSimilarListings] = useState<any[]>([]);
    
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const docInputRef = useRef<HTMLInputElement>(null);
    const isEditMode = !!(initialData as any)?.id;

    const form = useForm({
        defaultValues: {
            title: initialData?.title || '',
            category: (initialData as any)?.propertyType || (initialData as any)?.category || 'apartment',
            price: initialData?.price?.toString() || '',
            city: (initialData as any)?.location?.city || (initialData as any)?.city || '',
            subCity: (initialData as any)?.location?.subcity || (initialData as any)?.subCity || '',
            description: initialData?.description || '',
            bedrooms: initialData?.bedrooms?.toString() || '',
            bathrooms: initialData?.bathrooms?.toString() || '',
            area: initialData?.area?.toString() || '',
            brand: initialData?.brand || '',
            model: initialData?.model || '',
            year: initialData?.year?.toString() || '',
            mileage: initialData?.mileage?.toString() || '',
            fuelType: initialData?.fuelType || '',
            transmission: initialData?.transmission || '',
            listingType: initialData?.listingType?.[0]?.toLowerCase()?.includes('rent') ? 'rent' : 'buy',
            region: (initialData as any)?.location?.region || '',
            village: (initialData as any)?.location?.village || '',
            lat: (initialData as any)?.location?.lat || 9.032,
            lng: (initialData as any)?.location?.lng || 38.74,
            status: initialData?.status || 'AVAILABLE',
        },
    });

    const watchedFields = useWatch({ control: form.control });

    const availableRegions = Object.keys(ethiopiaLocations);
    const availableCities = watchedFields.region && ethiopiaLocations[watchedFields.region] 
        ? Object.keys(ethiopiaLocations[watchedFields.region]) 
        : [];
    const availableSubCities = watchedFields.region && watchedFields.city && ethiopiaLocations[watchedFields.region]?.[watchedFields.city] 
        ? Object.keys(ethiopiaLocations[watchedFields.region][watchedFields.city]) 
        : [];
    const availableVillages = watchedFields.region && watchedFields.city && watchedFields.subCity && ethiopiaLocations[watchedFields.region]?.[watchedFields.city]?.[watchedFields.subCity] 
        ? ethiopiaLocations[watchedFields.region][watchedFields.city][watchedFields.subCity] 
        : [];

    useEffect(() => {
        if (!isEditMode && !ownerPhoto && currentUser?.verificationPhoto) {
            setOwnerPhoto(currentUser.verificationPhoto);
        }
    }, [currentUser, isEditMode, ownerPhoto]);

    const isSmallUnit = activeType === 'Home' && ['studio', '3*3', '3*4', '4*4', '4*5', '5*5', '5*6', '6*6', '6*7'].includes(watchedFields.category || '');

    useEffect(() => {
        if (isSmallUnit) {
            form.setValue('bedrooms', '0');
            form.setValue('bathrooms', '0');
            form.setValue('area', '0');
        }
    }, [isSmallUnit, form.setValue]);

    const handleDocUpload = (file: File) => {
        setOwnershipFile(file);
        setOwnershipDoc(file.name);
    };

    const handleCameraCapture = (imageData: string) => {
        setOwnerPhoto(imageData);
    };

    const toggleAmenity = (id: string) => {
        setSelectedAmenities(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleImageUpload = (index: number, files: FileList | null) => {
        if (!files) return;
        const incomingFiles = Array.from(files);
        const newImages = [...images];
        const newFiles = [...imageFiles];

        incomingFiles.forEach((file, i) => {
            const targetIndex = index + i;
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
                setImages([...newImages]);
                setImageFiles([...newFiles]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        const newFiles = [...imageFiles];
        if (newImages.length > 4) {
            newImages.splice(index, 1);
            newFiles.splice(index, 1);
        } else {
            newImages[index] = null;
            newFiles[index] = null;
        }
        setImages(newImages);
        setImageFiles(newFiles);
    };

    const onSubmit = async (data: any) => {
        const uploadedPhotosCount = imageFiles.filter(Boolean).length;
        const hasExistingImages = isEditMode && initialData?.images && initialData.images.length > 0;
        if (!hasExistingImages && uploadedPhotosCount < 4) {
            toast.error(`Please upload at least 4 photos. Currently: ${uploadedPhotosCount}`);
            return;
        }

        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (!['lat', 'lng', 'amenities', 'location'].includes(key)) {
                    formData.append(key, data[key]);
                }
            });

            if (isEditMode) {
                const keepImages = images.filter(img => img && img.startsWith('http'));
                formData.append('keepImages', JSON.stringify(keepImages));
            }

            formData.append('location', JSON.stringify({
                city: data.city,
                subcity: data.subCity,
                region: data.region,
                village: data.village,
                lat: data.lat,
                lng: data.lng
            }));

            imageFiles.forEach(file => { if (file) formData.append('images', file); });
            if (ownershipFile) formData.append('ownershipDocument', ownershipFile);
            if (ownerPhoto && ownerPhoto.startsWith('data:')) {
                const response = await fetch(ownerPhoto);
                const blob = await response.blob();
                formData.append('ownerPhoto', blob, 'owner_photo.jpg');
            }

            formData.append('assetType', activeType);
            formData.append('amenities', JSON.stringify(selectedAmenities));

            if (isEditMode) {
                await updateProperty((initialData as any).id, formData);
                toast.success("Property updated successfully!");
            } else {
                await addProperty(formData);
                toast.success("Property added successfully!");
            }
            onSuccess(data);
        } catch (error: any) {
            toast.error(error.message || 'Submission failed');
        }
    };

    const handleAIEstimate = async () => {
        const values = form.getValues();
        try {
            if (activeType === 'Car') {
                const result = await predictCarPrice({
                    brand: values.brand,
                    model: values.model,
                    year: parseInt(values.year),
                    mileage: parseFloat(values.mileage),
                    fuelType: values.fuelType,
                    transmission: values.transmission,
                    listingType: values.listingType === 'rent' ? 'RENT' : 'BUY',
                    city: values.city,
                    subcity: values.subCity,
                    region: values.region,
                    village: values.village
                } as any);
                if (result && (result as any).predicted_price) {
                    form.setValue('price', (result as any).predicted_price.toString());
                    setAiReasoning((result as any).reasoning || null);
                    setSimilarListings((result as any).similar_listings || []);
                    toast.success("AI price estimate generated!");
                }
            } else {
                const result = await predictHousePrice({
                    city: values.city,
                    subcity: values.subCity,
                    region: values.region,
                    village: values.village,
                    listingType: values.listingType === 'rent' ? 'RENT' : 'BUY',
                    propertyType: values.category,
                    area: parseFloat(values.area),
                    bedrooms: parseInt(values.bedrooms),
                    bathrooms: parseInt(values.bathrooms || '1')
                } as any);
                if (result && (result as any).predicted_price) {
                    form.setValue('price', (result as any).predicted_price.toString());
                    setAiReasoning((result as any).reasoning || null);
                    setSimilarListings((result as any).similar_listings || []);
                    toast.success("AI price estimate generated!");
                }
            }
        } catch (e) {
            toast.error("AI estimation failed");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-20">
            <Tabs value={activeType} onValueChange={(v) => setActiveType(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/20 border border-border/50 rounded-xl max-w-md mx-auto">
                    <TabsTrigger value="Home" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Home className="h-4 w-4 mr-2" />
                        Home
                    </TabsTrigger>
                    <TabsTrigger value="Car" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Car className="h-4 w-4 mr-2" />
                        Car
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                    
                    {/* 1. Media Section */}
                    <section className="bg-white rounded-3xl border border-border/40 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2 text-primary">
                                    <ImageIcon className="h-6 w-6" />
                                    <h3 className="text-xl font-black tracking-tight">Property Photos</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">Upload at least 4 high-quality photos to attract more buyers.</p>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-none font-bold px-4 py-1.5 rounded-full self-start">
                                {images.filter(Boolean).length} / 8 Photos
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {images.map((img, idx) => (
                                <div key={idx} className={cn(
                                    "aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative group overflow-hidden transition-all",
                                    img ? "border-solid border-primary/20 bg-muted/5" : "border-border/40 hover:border-primary/40 hover:bg-primary/5"
                                )}>
                                    {img ? (
                                        <>
                                            <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => removeImage(idx)} className="bg-white/90 text-destructive p-2 rounded-full shadow-lg hover:bg-white active:scale-90 transition-all">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full">
                                            <input type="file" accept="image/*" multiple className="hidden" ref={el => { fileInputRefs.current[idx] = el; }} onChange={(e) => handleImageUpload(idx, e.target.files)} />
                                            <button type="button" onClick={() => fileInputRefs.current[idx]?.click()} className="flex flex-col items-center space-y-2 w-full h-full justify-center">
                                                <div className="p-3 bg-muted/20 rounded-full group-hover:bg-primary/10 transition-colors">
                                                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Add Photo</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. Core Information Section */}
                    <section className="bg-white rounded-3xl border border-border/40 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center space-x-2 mb-8 text-primary">
                            <Tag className="h-6 w-6" />
                            <h3 className="text-xl font-black tracking-tight">Core Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FormField control={form.control} name="title" rules={{ required: 'Title is required' }} render={({ field }) => (
                                <FormItem className="md:col-span-2 lg:col-span-3">
                                    <FormLabel>Catchy Title</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                {activeType === 'Home' ? <Home className="h-full w-full" /> : <Car className="h-full w-full" />}
                                            </div>
                                            <Input className="pl-12 h-14 text-lg font-medium bg-muted/5 border-border/50 focus:bg-white transition-all rounded-2xl" placeholder="e.g. Luxury 3 Bedroom Villa in Bole" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="region" rules={{ required: 'Region is required' }} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Region</FormLabel>
                                    <Select onValueChange={(val) => { field.onChange(val); form.setValue('city', ''); form.setValue('subCity', ''); form.setValue('village', ''); }} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 bg-muted/5 border-border/50 rounded-2xl">
                                                <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-muted-foreground" /><SelectValue placeholder="Select region" /></div>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl max-h-[300px]">
                                            {availableRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="city" rules={{ required: 'City is required' }} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <Select onValueChange={(val) => { field.onChange(val); form.setValue('subCity', ''); form.setValue('village', ''); }} value={field.value || undefined} disabled={availableCities.length === 0}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 bg-muted/5 border-border/50 rounded-2xl">
                                                <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-muted-foreground" /><SelectValue placeholder="Select city" /></div>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl max-h-[300px]">
                                            {availableCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="subCity" rules={{ required: 'Sub-city is required' }} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sub City</FormLabel>
                                    <Select onValueChange={(val) => { field.onChange(val); form.setValue('village', ''); }} value={field.value || undefined} disabled={availableSubCities.length === 0}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 bg-muted/5 border-border/50 rounded-2xl">
                                                <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-muted-foreground" /><SelectValue placeholder="Select sub-city" /></div>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl max-h-[300px]">
                                            {availableSubCities.map(sc => <SelectItem key={sc} value={sc}>{sc}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="village" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Village / Kebele</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={availableVillages.length === 0}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 bg-muted/5 border-border/50 rounded-2xl">
                                                <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-muted-foreground" /><SelectValue placeholder="Select village" /></div>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl max-h-[300px]">
                                            {availableVillages.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="listingType" rules={{ required: 'Listing type is required' }} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Listed For</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 bg-muted/5 border-border/50 rounded-2xl">
                                                <SelectValue placeholder="Select purpose" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="rent">Rent</SelectItem>
                                            <SelectItem value="buy">Sale / Buy</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            {activeType === 'Home' && (
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Property Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 bg-muted/5 border-border/50 rounded-2xl">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl">
                                                <SelectItem value="compound">Compound</SelectItem>
                                                <SelectItem value="apartment">Apartment</SelectItem>
                                                <SelectItem value="condominium">Condominium</SelectItem>
                                                <SelectItem value="villa">Villa</SelectItem>
                                                <SelectItem value="studio">Studio</SelectItem>
                                                <SelectItem value="building">Building</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            )}
                        </div>

                        {activeType === 'Home' && (
                            <div className="mt-10 space-y-4">
                                <FormLabel className="flex items-center space-x-2 text-primary font-black uppercase tracking-widest text-xs">
                                    <Navigation className="h-4 w-4" />
                                    <span>Pin Precise Location</span>
                                </FormLabel>
                                <div className="rounded-3xl overflow-hidden border border-border/40 h-[300px] md:h-[400px]">
                                    <MapPicker onLocationSelect={(coords) => { form.setValue('lat', coords.lat); form.setValue('lng', coords.lng); }} initialLocation={{ lat: parseFloat(watchedFields.lat as any) || 9.03, lng: parseFloat(watchedFields.lng as any) || 38.74 }} />
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 3. Specifications Section */}
                    <section className="bg-white rounded-3xl border border-border/40 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center space-x-2 mb-8 text-primary">
                            <Settings2 className="h-6 w-6" />
                            <h3 className="text-xl font-black tracking-tight">Specifications</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {activeType === 'Home' ? (
                                <>
                                    <FormField control={form.control} name="bedrooms" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bedrooms</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Bed className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input type="number" className={cn("pl-12 h-14 bg-muted/5 border-border/50 rounded-2xl", isSmallUnit && "bg-muted/30")} placeholder="3" disabled={isSmallUnit} {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="bathrooms" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bathrooms</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Bath className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input type="number" className={cn("pl-12 h-14 bg-muted/5 border-border/50 rounded-2xl", isSmallUnit && "bg-muted/30")} placeholder="2" disabled={isSmallUnit} {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="area" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Area (sqm)</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input type="number" className={cn("pl-12 h-14 bg-muted/5 border-border/50 rounded-2xl", isSmallUnit && "bg-muted/30")} placeholder="120" disabled={isSmallUnit} {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </>
                            ) : (
                                <>
                                    <FormField control={form.control} name="brand" rules={{ required: 'Brand is required' }} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Brand</FormLabel>
                                            <Select onValueChange={(val) => { field.onChange(val); form.setValue('model', ''); }} value={field.value || undefined}>
                                                <FormControl><SelectTrigger className="h-14 bg-muted/5 border-border/50 rounded-2xl"><SelectValue placeholder="Select Brand" /></SelectTrigger></FormControl>
                                                <SelectContent className="rounded-2xl max-h-[300px]">
                                                    {Object.keys(CAR_BRANDS_AND_MODELS).sort().map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="model" rules={{ required: 'Model is required' }} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Model</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined} disabled={!watchedFields.brand}>
                                                <FormControl><SelectTrigger className="h-14 bg-muted/5 border-border/50 rounded-2xl"><SelectValue placeholder="Select Model" /></SelectTrigger></FormControl>
                                                <SelectContent className="rounded-2xl max-h-[300px]">
                                                    {(watchedFields.brand ? CAR_BRANDS_AND_MODELS[watchedFields.brand] : []).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium leading-none">Year</label>
                                        <input
                                            {...form.register('year', { required: 'Year is required' })}
                                            className="flex h-14 w-full rounded-2xl border border-border/50 bg-muted/5 px-3 py-1 text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
                                            placeholder="e.g. 2024"
                                            autoComplete="off"
                                        />
                                    </div>

                                    <FormField control={form.control} name="mileage" rules={{ required: 'Mileage is required' }} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mileage (km)</FormLabel>
                                            <FormControl>
                                                <Input className="h-14 bg-muted/5 border-border/50 rounded-2xl" placeholder="e.g. 50000" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="fuelType" rules={{ required: 'Fuel type is required' }} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fuel Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl><SelectTrigger className="h-14 bg-muted/5 border-border/50 rounded-2xl"><SelectValue placeholder="Select Fuel" /></SelectTrigger></FormControl>
                                                <SelectContent className="rounded-2xl">
                                                    <SelectItem value="Petrol">Petrol</SelectItem>
                                                    <SelectItem value="Diesel">Diesel</SelectItem>
                                                    <SelectItem value="Electric">Electric</SelectItem>
                                                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="transmission" rules={{ required: 'Transmission is required' }} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Transmission</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl><SelectTrigger className="h-14 bg-muted/5 border-border/50 rounded-2xl"><SelectValue placeholder="Select Transmission" /></SelectTrigger></FormControl>
                                                <SelectContent className="rounded-2xl">
                                                    <SelectItem value="Automatic">Automatic</SelectItem>
                                                    <SelectItem value="Manual">Manual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </>
                            )}
                        </div>
                    </section>

                    {/* 4. Amenities Section */}
                    <section className="bg-white rounded-3xl border border-border/40 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center space-x-2 mb-8 text-primary">
                            <Zap className="h-6 w-6" />
                            <h3 className="text-xl font-black tracking-tight">Amenities & Features</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                            {(activeType === 'Home' ? PROPERTY_AMENITIES : VEHICLE_AMENITIES).map((amenity) => {
                                const isSelected = selectedAmenities.includes(amenity.id);
                                const Icon = amenity.icon;
                                return (
                                    <button
                                        key={amenity.id}
                                        type="button"
                                        onClick={() => toggleAmenity(amenity.id)}
                                        className={cn(
                                            "flex items-center space-x-3 p-3 rounded-xl border transition-all text-sm font-medium",
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
                    </section>

                    {/* 5. Description Section */}
                    <section className="bg-white rounded-3xl border border-border/40 p-6 md:p-8 shadow-sm">
                        <div className="flex items-center space-x-2 mb-8 text-primary">
                            <FileText className="h-6 w-6" />
                            <h3 className="text-xl font-black tracking-tight">Property Description</h3>
                        </div>
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea placeholder="Describe the unique features of your listing..." className="min-h-[200px] text-lg bg-muted/5 border-border/50 focus:bg-white rounded-2xl p-6 resize-none transition-all shadow-inner" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </section>

                    {/* 6. Verification Section - Only for Non-Agents */}
                    {currentUser?.role !== 'AGENT' && (
                        <section className="bg-white rounded-3xl border border-border/40 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-2 text-primary">
                                    <Shield className="h-6 w-6" />
                                    <h3 className="text-xl font-black tracking-tight">Trust & Verification</h3>
                                </div>
                                <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary px-4 py-1 font-black">Secure</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className={cn("border-2 border-dashed rounded-3xl p-8 transition-all relative group flex flex-col items-center justify-center text-center", ownershipDoc ? "border-green-500/30 bg-green-50/5" : "border-border/40 hover:border-primary/40 hover:bg-primary/5")}>
                                    {ownershipDoc ? (
                                        <div className="space-y-4">
                                            <div className="h-20 w-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm"><FileText className="h-10 w-10 text-green-600" /></div>
                                            <div className="space-y-1">
                                                <p className="font-black text-sm text-foreground truncate max-w-[200px] mx-auto">{ownershipDoc.split('/').pop()}</p>
                                                <p className="text-xs text-muted-foreground font-medium">Document Uploaded Successfully</p>
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setOwnershipDoc(null)} className="text-destructive hover:bg-destructive/10 font-bold rounded-xl">Remove</Button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => docInputRef.current?.click()} className="space-y-4">
                                            <div className="h-20 w-20 bg-muted/10 rounded-full flex items-center justify-center mx-auto transition-colors group-hover:bg-primary/10"><UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" /></div>
                                            <div>
                                                <p className="font-black text-lg text-foreground">Ownership Document</p>
                                                <p className="text-sm text-muted-foreground">PDF or Image up to 10MB</p>
                                            </div>
                                            <input type="file" className="hidden" ref={docInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDocUpload(file); }} />
                                        </button>
                                    )}
                                </div>

                                <div className={cn("border-2 border-dashed rounded-3xl p-8 transition-all relative group flex flex-col items-center justify-center text-center", ownerPhoto ? "border-green-500/30 bg-green-50/5" : "border-border/40 hover:border-primary/40 hover:bg-primary/5")}>
                                    {ownerPhoto ? (
                                        <div className="space-y-4">
                                            <div className="h-24 w-24 rounded-3xl border-4 border-white shadow-xl overflow-hidden mx-auto"><img src={ownerPhoto} className="w-full h-full object-cover" /></div>
                                            <div>
                                                <p className="font-black text-sm text-foreground">Verification Photo</p>
                                                <p className="text-xs text-muted-foreground font-medium">Selfie Captured</p>
                                            </div>
                                            <div className="flex gap-2 justify-center">
                                                <Button type="button" variant="outline" size="sm" onClick={() => setIsCameraOpen(true)} className="rounded-xl font-bold">Retake</Button>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setOwnerPhoto(null)} className="text-destructive hover:bg-destructive/10 font-bold rounded-xl">Remove</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => setIsCameraOpen(true)} className="space-y-4">
                                            <div className="h-20 w-20 bg-muted/10 rounded-full flex items-center justify-center mx-auto transition-colors group-hover:bg-primary/10"><Camera className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" /></div>
                                            <div>
                                                <p className="font-black text-lg text-foreground">Identity Selfie</p>
                                                <p className="text-sm text-muted-foreground">Required for secure verification</p>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 7. Pricing & AI Estimation */}
                    <section className="bg-white rounded-2xl border border-border/50 p-8 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-foreground tracking-tight">Set Your Pricing</h3>
                                    <p className="text-sm text-muted-foreground">The final step to getting your listing live.</p>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleAIEstimate}
                                    disabled={isPredicting}
                                    className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 py-6 h-auto font-bold shadow-md transition-all hover:scale-105"
                                >
                                    {isPredicting && (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    )}
                                    Get AI Price Estimate
                                </Button>
                            </div>

                            <FormField
                                control={form.control}
                                name="price"
                                rules={{ required: 'Price is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative group max-w-md">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/60 font-medium">
                                                    ETB
                                                </div>
                                                <Input
                                                    type="number"
                                                    className="pl-14 h-14 text-xl font-bold bg-muted/5 border border-border/60 focus:border-primary focus:bg-white transition-all rounded-2xl shadow-inner"
                                                    placeholder="00,000"
                                                    {...field}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                                        {watchedFields.listingType === 'rent'
                                                            ? (activeType === 'Home' ? 'ETB / MO' : 'ETB / DAY')
                                                            : 'ETB'}
                                                    </span>
                                                </div>
                                            </div>
                                        </FormControl>
                                    {aiReasoning && (
                                        <div className="mt-8 p-6 bg-white rounded-3xl border border-primary/10 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Zap className="h-6 w-6 fill-current" /></div>
                                                <div>
                                                    <p className="text-[11px] font-black text-primary uppercase tracking-widest mb-2">AI Valuation Strategy</p>
                                                    <p className="text-foreground/80 leading-relaxed font-medium italic">\"{aiReasoning}\"</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {similarListings.length > 0 && (
                                            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center">
                                                        <Shield className="h-3 w-3 mr-2 text-primary" />
                                                        Market Evidence Grounding
                                                    </h4>
                                                    <span className="text-[10px] font-medium text-primary/60">{similarListings.length} Matches Found</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {similarListings.map((listing, idx) => (
                                                        <Link 
                                                            key={listing.id || idx} 
                                                            href={`/property/${listing.id}`}
                                                            target="_blank"
                                                            className="group bg-white border border-border/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block"
                                                        >
                                                            <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                                                                {listing.image ? (
                                                                    <img 
                                                                        src={listing.image} 
                                                                        alt={listing.title} 
                                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                                                                    </div>
                                                                )}
                                                                <div className="absolute top-2 left-2">
                                                                    <Badge className="bg-black/60 backdrop-blur-md text-white border-none text-[10px] px-2 py-0.5">
                                                                        ETB {listing.price?.toLocaleString()}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="p-3 space-y-2">
                                                                <p className="text-[11px] font-bold text-foreground line-clamp-1">{listing.title}</p>
                                                                <div className="flex items-start gap-1.5 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                                                    <Check className="h-2.5 w-2.5 text-primary mt-0.5 shrink-0" />
                                                                    <p className="text-[10px] text-primary/80 font-medium leading-tight">
                                                                        {listing.reason}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </section>

                    {/* Final Action Buttons */}
                    <div className="flex flex-col md:flex-row items-center justify-end gap-6 pt-10 border-t border-border/40">
                        <Button type="button" variant="ghost" onClick={onCancel} className="w-full md:w-auto px-12 h-14 rounded-2xl font-black text-muted-foreground hover:bg-muted/50 text-lg">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-primary text-white px-16 h-14 rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
                            {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : isEditMode ? 'Update Listing' : 'Add Property'}
                        </Button>
                    </div>
                </form>
            </Form>

            <CameraCapture isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />
        </div>
    );
}
