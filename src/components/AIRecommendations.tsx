import { Sparkles } from 'lucide-react';
import { PropertyCard } from '@/components/PropertyCard';
import { CarCard } from '@/components/CarCard';
import { mockProperties, mockCars } from '@/data/mockData';

interface AIRecommendationsProps {
  type: 'property' | 'car';
  title?: string;
}

export function AIRecommendations({ type, title = 'AI Recommendations' }: AIRecommendationsProps) {
  const items = type === 'property' ? mockProperties.slice(0, 3) : mockCars.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-accent/5 to-secondary/5 rounded-2xl p-8 border border-border">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-accent p-2 rounded-lg">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl text-foreground">{title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {type === 'property'
          ? items.map((property: any) => (
              <PropertyCard key={property.id} property={property} />
            ))
          : items.map((car: any) => <CarCard key={car.id} car={car} />)}
      </div>
    </div>
  );
}
