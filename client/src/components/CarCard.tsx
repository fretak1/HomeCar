import Link from 'next/link';
import { MapPin, Star, Gauge, Fuel, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatLocation, getListingMainImage } from '@/lib/utils';
import { Property } from '@/store/usePropertyStore';

interface CarCardProps {
  car: Property;
}

export function CarCard({ car }: CarCardProps) {
  const listingTypes = car.listingType?.map(type =>
    type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  ) || [];

  return (
    <Link href={`/property/${car.id}`} className="cursor-pointer">
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border group">
        <div className="relative overflow-hidden">
          <img
            src={getListingMainImage(car)}
            alt={car.title}
            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
          />

          <div className="absolute top-4 left-4 flex flex-wrap gap-1">
            {listingTypes.map((type) => (
              <Badge
                key={type}
                className="bg-white/90 text-[#005a41] border-none text-[10px] font-bold uppercase tracking-wider px-2"
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg text-foreground line-clamp-1 font-bold group-hover:text-primary transition-colors">{car.title}</h3>
              <p className="text-sm text-muted-foreground font-medium">{car.brand} {car.model} {car.year}</p>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-foreground font-bold">{car.rating || 0}</span>
            </div>
          </div>

          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1 text-primary" />
            <span className="text-sm font-medium">{formatLocation(car.location)}</span>
          </div>

          <div className="flex items-center space-x-4 mb-4 text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{car.mileage?.toLocaleString() || 0} km</span>
            </div>
            <div className="flex items-center space-x-1">
              <Fuel className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{car.fuelType}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Settings className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium truncate max-w-[80px]">{car.transmission}</span>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-bold text-primary leading-none">
                <span className="text-xs mr-1 font-semibold opacity-80">ETB</span>
                {car.price.toLocaleString()}
                {listingTypes.some(type => type.toLowerCase().includes('rent') || type.toLowerCase().includes('lease')) && (
                  <span className="text-sm text-muted-foreground font-normal ml-1">/day</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
