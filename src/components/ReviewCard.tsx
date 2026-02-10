import { Star } from 'lucide-react';
import { Review } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12 bg-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {review.userAvatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-foreground">{review.userName}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(review.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-muted-foreground">{review.comment}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
