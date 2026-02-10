import Link from 'next/link';
import { MapPin, Bed, Bath, Square, Star } from 'lucide-react';
import { Property } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
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
    <Link href={`/property/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border group">
        <div className="relative overflow-hidden">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <Badge
            className={`absolute top-4 right-4 ${getStatusColor(property.status)} border`}
          >
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </Badge>

        </div>

        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg text-foreground line-clamp-1">{property.title}</h3>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-foreground">{property.rating}</span>
            </div>
          </div>

          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.location}</span>
          </div>

          <div className="flex items-center space-x-4 mb-4 text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Bed className="h-4 w-4" />
              <span className="text-sm">{property.bedrooms}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Bath className="h-4 w-4" />
              <span className="text-sm">{property.bathrooms}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Square className="h-4 w-4" />
              <span className="text-sm">{property.area} sq ft</span>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl text-primary">
                ETB {property.price.toLocaleString()}
                {property.listingType.includes('For rent') && <span className="text-sm text-muted-foreground">/mo</span>}
              </p>

            </div>
            <div className="flex flex-wrap gap-1">
              {property.listingType.map((type) => (
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
