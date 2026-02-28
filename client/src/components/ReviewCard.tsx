import { Star } from 'lucide-react';
import { Review } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/utils';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  // Handle both mock and real data
  const userName = review.userName || review.reviewer?.name || 'Anonymous';
  const userAvatar = review.userAvatar || (review.reviewer?.name ? review.reviewer.name.charAt(0) : 'A');
  const date = review.date || review.createdAt;
  const profileImage = review.reviewer?.profileImage;

  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12 bg-primary/10 border border-primary/20">
            {profileImage ? (
              <img src={getImageUrl(profileImage)} alt={userName} className="h-full w-full object-cover rounded-full" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {userAvatar}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-foreground font-semibold">{userName}</h4>
                <p className="text-xs text-muted-foreground">
                  {date ? new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'Recently'}
                </p>
              </div>
              <div className="flex items-center space-x-0.5 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-200'
                      }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed italic">"{review.comment}"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
