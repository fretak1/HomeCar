"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Home, Car, ChartCandlestick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SearchBarProps {
  onSearch?: (filters: any) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [listingType, setListingType] = useState('rent');
  const [priceRange, setPriceRange] = useState('');
  const [activeTab, setActiveTab] = useState<'property' | 'vehicle'>('property');

  const onTabChange = (value: string) => {
    setActiveTab(value as 'property' | 'vehicle');
    setListingType('rent'); // Reset to rent when switching tabs
  };

  const listingTypes = [
    { value: 'rent', label: 'For Rent' },
    { value: 'buy', label: 'For Sale' },
  ];

  const CategoryIcon = activeTab === 'property' ? Home : Car;
  const categoryPlaceholder = 'Listing Type';

  const propertyPrices = [
    { value: '0-10k', label: 'ETB 0 - 10k' },
    { value: '10k-50k', label: 'ETB 10k - 50k' },
    { value: '50k-100k', label: 'ETB 50k - 100k' },
    { value: '100k+', label: 'ETB 100k+' },
  ];

  const vehiclePrices = [
    { value: '0-500k', label: 'ETB 0 - 500k' },
    { value: '500k-1m', label: 'ETB 500k - 1M' },
    { value: '1m-3m', label: 'ETB 1M - 3M' },
    { value: '3m+', label: 'ETB 3M+' },
  ];

  const currentPrices = activeTab === 'property' ? propertyPrices : vehiclePrices;

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (location) params.set('location', location);
    if (listingType) params.set('listingType', listingType);
    params.set('searchType', activeTab);

    // Parse price range simple mapping
    if (priceRange && priceRange !== 'all') {
      const parseValue = (val: string) => {
        const numeric = parseFloat(val.replace(/[km\+]/g, ''));
        if (val.toLowerCase().includes('m')) return numeric * 1000000;
        if (val.toLowerCase().includes('k')) return numeric * 1000;
        return numeric;
      };

      if (priceRange.includes('+')) {
        params.set('priceMin', parseValue(priceRange).toString());
      } else {
        const [min, max] = priceRange.split('-');
        params.set('priceMin', parseValue(min).toString());
        params.set('priceMax', parseValue(max).toString());
      }
    }

    if (onSearch) {
      onSearch({ location, listingType, priceRange, activeTab });
    }

    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-6 border border-border">
      <Tabs defaultValue="property" className="w-full" onValueChange={onTabChange}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
          <TabsTrigger value="property">Properties</TabsTrigger>
          <TabsTrigger value="vehicle">Cars</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="City"
              className="pl-10 h-12 bg-input-background border-border"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <Select value={listingType} onValueChange={setListingType}>
            <SelectTrigger className="h-12 bg-input-background border-border uppercase">
              <CategoryIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              <SelectValue placeholder={categoryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {listingTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="h-12 bg-input-background border-border">
              <ChartCandlestick />
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              {currentPrices.map((price) => (
                <SelectItem key={price.value} value={price.value}>
                  {price.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="h-12 bg-primary hover:bg-primary/90"
            size="lg"
            onClick={handleSearch}
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
