"use client";

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
    UploadCloud
} from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface AddItemFormProps {
    onSuccess: (data: any) => void;
    onCancel: () => void;
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

export function AddPropertyForm({ onSuccess, onCancel }: AddItemFormProps) {
    const [activeType, setActiveType] = useState<'property' | 'vehicle'>('property');
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [images, setImages] = useState<(string | null)[]>([null, null, null, null]);
    const [ownershipDoc, setOwnershipDoc] = useState<string | null>(null);

    const form = useForm({
        defaultValues: {
            title: '',
            category: 'apartment',
            price: '',
            location: '',
            description: '',
            // Property specific
            bedrooms: '',
            bathrooms: '',
            area: '',
            // Vehicle specific
            brand: '',
            model: '',
            year: '',
            mileage: '',
            fuelType: '',
            transmission: '',
            listingType: 'rent',
        },
    });

    const watchedFields = useWatch({ control: form.control });

  

    const toggleAmenity = (id: string) => {
        setSelectedAmenities((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        );
    };

    const handleImageUpload = (index: number) => {
        // Mock image upload
        const mockImage = activeType === 'property'
            ? `https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80`
            : `https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80`;

        const newImages = [...images];
        newImages[index] = mockImage;
        setImages(newImages);
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages[index] = null;
        setImages(newImages);
    };

    const onSubmit = (data: any) => {
        const finalData = {
            ...data,
            itemType: activeType,
            amenities: selectedAmenities,
            images: images.filter(Boolean),
            ownershipDocument: ownershipDoc,
        };
        console.log('Submitting item:', finalData);
        onSuccess(finalData);
    };
  
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Tabs defaultValue="property" onValueChange={(v) => setActiveType(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/20 border border-border/50 rounded-xl">
                    <TabsTrigger value="property" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Home className="h-4 w-4 mr-2" />
                        Property
                    </TabsTrigger>
                    <TabsTrigger value="vehicle" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
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
                                Min 4 Photos Recommended
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                        <button
                                            type="button"
                                            onClick={() => handleImageUpload(idx)}
                                            className="flex flex-col items-center space-y-2 w-full h-full justify-center"
                                        >
                                            <div className="p-2 bg-muted/10 rounded-full group-hover:bg-primary/10 transition-colors">
                                                <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Add Photo</span>
                                        </button>
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
                                                    {activeType === 'property' ? <Home className="h-full w-full" /> : <Car className="h-full w-full" />}
                                                </div>
                                                <Input className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white transition-all rounded-xl" placeholder={activeType === 'property' ? "Modern Villa" : "Tesla Model S"} {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="location"
                                rules={{ required: 'Location is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input className="pl-10 h-11 bg-muted/5 border-border/60 focus:bg-white transition-all rounded-xl" placeholder="Full address or city" {...field} />
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

                            {activeType === 'property' && (
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
                                                    <SelectItem value="apartment">Apartment</SelectItem>
                                                    <SelectItem value="compound">Compound</SelectItem>
                                                    <SelectItem value="villa">Villa</SelectItem>
                                                    <SelectItem value="condominium">Condominium</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    </div>

                    {/* 3. Specifications Section */}
                    <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-2 mb-6 text-primary">
                            <Settings2 className="h-5 w-5" />
                            <h3 className="text-lg font-bold">Specifications</h3>
                        </div>

                        {activeType === 'property' ? (
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
                            {(activeType === 'property' ? PROPERTY_AMENITIES : VEHICLE_AMENITIES).map((amenity) => {
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
                                        <h4 className="font-bold text-foreground">proof_of_ownership.pdf</h4>
                                        <p className="text-xs text-muted-foreground">Successfully uploaded for review</p>
                                    </div>
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
                            ) : (
                                <button
                                    type="button"
                                    className="w-full flex flex-col items-center justify-center space-y-4"
                                >
                                    <div className="h-14 w-14 bg-muted/10 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <UploadCloud className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-foreground">Upload Ownership Document</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Please upload  legal document proving ownership.
                                            (PDF, JPG, PNG up to 10MB)
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
                                                            ? (activeType === 'property' ? 'ETB / MO' : 'ETB / DAY')
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
                            className="bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition-all font-bold h-11 px-8"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Add Property
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
