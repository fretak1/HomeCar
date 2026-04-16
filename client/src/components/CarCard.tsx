import Link from 'next/link';
import { MapPin, Star, Gauge, Fuel, Settings, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatLocation, getListingMainImage } from '@/lib/utils';
import { Property } from '@/store/usePropertyStore';
import { useFavoriteStore } from '@/store/useFavoriteStore';
import { useUserStore } from '@/store/useUserStore';
import { cn } from '@/lib/utils';

interface CarCardProps {
  car: Property;
}

export function CarCard({ car }: CarCardProps) {
  const { currentUser } = useUserStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
  const favorite = isFavorite(car.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return; // Prevent action if not logged in

    if (favorite) {
      await removeFavorite(car.id);
    } else {
      await addFavorite(car.id);
    }
  };

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

          <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
            {car.status !== 'AVAILABLE' && (
              <Badge className={cn(
                "border-none shadow-md text-[10px] font-bold uppercase tracking-wider px-2",
                car.status === 'RENTED' || car.status === 'BOOKED' ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
              )}>
                {car.status}
              </Badge>
            )}
            <Button
              variant="secondary"
              size="icon"
              className={`h-8 w-8 rounded-full bg-white/90 shadow-sm hover:bg-white transition-all duration-200 hover:scale-110 ${favorite ? 'text-rose-500' : 'text-gray-500'}`}
              onClick={handleFavoriteClick}
            >
              <Heart className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
            </Button>
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
