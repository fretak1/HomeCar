import Link from 'next/link';
import { toast } from 'sonner';
import { MapPin, Bed, Bath, Square, Star, Pencil, Trash2, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatLocation, getListingMainImage } from '@/lib/utils';
import { Property } from '@/store/usePropertyStore';
import { useFavoriteStore } from '@/store/useFavoriteStore';
import { useUserStore } from '@/store/useUserStore';
import { cn } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  disabled?: boolean;
}

export function PropertyCard({ property, onEdit, onDelete, disabled }: PropertyCardProps) {
  const { currentUser } = useUserStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
  const favorite = isFavorite(property.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      toast.error("Please log in to add favorites");
      return;
    }
    if (disabled) return;

    if (favorite) {
      await removeFavorite(property.id);
    } else {
      await addFavorite(property.id);
    }
  };

  return (
    <Link
      href={disabled ? '#' : `/property/${property.id}`}
      className={cn(disabled && "cursor-not-allowed")}
      onClick={(e) => disabled && e.preventDefault()}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 border-border group",
        !disabled && "hover:shadow-xl",
        disabled && "opacity-80 grayscale-[0.5]"
      )}>
        <div className="relative overflow-hidden">
          <img
            src={getListingMainImage(property)}
            alt={property.title}
            className={cn(
              "w-full h-56 object-cover transition-transform duration-300",
              !disabled && "group-hover:scale-110"
            )}
          />


          {/* Top Left Corner (Listing Type: Rent / Buy) */}
          <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-1.5 pt-0.5 pl-0.5">
            {property.listingType?.filter((type: any) => 
              type.toUpperCase() !== property.status.toUpperCase() && 
              type.toUpperCase() !== 'AVAILABLE'
            ).map((type: any) => (
              <Badge
                key={type}
                className="bg-white/90 text-[#005a41] border-none shadow-sm text-[10px] font-black uppercase tracking-widest px-2 py-0.5 gap-1"
              >
                {type.replace('_', ' ')}
              </Badge>
            ))}
          </div>

          <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5 pt-0.5 pr-0.5">
            {/* Display status */}
            {property.isVerified && (
              <Badge className={cn(
                "border-none shadow-md text-[10px] font-black uppercase tracking-widest px-2 py-0.5",
                property.status === 'AVAILABLE' ? "bg-emerald-500 text-white" :
                (property.status === 'RENTED' || property.status === 'BOOKED' ? "bg-amber-500 text-white" : "bg-rose-500 text-white")
              )}>
                {property.status}
              </Badge>
            )}

            {/* Verification status */}
            {!property.isVerified && (
              <div className="flex flex-col items-end gap-1">
                <Badge
                  className={cn(
                      "border shadow-none text-[10px] font-black uppercase tracking-widest px-2 py-0.5",
                      property.rejectionReason 
                          ? "bg-rose-50 text-rose-700 border-rose-100" 
                          : "bg-amber-50 text-amber-700 border-amber-100"
                  )}
                >
                  {property.rejectionReason ? 'Rejected' : 'Pending Verification'}
                </Badge>
              </div>
            )}

            {/* Heart icon */}
            {currentUser?.id !== property.ownerId && (
              <Button
                variant="secondary"
                size="icon"
                disabled={disabled}
                className={cn(
                  "h-8 w-8 rounded-full bg-white/90 shadow-md hover:bg-white transition-all duration-200 mt-1",
                  !disabled && 'hover:scale-110',
                  favorite ? 'text-rose-500' : 'text-gray-500'
                )}
                onClick={handleFavoriteClick}
              >
                <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
              </Button>
            )}
          </div>

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
            <span className="text-sm">{formatLocation(property.location)}</span>
          </div>

          <div className="flex items-center space-x-4 mb-4 text-muted-foreground">
            {property.assetType === 'HOME' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-[10px] uppercase">{property.brand}</Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">{property.transmission}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">{property.mileage?.toLocaleString()} km</span>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-center mt-auto pt-2">
            <div className="flex flex-col items-start leading-tight">
              <div className="flex items-baseline gap-1 text-primary whitespace-nowrap">
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">ETB</span>
                <span className="text-xl font-bold">{property.price.toLocaleString()}</span>
                {property.listingType.includes('For rent') && (
                  <span className="text-xs text-muted-foreground">/mo</span>
                )}
              </div>
            </div>
            <div className="flex gap-1.5">
              {onEdit && (
                <Button
                  variant="outline"
                  disabled={disabled}
                  className="h-8 text-xs text-[#005a41] border-[#005a41]/20 hover:bg-[#005a41] hover:text-white transition-all duration-200 px-2.5"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disabled) onEdit(property);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  disabled={disabled}
                  className="h-8 text-xs text-rose-500 border-rose-200 hover:bg-rose-500 hover:text-white transition-all duration-200 px-2.5"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disabled) onDelete(property);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
