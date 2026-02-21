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
    <div className="bg-gradient-to-br from-accent/5 to-secondary/5 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-accent p-3 rounded-xl shadow-lg shadow-accent/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{title}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {type === 'property'
            ? items.map((property: any) => (
              <PropertyCard key={property.id} property={property} />
            ))
            : items.map((car: any) => <CarCard key={car.id} car={car} />)}
        </div>
      </div>
    </div>
  );
}
