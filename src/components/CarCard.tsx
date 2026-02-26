import Link from 'next/link';
import { MapPin, Star, Gauge, Fuel, Settings } from 'lucide-react';
import { Car } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface CarCardProps {
  car: Car;
}

export function CarCard({ car }: CarCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sold':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Link href={`/car/${car.id}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border group">
        <div className="relative overflow-hidden">
          <img
            src={car.image}
            alt={car.title}
            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <Badge
            className={`absolute top-4 right-4 ${getStatusColor(car.status)} border`}
          >
            {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
          </Badge>
        
        
        </div>

        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg text-foreground line-clamp-1">{car.title}</h3>
              <p className="text-sm text-muted-foreground">{car.year}</p>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-foreground">{car.rating}</span>
            </div>
          </div>

          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{car.location}</span>
          </div>

          <div className="flex items-center space-x-4 mb-4 text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Gauge className="h-4 w-4" />
              <span className="text-sm">{car.mileage.toLocaleString()} mi</span>
            </div>
            <div className="flex items-center space-x-1">
              <Fuel className="h-4 w-4" />
              <span className="text-sm">{car.fuelType}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Settings className="h-4 w-4" />
              <span className="text-sm">{car.transmission}</span>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl text-primary">
                ETB {car.price.toLocaleString()}
                {car.listingType.includes('rent') && car.price < 10000 && <span className="text-sm text-muted-foreground">/day</span>}
              </p>
              {car.aiPredictedPrice && (
                <p className="text-xs text-muted-foreground">
                  AI: ETB {car.aiPredictedPrice.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {car.listingType.map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="text-xs border-primary/30 text-primary"
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
