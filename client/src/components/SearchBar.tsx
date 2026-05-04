"use client";

import { useState, useRef } from 'react';
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

import { ethiopiaLocations } from '@/lib/ethiopiaLocations';
import { useTranslation } from '@/contexts/LanguageContext';

interface SearchBarProps {
  onSearch?: (filters: any) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [location, setLocation] = useState('any');
  
  // Extract all unique cities from the hierarchical data
  const allCities = Object.values(ethiopiaLocations).flatMap(regionObj => 
    Object.keys(regionObj)
  ).sort();

  const [listingType, setListingType] = useState('rent');
  const [priceRange, setPriceRange] = useState('');
  const [activeTab, setActiveTab] = useState<'property' | 'vehicle'>('property');
  const isSelectingRef = useRef(false);

  const onTabChange = (value: string) => {
    setActiveTab(value as 'property' | 'vehicle');
    setListingType('rent'); // Reset to rent when switching tabs
  };

  // Synchronously block ghost clicks by intercepting click events at the capture phase
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      isSelectingRef.current = true;
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 400);
    }
  };

  const blockGhostClick = (e: React.SyntheticEvent) => {
    if (isSelectingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const listingTypes = [
    { value: 'rent', label: t('searchBar.forRent') },
    { value: 'buy', label: t('searchBar.forSale') },
  ];

  const CategoryIcon = activeTab === 'property' ? Home : Car;
  const categoryPlaceholder = t('searchBar.listingType');

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

    if (location && location !== 'any') params.set('city', location.trim());
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
          <TabsTrigger value="property">{t('searchBar.properties')}</TabsTrigger>
          <TabsTrigger value="vehicle">{t('searchBar.cars')}</TabsTrigger>
        </TabsList>

        <div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 relative"
          onClickCapture={blockGhostClick}
          onPointerDownCapture={blockGhostClick}
          onPointerUpCapture={blockGhostClick}
          onTouchStartCapture={blockGhostClick}
          onTouchEndCapture={blockGhostClick}
          onMouseDownCapture={blockGhostClick}
          onMouseUpCapture={blockGhostClick}
        >
          <Select value={location} onValueChange={setLocation} onOpenChange={handleOpenChange}>
            <SelectTrigger className="h-12 bg-input-background border-border">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <SelectValue placeholder={t('searchBar.selectCity')} />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
              <SelectItem value="any">{t('searchBar.searchAllCities')}</SelectItem>
              {allCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={listingType} onValueChange={setListingType} onOpenChange={handleOpenChange}>
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

          <Select value={priceRange} onValueChange={setPriceRange} onOpenChange={handleOpenChange}>
            <SelectTrigger className="h-12 bg-input-background border-border">
              <ChartCandlestick />
              <SelectValue placeholder={t('searchBar.priceRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('searchBar.allPrices')}</SelectItem>
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
            {t('searchBar.search')}
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
